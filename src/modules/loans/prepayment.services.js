import {
  getLoanContractByApplicationId,
  getPendingEmisByLoanId,
  deleteEmisByLoanId,
  createEmiSchedule,
  updateLoanContractPrincipal,
  createPrepaymentRecord
} from "./prepayment.repositories.js";
import { LOAN_CONTRACT_STATUS, EMI_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

/**
 * Calculate EMI using reducing balance method
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

/**
 * Calculate prepayment details
 */
export async function calculatePrepaymentService(db, session, loanId) {
  const contract = await getLoanContractByApplicationId(db, session, loanId);
  if (!contract) {
    throw new Error("LOAN_CONTRACT_NOT_FOUND");
  }

  if (contract.loanStatus !== LOAN_CONTRACT_STATUS.ACTIVE && contract.loanStatus !== LOAN_CONTRACT_STATUS.DISBURSED) {
    throw new Error("LOAN_NOT_ACTIVE");
  }

  // Get paid EMIs to calculate remaining principal
  const allEmis = await db
    .collection("emi_schedule")
    .find({ loanId: new ObjectId(loanId) }, { session })
    .sort({ emiNumber: 1 })
    .toArray();

  const paidEmis = allEmis.filter((e) => e.status === EMI_STATUS.PAID);
  const pendingEmis = allEmis.filter((e) => e.status !== EMI_STATUS.PAID);

  // Calculate remaining principal from pending EMIs
  // Use the first pending EMI's remainingPrincipal, or last paid EMI's if no pending
  let remainingPrincipal = contract.principalAmount;
  if (pendingEmis.length > 0) {
    const firstPendingEmi = pendingEmis[0];
    remainingPrincipal = firstPendingEmi.remainingPrincipal || contract.principalAmount;
  } else if (paidEmis.length > 0) {
    const lastPaidEmi = paidEmis[paidEmis.length - 1];
    remainingPrincipal = lastPaidEmi.remainingPrincipal || 0;
  }

  // Calculate interest savings for different prepayment amounts
  const currentRate = contract.interestRate;
  const remainingTenure = pendingEmis.length;

  return {
    loanId,
    contractId: contract._id.toString(),
    currentPrincipal: contract.principalAmount,
    remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
    remainingTenure,
    interestRate: currentRate,
    currentEmiAmount: contract.emiAmount,
    prepaymentOptions: [
      {
        prepaymentAmount: Math.round(remainingPrincipal * 0.25 * 100) / 100,
        newPrincipal: Math.round(remainingPrincipal * 0.75 * 100) / 100,
        estimatedInterestSavings: Math.round(remainingPrincipal * 0.25 * currentRate * 0.01 * 100) / 100
      },
      {
        prepaymentAmount: Math.round(remainingPrincipal * 0.5 * 100) / 100,
        newPrincipal: Math.round(remainingPrincipal * 0.5 * 100) / 100,
        estimatedInterestSavings: Math.round(remainingPrincipal * 0.5 * currentRate * 0.01 * 100) / 100
      },
      {
        prepaymentAmount: Math.round(remainingPrincipal * 0.75 * 100) / 100,
        newPrincipal: Math.round(remainingPrincipal * 0.25 * 100) / 100,
        estimatedInterestSavings: Math.round(remainingPrincipal * 0.75 * currentRate * 0.01 * 100) / 100
      }
    ]
  };
}

/**
 * Process prepayment
 */
export async function processPrepaymentService(db, session, loanId, payload) {
  const contract = await getLoanContractByApplicationId(db, session, loanId);
  if (!contract) {
    throw new Error("LOAN_CONTRACT_NOT_FOUND");
  }

  if (contract.loanStatus !== LOAN_CONTRACT_STATUS.ACTIVE && contract.loanStatus !== LOAN_CONTRACT_STATUS.DISBURSED) {
    throw new Error("LOAN_NOT_ACTIVE");
  }

  const prepaymentAmount = payload.prepaymentAmount;

  // Get all EMIs
  const allEmis = await db
    .collection("emi_schedule")
    .find({ loanId: new ObjectId(loanId) }, { session })
    .sort({ emiNumber: 1 })
    .toArray();

  const paidEmis = allEmis.filter((e) => e.status === EMI_STATUS.PAID);
  const pendingEmis = allEmis.filter((e) => e.status !== EMI_STATUS.PAID);

  if (pendingEmis.length === 0) {
    throw new Error("NO_PENDING_EMIS");
  }

  // Calculate current remaining principal
  // Use the first pending EMI's remainingPrincipal, or last paid EMI's if no pending
  let remainingPrincipal = contract.principalAmount;
  if (pendingEmis.length > 0) {
    const firstPendingEmi = pendingEmis[0];
    remainingPrincipal = firstPendingEmi.remainingPrincipal || contract.principalAmount;
  } else if (paidEmis.length > 0) {
    const lastPaidEmi = paidEmis[paidEmis.length - 1];
    remainingPrincipal = lastPaidEmi.remainingPrincipal || 0;
  }

  // Validate prepayment amount
  if (prepaymentAmount > remainingPrincipal) {
    throw new Error("PREPAYMENT_AMOUNT_EXCEEDS_REMAINING_PRINCIPAL");
  }

  // Calculate new principal after prepayment
  const newPrincipal = remainingPrincipal - prepaymentAmount;

  // Delete pending EMIs
  await deleteEmisByLoanId(db, session, loanId);

  // Update contract principal
  await updateLoanContractPrincipal(db, session, contract._id, newPrincipal);

  // Generate new EMI schedule with reduced principal
  const newTenure = pendingEmis.length; // Keep same number of EMIs
  const emiAmount = calculateEMI(newPrincipal, contract.interestRate, newTenure);

  const emiRecords = [];
  let currentPrincipal = newPrincipal;
  const today = new Date();
  const lastPaidEmiDate = paidEmis.length > 0 ? paidEmis[paidEmis.length - 1].dueDate : contract.disbursementDate || today;

  for (let month = 1; month <= newTenure; month++) {
    const dueDate = new Date(lastPaidEmiDate);
    dueDate.setMonth(dueDate.getMonth() + month);

    const monthlyRate = contract.interestRate / 12 / 100;
    const interestComponent = currentPrincipal * monthlyRate;
    const principalComponent = emiAmount - interestComponent;
    currentPrincipal = currentPrincipal - principalComponent;

    const interest = Math.round(interestComponent * 100) / 100;
    const principalComp = Math.round(principalComponent * 100) / 100;
    const remaining = Math.max(0, Math.round(currentPrincipal * 100) / 100);

    emiRecords.push({
      loanId: new ObjectId(loanId),
      contractId: contract._id,
      emiNumber: paidEmis.length + month,
      dueDate,
      emiAmount: Math.round(emiAmount * 100) / 100,
      principalComponent: principalComp,
      interestComponent: interest,
      remainingPrincipal: remaining,
      status: EMI_STATUS.PENDING,
      createdAt: new Date()
    });
  }

  // Adjust last EMI
  if (emiRecords.length > 0) {
    const lastEmi = emiRecords[emiRecords.length - 1];
    lastEmi.remainingPrincipal = 0;
    lastEmi.principalComponent = lastEmi.remainingPrincipal + lastEmi.principalComponent;
  }

  await createEmiSchedule(db, session, emiRecords);

  // Create prepayment record
  const prepayment = await createPrepaymentRecord(db, session, {
    loanId: new ObjectId(loanId),
    contractId: contract._id,
    prepaymentAmount,
    previousPrincipal: remainingPrincipal,
    newPrincipal,
    paymentMode: payload.paymentMode || "CASH",
    createdAt: new Date()
  });

  // Create payment record
  await db.collection("payments").insertOne(
    {
      loanId: new ObjectId(loanId),
      emiId: null,
      amount: prepaymentAmount,
      paymentMode: payload.paymentMode || "CASH",
      status: "SUCCESS",
      transactionId: `PREPAYMENT_${prepayment._id}`,
      isPrepayment: true,
      createdAt: new Date()
    },
    { session }
  );

  return {
    prepaymentId: prepayment._id.toString(),
    loanId,
    contractId: contract._id.toString(),
    prepaymentAmount,
    previousPrincipal: remainingPrincipal,
    newPrincipal,
    newEmiAmount: Math.round(emiAmount * 100) / 100,
    remainingTenure: newTenure
  };
}

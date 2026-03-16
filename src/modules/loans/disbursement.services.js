import {
  getLoanContractByApplicationId,
  updateLoanContract,
  createDisbursement,
  listDisbursements,
  getDisbursementByLoanId
} from "./disbursement.repositories.js";
import { LOAN_CONTRACT_STATUS, LOAN_APPLICATION_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

export async function disburseLoanService(db, session, loanId, payload) {
  // Get loan application
  const loan = await db.collection("loan_applications").findOne(
    { _id: new ObjectId(loanId) },
    { session }
  );

  if (!loan) {
    throw new Error("LOAN_NOT_FOUND");
  }

  if (loan.status !== LOAN_APPLICATION_STATUS.APPROVED) {
    throw new Error("LOAN_NOT_APPROVED");
  }

  // Get loan contract
  const contract = await getLoanContractByApplicationId(db, session, loanId);
  if (!contract) {
    throw new Error("LOAN_CONTRACT_NOT_FOUND");
  }

  if (contract.loanStatus !== LOAN_CONTRACT_STATUS.APPROVED) {
    throw new Error("CONTRACT_NOT_APPROVED");
  }

  const disbursementDate = payload.disbursementDate ? new Date(payload.disbursementDate) : new Date();

  // Update loan contract
  await updateLoanContract(db, session, contract._id, {
    disbursedAmount: payload.disbursedAmount,
    disbursementDate,
    loanStatus: LOAN_CONTRACT_STATUS.DISBURSED
  });

  // Update loan application status
  await db.collection("loan_applications").updateOne(
    { _id: new ObjectId(loanId) },
    {
      $set: {
        status: LOAN_APPLICATION_STATUS.DISBURSED,
        updatedAt: new Date()
      }
    },
    { session }
  );

  // Create disbursement record
  const disbursement = await createDisbursement(db, session, {
    loanId: new ObjectId(loanId),
    contractId: contract._id,
    customerId: loan.customerId,
    dealerId: loan.dealerId,
    lenderId: contract.lenderId,
    disbursedAmount: payload.disbursedAmount,
    disbursementDate
  });

  return {
    disbursementId: disbursement._id.toString(),
    loanId: loan._id.toString(),
    contractId: contract._id.toString(),
    disbursedAmount: payload.disbursedAmount,
    disbursementDate
  };
}

export async function listDisbursementsService(db, session, user) {
  let filter = {};

  if (user.role === "LENDER" && user.lenderId) {
    filter.lenderId = new ObjectId(user.lenderId);
  } else if (user.role === "DEALER" && user.dealerId) {
    filter.dealerId = new ObjectId(user.dealerId);
  }

  const disbursements = await listDisbursements(db, session, filter);
  return disbursements.map((d) => ({
    ...d,
    id: d._id.toString(),
    loanId: d.loanId ? d.loanId.toString() : null,
    contractId: d.contractId ? d.contractId.toString() : null,
    customerId: d.customerId ? d.customerId.toString() : null,
    dealerId: d.dealerId ? d.dealerId.toString() : null,
    lenderId: d.lenderId ? d.lenderId.toString() : null
  }));
}

export async function getDisbursementByLoanService(db, session, loanId) {
  const disbursement = await getDisbursementByLoanId(db, session, loanId);
  if (!disbursement) return null;
  return {
    ...disbursement,
    id: disbursement._id.toString(),
    loanId: disbursement.loanId ? disbursement.loanId.toString() : null,
    contractId: disbursement.contractId ? disbursement.contractId.toString() : null,
    customerId: disbursement.customerId ? disbursement.customerId.toString() : null,
    dealerId: disbursement.dealerId ? disbursement.dealerId.toString() : null,
    lenderId: disbursement.lenderId ? disbursement.lenderId.toString() : null
  };
}

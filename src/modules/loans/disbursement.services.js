import {
  getLoanContractByApplicationId,
  updateLoanContract,
  createDisbursement,
  listDisbursements,
  getDisbursementByLoanId
} from "./disbursement.repositories.js";
import { createLedgerEntryService } from "../ledger/ledgerEntry.services.js";
import { LOAN_CONTRACT_STATUS, LOAN_APPLICATION_STATUS, LEDGER_ACCOUNT_TYPES, LEDGER_TRANSACTION_TYPES } from "../../utils/constants.js";
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

  // Create ledger entry for disbursement
  // Find or create customer loan account
  let customerLoanAccount = await db.collection("ledger_accounts").findOne(
    {
      accountType: LEDGER_ACCOUNT_TYPES.CUSTOMER_LOAN_ACCOUNT,
      ownerId: loan.customerId,
      ownerType: "customer"
    },
    { session }
  );

  if (!customerLoanAccount) {
    // Auto-create customer loan account if it doesn't exist
    const customer = await db.collection("customers").findOne(
      { _id: loan.customerId },
      { session }
    );
    const accountName = customer ? `Loan Account - ${customer.name}` : `Loan Account - Customer ${loan.customerId}`;
    
    const result = await db.collection("ledger_accounts").insertOne(
      {
        accountName,
        accountType: LEDGER_ACCOUNT_TYPES.CUSTOMER_LOAN_ACCOUNT,
        ownerId: loan.customerId,
        ownerType: "customer",
        balance: 0,
        createdAt: new Date()
      },
      { session }
    );
    customerLoanAccount = {
      _id: result.insertedId,
      accountName,
      accountType: LEDGER_ACCOUNT_TYPES.CUSTOMER_LOAN_ACCOUNT,
      ownerId: loan.customerId,
      ownerType: "customer",
      balance: 0
    };
  }

  // Find or create lender settlement account
  let lenderSettlementAccount = await db.collection("ledger_accounts").findOne(
    {
      accountType: LEDGER_ACCOUNT_TYPES.LENDER_SETTLEMENT_ACCOUNT,
      ownerId: contract.lenderId,
      ownerType: "lender"
    },
    { session }
  );

  if (!lenderSettlementAccount) {
    // Auto-create lender settlement account if it doesn't exist
    const lender = await db.collection("lenders").findOne(
      { _id: contract.lenderId },
      { session }
    );
    const accountName = lender ? `Settlement Account - ${lender.lenderName}` : `Settlement Account - Lender ${contract.lenderId}`;
    
    const result = await db.collection("ledger_accounts").insertOne(
      {
        accountName,
        accountType: LEDGER_ACCOUNT_TYPES.LENDER_SETTLEMENT_ACCOUNT,
        ownerId: contract.lenderId,
        ownerType: "lender",
        balance: 0,
        createdAt: new Date()
      },
      { session }
    );
    lenderSettlementAccount = {
      _id: result.insertedId,
      accountName,
      accountType: LEDGER_ACCOUNT_TYPES.LENDER_SETTLEMENT_ACCOUNT,
      ownerId: contract.lenderId,
      ownerType: "lender",
      balance: 0
    };
  }

  // Create ledger entry with double-entry accounting
  await createLedgerEntryService(db, session, {
    referenceType: "loan",
    referenceId: loanId,
    description: `Loan disbursement of ₹${payload.disbursedAmount} for loan ${loanId}`,
    transactions: [
      {
        accountId: customerLoanAccount._id.toString(),
        type: LEDGER_TRANSACTION_TYPES.DEBIT,
        amount: payload.disbursedAmount
      },
      {
        accountId: lenderSettlementAccount._id.toString(),
        type: LEDGER_TRANSACTION_TYPES.CREDIT,
        amount: payload.disbursedAmount
      }
    ]
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

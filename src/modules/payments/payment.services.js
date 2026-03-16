import {
  createPayment,
  updatePaymentStatus,
  listPayments,
  getPaymentById,
  getPaymentsByLoanId,
  getEmiById,
  updateEmiStatus
} from "./payment.repositories.js";
import { EMI_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

export async function payEmiService(db, session, emiId, payload) {
  const emi = await getEmiById(db, session, emiId);
  if (!emi) {
    throw new Error("EMI_NOT_FOUND");
  }

  if (emi.status === EMI_STATUS.PAID) {
    throw new Error("EMI_ALREADY_PAID");
  }

  const paymentAmount = payload.amount;
  const emiAmount = emi.emiAmount;

  // Create payment record
  const payment = await createPayment(db, session, {
    loanId: emi.loanId,
    emiId: new ObjectId(emiId),
    amount: paymentAmount,
    paymentMode: payload.paymentMode,
    transactionId: payload.transactionId || null
  });

  // Update payment status to SUCCESS
  await updatePaymentStatus(db, session, payment._id, "SUCCESS", {
    paidAt: new Date()
  });

  // Update EMI status
  let emiStatus = EMI_STATUS.PAID;
  if (paymentAmount < emiAmount) {
    emiStatus = EMI_STATUS.PARTIAL;
  }

  await updateEmiStatus(db, session, emiId, {
    status: emiStatus,
    paidAmount: paymentAmount,
    paidAt: new Date()
  });

  return {
    paymentId: payment._id.toString(),
    emiId,
    amount: paymentAmount,
    status: "SUCCESS"
  };
}

export async function createPaymentService(db, session, payload) {
  const { loanId, emiId, amount, paymentMode, transactionId } = payload;

  // If emiId provided, validate it belongs to loan
  if (emiId) {
    const emi = await getEmiById(db, session, emiId);
    if (!emi || emi.loanId.toString() !== loanId) {
      throw new Error("EMI_NOT_FOUND_OR_MISMATCH");
    }
  }

  const payment = await createPayment(db, session, {
    loanId: new ObjectId(loanId),
    emiId: emiId ? new ObjectId(emiId) : null,
    amount,
    paymentMode,
    transactionId: transactionId || null
  });

  return {
    ...payment,
    id: payment._id.toString(),
    loanId: payment.loanId.toString(),
    emiId: payment.emiId ? payment.emiId.toString() : null
  };
}

export async function listPaymentsService(db, session, user) {
  let filter = {};

  if (user.role === "DEALER" && user.dealerId) {
    // Get loans for this dealer
    const loans = await db
      .collection("loan_applications")
      .find({ dealerId: new ObjectId(user.dealerId) }, { session })
      .toArray();
    const loanIds = loans.map((l) => l._id);
    filter.loanId = { $in: loanIds.map((id) => new ObjectId(id)) };
  } else if (user.role === "LENDER" && user.lenderId) {
    // Get contracts for this lender, then get loans
    const contracts = await db
      .collection("loan_contracts")
      .find({ lenderId: new ObjectId(user.lenderId) }, { session })
      .toArray();
    const loanApplicationIds = contracts.map((c) => c.loanApplicationId);
    filter.loanId = { $in: loanApplicationIds.map((id) => new ObjectId(id)) };
  }

  const payments = await listPayments(db, session, filter);
  return payments.map((p) => ({
    ...p,
    id: p._id.toString(),
    loanId: p.loanId ? p.loanId.toString() : null,
    emiId: p.emiId ? p.emiId.toString() : null
  }));
}

export async function getPaymentService(db, session, paymentId) {
  const payment = await getPaymentById(db, session, paymentId);
  if (!payment) return null;
  return {
    ...payment,
    id: payment._id.toString(),
    loanId: payment.loanId ? payment.loanId.toString() : null,
    emiId: payment.emiId ? payment.emiId.toString() : null
  };
}

export async function getPaymentsByLoanService(db, session, loanId) {
  const payments = await getPaymentsByLoanId(db, session, loanId);
  return payments.map((p) => ({
    ...p,
    id: p._id.toString(),
    loanId: p.loanId ? p.loanId.toString() : null,
    emiId: p.emiId ? p.emiId.toString() : null
  }));
}

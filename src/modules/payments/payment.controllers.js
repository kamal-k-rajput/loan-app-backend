import {
  payEmiService,
  createPaymentService,
  listPaymentsService,
  getPaymentService,
  getPaymentsByLoanService
} from "./payment.services.js";
import { ROLES } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

export async function payEmiController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await payEmiService(db, session, req.params.emiId, req.body);
    return res.success(result, "EMI_PAID");
  } catch (err) {
    if (err.message === "EMI_NOT_FOUND") {
      return res.fail(404, "EMI_NOT_FOUND");
    }
    if (err.message === "EMI_ALREADY_PAID") {
      return res.fail(400, "EMI_ALREADY_PAID");
    }
    next(err);
  }
}

export async function createPaymentController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const payment = await createPaymentService(db, session, req.body);
    return res.success(payment, "PAYMENT_CREATED");
  } catch (err) {
    if (err.message === "EMI_NOT_FOUND_OR_MISMATCH") {
      return res.fail(404, "EMI_NOT_FOUND_OR_MISMATCH");
    }
    next(err);
  }
}

export async function listPaymentsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const payments = await listPaymentsService(db, session, req.user);
    return res.success(payments, "PAYMENTS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getPaymentController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const payment = await getPaymentService(db, session, req.params.paymentId);
    if (!payment) return res.fail(404, "PAYMENT_NOT_FOUND");
    return res.success(payment, "PAYMENT_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function getPaymentsByLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const payments = await getPaymentsByLoanService(db, session, req.params.loanId);
    return res.success(payments, "PAYMENTS_BY_LOAN");
  } catch (err) {
    next(err);
  }
}

export async function razorpayCreateOrderController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    const { emiId, amount } = req.body;

    // Get EMI details
    const emi = await db
      .collection("emi_schedule")
      .findOne({ _id: new ObjectId(emiId) }, { session });

    if (!emi) {
      return res.fail(404, "EMI_NOT_FOUND");
    }

    // In production, call Razorpay API to create order
    // For now, simulate order creation
    const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store order in database (you might want a separate orders collection)
    const order = {
      emiId: new ObjectId(emiId),
      loanId: emi.loanId,
      amount,
      razorpayOrderId,
      status: "CREATED",
      createdAt: new Date()
    };

    return res.success(
      {
        orderId: razorpayOrderId,
        amount,
        currency: "INR",
        emiId
      },
      "RAZORPAY_ORDER_CREATED"
    );
  } catch (err) {
    next(err);
  }
}

export async function razorpayWebhookController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;

    // In production, verify webhook signature from Razorpay
    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const { order_id, payment_id, amount } = payload.payment.entity;

      // Find order by razorpayOrderId
      // Update payment status
      // Update EMI status

      return res.success({ received: true }, "WEBHOOK_PROCESSED");
    }

    return res.success({ received: true }, "WEBHOOK_RECEIVED");
  } catch (err) {
    next(err);
  }
}

export async function razorpayVerifyController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // In production, verify signature using Razorpay secret
    // For now, simulate verification
    const isValid = true;

    if (isValid) {
      // Update payment status
      // Update EMI status
      return res.success(
        {
          verified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id
        },
        "PAYMENT_VERIFIED"
      );
    } else {
      return res.fail(400, "PAYMENT_VERIFICATION_FAILED");
    }
  } catch (err) {
    next(err);
  }
}

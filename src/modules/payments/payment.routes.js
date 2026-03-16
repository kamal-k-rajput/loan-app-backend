import express from "express";
import {
  payEmiController,
  createPaymentController,
  listPaymentsController,
  getPaymentController,
  getPaymentsByLoanController,
  razorpayCreateOrderController,
  razorpayWebhookController,
  razorpayVerifyController
} from "./payment.controllers.js";
import {
  payEmiSchema,
  createPaymentSchema,
  razorpayCreateOrderSchema,
  razorpayWebhookSchema,
  razorpayVerifySchema
} from "./payment.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", requireAuth, validateBody(createPaymentSchema), createPaymentController);
router.get("/", requireAuth, listPaymentsController);
router.get("/:paymentId", requireAuth, getPaymentController);
router.get("/loan/:loanId", requireAuth, getPaymentsByLoanController);

// Razorpay routes
router.post(
  "/razorpay/create-order",
  requireAuth,
  validateBody(razorpayCreateOrderSchema),
  razorpayCreateOrderController
);
router.post("/razorpay/webhook", validateBody(razorpayWebhookSchema), razorpayWebhookController);
router.post("/razorpay/verify", requireAuth, validateBody(razorpayVerifySchema), razorpayVerifyController);

export const paymentRouter = router;

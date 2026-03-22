import express from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { adminUserRouter } from "../modules/adminUsers/adminUser.routes.js";
import { dealerRouter } from "../modules/dealers/dealer.routes.js";
import { lenderRouter } from "../modules/lenders/lender.routes.js";
import { customerRouter } from "../modules/customers/customer.routes.js";
import { kycRouter } from "../modules/kyc/kyc.routes.js";
import { loanProductRouter } from "../modules/loanProducts/loanProduct.routes.js";
import { interestRateRouter } from "../modules/interestRates/interestRate.routes.js";
import { loanRouter } from "../modules/loans/loan.routes.js";
import { disbursementRouter } from "../modules/loans/disbursement.routes.js";
import { emiRouter } from "../modules/emis/emi.routes.js";
import { paymentRouter } from "../modules/payments/payment.routes.js";
import { collectionRouter } from "../modules/collections/collection.routes.js";
import { npaRouter } from "../modules/npa/npa.routes.js";
import { dashboardRouter } from "../modules/dashboards/dashboard.routes.js";
import { notificationRouter } from "../modules/notifications/notification.routes.js";
import { documentRouter } from "../modules/documents/document.routes.js";
import { auditLogRouter } from "../modules/auditLogs/auditLog.routes.js";
import { ledgerRouter } from "../modules/ledger/ledger.routes.js";
import { reportRouter } from "../modules/reports/report.routes.js";
import { configRouter } from "../modules/config/config.routes.js";
import { uploadRouter } from "../utils/uploads/upload.routes.js";
import { pdfRouter } from "../modules/pdf/pdf.routes.js";

export function registerRoutes(app) {
  const api = express.Router();

  api.use("/auth", authRouter);
  api.use("/admin/users", adminUserRouter);
  api.use("/dealers", dealerRouter);
  api.use("/lenders", lenderRouter);
  api.use("/customers", customerRouter);
  api.use("/kyc", kycRouter);
  api.use("/loan-products", loanProductRouter);
  api.use("/interest-rates", interestRateRouter);
  api.use("/loans", loanRouter);
  api.use("/disbursements", disbursementRouter);
  api.use("/emis", emiRouter);
  api.use("/payments", paymentRouter);
  api.use("/dealer/collections", collectionRouter);
  api.use("/npa", npaRouter);
  api.use("/dashboard", dashboardRouter);
  api.use("/notifications", notificationRouter);
  api.use("/documents", documentRouter);
  api.use("/audit-logs", auditLogRouter);
  api.use("/ledger", ledgerRouter);
  api.use("/reports", reportRouter);
  api.use("/config", configRouter);
  api.use("/uploads", uploadRouter);
  api.use("/pdf", pdfRouter);

  app.use("/api", api);
}

import express from "express";
import {
  getAdminOverviewController,
  getAdminDisbursementController,
  getAdminCollectionsController,
  getAdminNpaController,
  getLenderPortfolioController,
  getLenderDisbursementController,
  getLenderOutstandingController,
  getLenderNpaController,
  getLenderPendingCollectionsController,
  getDealerSalesFunnelController,
  getDealerCollectionsController,
  getDealerEarningsController,
  getCustomerLoansController,
  getCustomerEmisController,
  getCustomerPaymentHistoryController,
} from "./dashboard.controllers.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

// Admin Dashboard Routes
router.get(
  "/admin/overview",
  requireRole(ROLES.ADMIN),
  getAdminOverviewController,
);
router.get(
  "/admin/disbursement",
  requireRole(ROLES.ADMIN),
  getAdminDisbursementController,
);
router.get(
  "/admin/collections",
  requireRole(ROLES.ADMIN),
  getAdminCollectionsController,
);
router.get("/admin/npa", requireRole(ROLES.ADMIN), getAdminNpaController);

// Lender Dashboard Routes
router.get(
  "/lender/portfolio",
  requireRole(ROLES.LENDER),
  getLenderPortfolioController,
);
router.get(
  "/lender/disbursement",
  requireRole(ROLES.LENDER),
  getLenderDisbursementController,
);
router.get(
  "/lender/outstanding",
  requireRole(ROLES.LENDER),
  getLenderOutstandingController,
);
router.get("/lender/npa", requireRole(ROLES.LENDER), getLenderNpaController);
router.get(
  "/lender/pending-collections",
  requireRole(ROLES.LENDER),
  getLenderPendingCollectionsController,
);

// Dealer Dashboard Routes
router.get(
  "/dealer/sales-funnel",
  requireRole(ROLES.DEALER),
  getDealerSalesFunnelController,
);
router.get(
  "/dealer/collections",
  requireRole(ROLES.DEALER),
  getDealerCollectionsController,
);
router.get(
  "/dealer/earnings",
  requireRole(ROLES.DEALER),
  getDealerEarningsController,
);

// Customer Dashboard Routes
router.get("/customer/loans", requireAuth, getCustomerLoansController);
router.get("/customer/emis", requireAuth, getCustomerEmisController);
router.get(
  "/customer/payment-history",
  requireAuth,
  getCustomerPaymentHistoryController,
);

export const dashboardRouter = router;

import express from "express";
import {
  getDisbursementReportController,
  getCollectionsReportController,
  getInterestIncomeReportController,
  getLoanPerformanceReportController,
  getNpaReportController
} from "./report.controllers.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/disbursement", requireAuth, getDisbursementReportController);
router.get("/collections", requireAuth, getCollectionsReportController);
router.get("/interest-income", requireAuth, getInterestIncomeReportController);
router.get("/loan-performance", requireAuth, getLoanPerformanceReportController);
router.get("/npa", requireAuth, getNpaReportController);

export const reportRouter = router;

import express from "express";
import {
  listDisbursementsController,
  getDisbursementByLoanController
} from "./disbursement.controllers.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, listDisbursementsController);
router.get("/:loanId", requireAuth, getDisbursementByLoanController);

export const disbursementRouter = router;

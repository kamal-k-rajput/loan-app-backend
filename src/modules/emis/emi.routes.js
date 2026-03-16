import express from "express";
import {
  listEmisController,
  getEmiController,
  getEmiScheduleByLoanController
} from "./emi.controllers.js";
import { payEmiController } from "../payments/payment.controllers.js";
import { payEmiSchema } from "../payments/payment.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, listEmisController);
router.get("/:emiId", requireAuth, getEmiController);
router.get("/loan/:loanId", requireAuth, getEmiScheduleByLoanController);
router.post("/:emiId/pay", requireAuth, validateBody(payEmiSchema), payEmiController);

export const emiRouter = router;

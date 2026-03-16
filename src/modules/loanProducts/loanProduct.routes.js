import express from "express";
import {
  createLoanProductController,
  listLoanProductsController,
  getLoanProductController,
  updateLoanProductController,
  deleteLoanProductController
} from "./loanProduct.controllers.js";
import { createLoanProductSchema, updateLoanProductSchema } from "./loanProduct.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

router.post(
  "/",
  requireRole(ROLES.ADMIN),
  validateBody(createLoanProductSchema),
  createLoanProductController
);
router.get("/", requireAuth, listLoanProductsController);
router.get("/:productId", requireAuth, getLoanProductController);
router.put(
  "/:productId",
  requireRole(ROLES.ADMIN),
  validateBody(updateLoanProductSchema),
  updateLoanProductController
);
router.delete("/:productId", requireRole(ROLES.ADMIN), deleteLoanProductController);

export const loanProductRouter = router;

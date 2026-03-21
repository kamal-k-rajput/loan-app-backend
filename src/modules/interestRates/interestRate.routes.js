import express from "express";
import {
  createInterestRateController,
  listInterestRatesController,
  listInterestRatesByCategoryController,
  getInterestRateController,
  updateInterestRateController,
  deleteInterestRateController,
  getInterestRatesByLenderController
} from "./interestRate.controllers.js";
import { createInterestRateSchema, updateInterestRateSchema } from "./interestRate.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole(ROLES.LENDER),
  validateBody(createInterestRateSchema),
  createInterestRateController
);
router.get("/", requireRole(ROLES.ADMIN), listInterestRatesController);
router.get(
  "/by-category",
  requireAuth,
  requireRole(ROLES.ADMIN, ROLES.LENDER, ROLES.DEALER),
  listInterestRatesByCategoryController
);
router.get("/lender/:lenderId", requireAuth, getInterestRatesByLenderController);
router.get("/:rateId", requireAuth, getInterestRateController);
router.put(
  "/:rateId",
  requireAuth,
  validateBody(updateInterestRateSchema),
  updateInterestRateController
);
router.delete("/:rateId", requireAuth, deleteInterestRateController);

export const interestRateRouter = router;

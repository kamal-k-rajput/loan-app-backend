import express from "express";
import {
  createLenderController,
  listLendersController,
  getLenderController,
  updateLenderController,
  deleteLenderController,
  lenderPortfolioController,
  lenderCollectionsController
} from "./lender.controllers.js";
import { lenderApprovalRouter } from "./lenderApproval.routes.js";
import { lenderCollectionRouter } from "./lenderCollection.routes.js";
import { createLenderSchema, updateLenderSchema } from "./lender.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

// Only ADMIN can create and list all lenders
router.post(
  "/",
  requireRole(ROLES.ADMIN),
  validateBody(createLenderSchema),
  createLenderController
);
router.get("/", requireRole(ROLES.ADMIN), listLendersController);

// ADMIN can pass any lenderId; LENDER sees only own lender using JWT
router.get("/:lenderId", requireRole(ROLES.ADMIN, ROLES.LENDER), getLenderController);
router.put(
  "/:lenderId",
  requireRole(ROLES.ADMIN, ROLES.LENDER),
  validateBody(updateLenderSchema),
  updateLenderController
);
router.delete("/:lenderId", requireRole(ROLES.ADMIN, ROLES.LENDER), deleteLenderController);

router.get(
  "/:lenderId/portfolio",
  requireRole(ROLES.ADMIN, ROLES.LENDER),
  lenderPortfolioController
);
router.get(
  "/:lenderId/collections",
  requireRole(ROLES.ADMIN, ROLES.LENDER),
  lenderCollectionsController
);

// Lender approval routes
router.use("/", lenderApprovalRouter);
// Lender collection routes
router.use("/", lenderCollectionRouter);

export const lenderRouter = router;


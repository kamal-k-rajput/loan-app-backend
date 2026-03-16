import express from "express";
import {
  approveCollectionController,
  rejectCollectionController,
  getPendingCollectionsController
} from "../collections/collection.controllers.js";
import { approveCollectionSchema, rejectCollectionSchema } from "../collections/collection.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

router.get("/collections/pending", requireRole(ROLES.LENDER), getPendingCollectionsController);
router.put(
  "/collections/:collectionId/approve",
  requireRole(ROLES.LENDER),
  validateBody(approveCollectionSchema),
  approveCollectionController
);
router.put(
  "/collections/:collectionId/reject",
  requireRole(ROLES.LENDER),
  validateBody(rejectCollectionSchema),
  rejectCollectionController
);

export const lenderCollectionRouter = router;

import express from "express";
import {
  recordCollectionController,
  listCollectionsController,
  getCollectionController
} from "./collection.controllers.js";
import { recordCollectionSchema } from "./collection.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

router.post("/record", requireRole(ROLES.DEALER), validateBody(recordCollectionSchema), recordCollectionController);
router.get("/", requireAuth, listCollectionsController);
router.get("/:collectionId", requireAuth, getCollectionController);

export const collectionRouter = router;

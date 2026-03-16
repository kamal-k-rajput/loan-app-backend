import express from "express";
import {
  uploadDocumentController,
  getDocumentController,
  deleteDocumentController
} from "./document.controllers.js";
import { uploadDocumentSchema } from "./document.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", requireAuth, validateBody(uploadDocumentSchema), uploadDocumentController);
router.get("/:documentId", requireAuth, getDocumentController);
router.delete("/:documentId", requireAuth, deleteDocumentController);

export const documentRouter = router;

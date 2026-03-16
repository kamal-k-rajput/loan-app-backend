import express from "express";
import {
  uploadKycController,
  getKycByCustomerController,
  verifyKycController,
  rejectKycController,
  panVerifyController,
  aadharVerifyController
} from "./kyc.controllers.js";
import {
  uploadKycSchema,
  verifyKycSchema,
  rejectKycSchema,
  panVerifySchema,
  aadharVerifySchema
} from "./kyc.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", requireAuth, validateBody(uploadKycSchema), uploadKycController);
router.get("/:customerId", requireAuth, getKycByCustomerController);
router.put("/:customerId/verify", requireAuth, validateBody(verifyKycSchema), verifyKycController);
router.put("/:customerId/reject", requireAuth, validateBody(rejectKycSchema), rejectKycController);

router.post("/pan-verify", requireAuth, validateBody(panVerifySchema), panVerifyController);
router.post("/aadhar-verify", requireAuth, validateBody(aadharVerifySchema), aadharVerifyController);

export const kycRouter = router;

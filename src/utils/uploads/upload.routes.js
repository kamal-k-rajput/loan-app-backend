import express from "express";
import  {getSignedUrl}  from "./uploadController.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/getSignedUrl", requireAuth, getSignedUrl);

export { router as uploadRouter };
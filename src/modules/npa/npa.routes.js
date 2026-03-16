import express from "express";
import {
  getNpa30DaysController,
  getNpa60DaysController,
  getNpa90DaysController,
  getNpaLoansController
} from "./npa.controllers.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/30days", requireAuth, getNpa30DaysController);
router.get("/60days", requireAuth, getNpa60DaysController);
router.get("/90days", requireAuth, getNpa90DaysController);
router.get("/loans", requireAuth, getNpaLoansController);

export const npaRouter = router;

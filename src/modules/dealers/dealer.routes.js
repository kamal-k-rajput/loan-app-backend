import express from "express";
import {
  createDealerController,
  listDealersController,
  getDealerController,
  updateDealerController,
  deleteDealerController,
  dealerLoansController,
  dealerCollectionsController,
  dealerEarningsController
} from "./dealer.controllers.js";
import { createDealerSchema, updateDealerSchema } from "./dealer.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

// Only ADMIN can create and list all dealers
router.post("/", requireRole(ROLES.ADMIN), validateBody(createDealerSchema), createDealerController);
router.get("/", requireRole(ROLES.ADMIN), listDealersController);

// ADMIN can pass any dealerId; DEALER sees only own dealer using JWT
router.get("/:dealerId", requireRole(ROLES.ADMIN, ROLES.DEALER), getDealerController);
router.put(
  "/:dealerId",
  requireRole(ROLES.ADMIN, ROLES.DEALER),
  validateBody(updateDealerSchema),
  updateDealerController
);
router.delete("/:dealerId", requireRole(ROLES.ADMIN, ROLES.DEALER), deleteDealerController);

router.get(
  "/:dealerId/loans",
  requireRole(ROLES.ADMIN, ROLES.DEALER),
  dealerLoansController
);
router.get(
  "/:dealerId/collections",
  requireRole(ROLES.ADMIN, ROLES.DEALER),
  dealerCollectionsController
);
router.get(
  "/:dealerId/earnings",
  requireRole(ROLES.ADMIN, ROLES.DEALER),
  dealerEarningsController
);

export const dealerRouter = router;


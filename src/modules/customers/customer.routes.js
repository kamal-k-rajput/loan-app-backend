import express from "express";
import {
  createCustomerController,
  listCustomersController,
  listDealerCustomersController,
  getCustomerController,
  updateCustomerController,
  deleteCustomerController,
  customerLoansController,
  customerEmisController,
  customerPaymentsController
} from "./customer.controllers.js";
import { createCustomerSchema, updateCustomerSchema } from "./customer.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

// Only dealers (authenticated) can create customers
router.post(
  "/",
  requireRole(ROLES.DEALER),
  validateBody(createCustomerSchema),
  createCustomerController
);

// Auth required for the rest as well
// Only ADMIN can list all customers
router.get("/", requireRole(ROLES.ADMIN), listCustomersController);

// Dealers can list only the customers they created, with pagination and date filter
// Query params: page, limit, startDate, endDate
router.get("/my", requireRole(ROLES.DEALER), listDealerCustomersController);

router.get("/:customerId", requireAuth, getCustomerController);
router.put("/:customerId", requireAuth, validateBody(updateCustomerSchema), updateCustomerController);
router.delete("/:customerId", requireAuth, deleteCustomerController);

router.get("/:customerId/loans", requireAuth, customerLoansController);
router.get("/:customerId/emis", requireAuth, customerEmisController);
router.get("/:customerId/payments", requireAuth, customerPaymentsController);

export const customerRouter = router;


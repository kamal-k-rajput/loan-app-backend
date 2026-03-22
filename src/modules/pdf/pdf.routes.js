import express from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";
import { renderPdfController } from "./pdf.controllers.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mimeOk =
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/octet-stream";
    const nameOk = /\.xlsx?$/i.test(file.originalname || "");
    if (mimeOk || nameOk) {
      return cb(null, true);
    }
    cb(new Error("Only .xlsx or .xls spreadsheets are allowed"));
  }
});

const router = express.Router();

const multipartOnly = (req, res, next) => {
  if (!(req.headers["content-type"] || "").includes("multipart/form-data")) {
    return next();
  }
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.fail(400, "FILE_TOO_LARGE", "Spreadsheet must be 12MB or smaller");
      }
      return res.fail(400, err.code);
    }
    if (err) {
      return res.fail(400, "UPLOAD_ERROR", err.message);
    }
    next();
  });
};

router.post(
  "/render",
  requireAuth,
  requireRole(ROLES.DEALER, ROLES.LENDER, ROLES.ADMIN),
  multipartOnly,
  renderPdfController
);

export const pdfRouter = router;

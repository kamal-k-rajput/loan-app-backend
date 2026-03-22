import Joi from "joi";
import {
  renderHtmlToPdf,
  renderExcelBufferToPdf,
  safePdfFilename
} from "./pdf.services.js";

const htmlBodySchema = Joi.object({
  html: Joi.string().required().max(5_000_000),
  filename: Joi.string().max(160).optional()
});

function sendPdf(res, buffer, filename) {
  const fn = safePdfFilename(filename);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fn}"`);
  return res.send(buffer);
}

/**
 * POST /api/pdf/render
 * - JSON: { "html": "<html>...", "filename": "optional" }
 * - multipart/form-data: field `file` (.xlsx/.xls), optional `filename`, optional `sheetIndex` (0-based)
 */
export async function renderPdfController(req, res, next) {
  try {
    const isMultipart = (req.headers["content-type"] || "").includes("multipart/form-data");

    if (isMultipart) {
      if (!req.file) {
        return res.fail(400, "FILE_REQUIRED", 'Upload a spreadsheet with form field "file" (xlsx or xls)');
      }
      let sheetIndex = 0;
      if (req.body?.sheetIndex !== undefined && req.body?.sheetIndex !== "") {
        sheetIndex = Number(req.body.sheetIndex);
        if (Number.isNaN(sheetIndex) || sheetIndex < 0) {
          return res.fail(400, "INVALID_SHEET_INDEX", "sheetIndex must be a non-negative integer");
        }
      }
      const pdfBuffer = await renderExcelBufferToPdf(req.file.buffer, { sheetIndex });
      const baseName =
        (req.body?.filename && String(req.body.filename)) ||
        (req.file.originalname || "export").replace(/\.xlsx?$/i, "");
      return sendPdf(res, pdfBuffer, baseName);
    }

    const { error, value } = htmlBodySchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      return res.fail(400, "VALIDATION_ERROR", error.details.map((d) => d.message));
    }

    const pdfBuffer = await renderHtmlToPdf(value.html);
    return sendPdf(res, pdfBuffer, value.filename);
  } catch (err) {
    if (err.message === "EMPTY_WORKBOOK") {
      return res.fail(400, "EMPTY_EXCEL_WORKBOOK", "The workbook has no sheets");
    }
    next(err);
  }
}

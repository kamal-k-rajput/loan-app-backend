import puppeteer from "puppeteer";
import * as XLSX from "xlsx";

let browserPromise = null;

const LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];

/**
 * Launch browser: explicit path → system Chrome channel → Puppeteer-downloaded Chrome.
 * Set PUPPETEER_EXECUTABLE_PATH to force a binary. Set PUPPETEER_CHANNEL=chrome-beta etc. if needed.
 */
async function launchBrowser() {
  const exe = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (exe) {
    return puppeteer.launch({
      headless: true,
      args: LAUNCH_ARGS,
      executablePath: exe
    });
  }

  const channel = process.env.PUPPETEER_CHANNEL || "chrome";
  try {
    return await puppeteer.launch({
      headless: true,
      args: LAUNCH_ARGS,
      channel
    });
  } catch {
    return puppeteer.launch({
      headless: true,
      args: LAUNCH_ARGS
    });
  }
}

/**
 * Shared browser instance (lazy).
 */
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = launchBrowser().catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

export async function closePdfBrowser() {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    browserPromise = null;
    await browser.close();
  } catch {
    browserPromise = null;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapHtmlFragment(html) {
  const t = html.trim();
  if (/^<!doctype/i.test(t)) {
    return t;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; margin: 14px; color: #111; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 4px 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    h1, h2, h3 { margin-top: 0; }
    @media print { body { margin: 8px; } }
  </style></head><body>${html}</body></html>`;
}

/**
 * @param {string} html
 * @param {{ format?: string }} [options]
 * @returns {Promise<Buffer>}
 */
export async function renderHtmlToPdf(html, options = {}) {
  const documentHtml = wrapHtmlFragment(html);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.setContent(documentHtml, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: options.format || "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" }
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

/**
 * @param {Buffer} buffer
 * @param {{ sheetIndex?: number }} [options]
 * @returns {Promise<Buffer>}
 */
export async function renderExcelBufferToPdf(buffer, options = {}) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const names = workbook.SheetNames;
  if (!names.length) {
    throw new Error("EMPTY_WORKBOOK");
  }
  let idx = Number(options.sheetIndex) || 0;
  if (Number.isNaN(idx) || idx < 0) idx = 0;
  idx = Math.min(idx, names.length - 1);

  const sheetName = names[idx];
  const sheet = workbook.Sheets[sheetName];
  const tableHtml = XLSX.utils.sheet_to_html(sheet);
  const title = escapeHtml(sheetName);
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: system-ui, sans-serif; font-size: 9px; margin: 12px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #999; padding: 3px 5px; text-align: left; }
    th { background: #eee; }
    h2 { font-size: 12px; margin: 0 0 8px; }
  </style></head><body><h2>${title}</h2>${tableHtml}</body></html>`;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" }
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export function safePdfFilename(name) {
  const raw = (name || "document").trim() || "document";
  const base = raw.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 120);
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

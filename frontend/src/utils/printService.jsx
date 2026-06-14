import React, { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { api } from "../services/api";

// Internal constants (previously in labelPrintShared.js)
const LABEL_PADDING_MM = 2.5;
const LOGO_SRC = window.location.origin + "/lab448_icon.png";
const PLACEHOLDER_LOGO_SRC =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#6b7280">Logo</text></svg>'
  );

export const DEFAULT_LABEL_CONFIG = {
  paperWidthMm: 50,
  paperHeightMm: 25,
  qrSizeMm: 20,
  logoSizeMm: 12,
  nameFontSizePt: 6,
};

let cachedLabelConfig = null;

export async function getQrLabelConfig() {
  if (cachedLabelConfig) return cachedLabelConfig;
  try {
    const res = await api.get("/system/config/label");
    cachedLabelConfig = { ...DEFAULT_LABEL_CONFIG, ...res.data };
    return cachedLabelConfig;
  } catch (err) {
    console.warn("Failed to fetch label config from backend", err);
    return DEFAULT_LABEL_CONFIG;
  }
}

const THERMAL_BILL_WIDTH_MM = 80;

// Internal helpers (previously in labelPrintShared.js)
function getLabelPrintStyles(config = {}) {
  const paperWidthMm = config.paperWidthMm ?? DEFAULT_LABEL_CONFIG.paperWidthMm;
  const paperHeightMm = config.paperHeightMm ?? DEFAULT_LABEL_CONFIG.paperHeightMm;
  const qrSizeMm = config.qrSizeMm ?? DEFAULT_LABEL_CONFIG.qrSizeMm;
  const pad = LABEL_PADDING_MM;
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: ${paperWidthMm}mm; height: ${paperHeightMm}mm; background: #fff; font-family: 'Montserrat', sans-serif; overflow: hidden; }
    .qr-label-print { width: ${paperWidthMm}mm; height: ${paperHeightMm}mm; display: flex; flex-direction: row; flex-wrap: nowrap; overflow: hidden; }
    .qr-label-left { flex: 0 0 50% !important; width: 50% !important; max-width: 50% !important; height: 100% !important; overflow: hidden !important; font-family: 'Montserrat', sans-serif !important; padding-top: ${pad}mm !important; padding-bottom: ${pad}mm !important; }
    .qr-label-right { flex: 1 1 0 !important; min-width: 0 !important; height: 100% !important; overflow: hidden !important; align-items: flex-start !important; padding-top: ${pad}mm !important; padding-bottom: ${pad}mm !important; }
    .qr-label-name { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; max-width: 100% !important; }
    .qr-label-text-block { text-align: center !important; }
    .qr-label-name, .qr-label-token { font-family: 'Montserrat', sans-serif !important; text-align: center !important; }
    .qr-label-print .qr-wrap { width: ${qrSizeMm}mm; height: ${qrSizeMm}mm; max-width: 100%; max-height: 100%; box-shadow: none !important; border: none !important; filter: none !important; }
    .qr-label-print .qr-wrap img { width: ${qrSizeMm}mm !important; height: ${qrSizeMm}mm !important; border: none !important; outline: none !important; box-shadow: none !important; filter: none !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; image-rendering: crisp-edges; image-rendering: -webkit-optimize-contrast; }
    .barcode-wrap svg { max-width: 100% !important; max-height: 100% !important; }
    @page { size: ${paperWidthMm}mm ${paperHeightMm}mm; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; width: ${paperWidthMm}mm !important; height: ${paperHeightMm}mm !important; min-width: ${paperWidthMm}mm; min-height: ${paperHeightMm}mm; max-width: ${paperWidthMm}mm; max-height: ${paperHeightMm}mm; overflow: hidden !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .qr-label-print { width: ${paperWidthMm}mm !important; height: ${paperHeightMm}mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; }
      .qr-label-left { flex: 0 0 50% !important; width: 50% !important; max-width: 50% !important; overflow: hidden !important; }
      .qr-label-right { flex: 1 1 0 !important; min-width: 0 !important; overflow: hidden !important; }
      .qr-label-print .qr-wrap, .qr-label-print .qr-wrap img { box-shadow: none !important; filter: none !important; border: none !important; }
      .qr-label-print .qr-wrap img { width: ${qrSizeMm}mm !important; height: ${qrSizeMm}mm !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  `;
}

function openPrintWindow(title, bodyContent, style, onLoad) {
  const win = window.open("", "_blank");
  if (!win) return;
  const fontLink =
    '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">';
  win.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>${fontLink}<style>${style}</style></head><body>${bodyContent}</body></html>`
  );
  win.document.close();
  win.onload = () => {
    win.focus();
    if (typeof onLoad === "function") onLoad(win);
  };
}

function escapeHtml(str) {
  if (str == null) return "";
  const s = String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getBarcodeLabelPrintStyles(config = {}) {
  const paperWidthMm = config.paperWidthMm ?? DEFAULT_LABEL_CONFIG.paperWidthMm;
  const paperHeightMm = config.paperHeightMm ?? DEFAULT_LABEL_CONFIG.paperHeightMm;
  const pad = LABEL_PADDING_MM;
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: ${paperWidthMm}mm; height: ${paperHeightMm}mm; background: #fff; font-family: 'Montserrat', sans-serif; overflow: hidden; }
    .barcode-label-print { width: ${paperWidthMm}mm; height: ${paperHeightMm}mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: ${pad}mm; overflow: hidden; }
    .barcode-label-print .barcode-container { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .barcode-label-print .barcode-container svg { max-width: 100%; height: auto; }
    .barcode-label-print .barcode-data { font-family: 'Montserrat', sans-serif; font-size: 7pt; font-weight: 700; color: #111; text-align: center; margin-top: 0.5mm; letter-spacing: 0.5px; word-break: break-all; }
    .barcode-label-print .barcode-item-name { font-family: 'Montserrat', sans-serif; font-size: 6pt; font-weight: 600; color: #333; text-align: center; margin-top: 0.3mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    @page { size: ${paperWidthMm}mm ${paperHeightMm}mm; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; width: ${paperWidthMm}mm !important; height: ${paperHeightMm}mm !important; min-width: ${paperWidthMm}mm; min-height: ${paperHeightMm}mm; max-width: ${paperWidthMm}mm; max-height: ${paperHeightMm}mm; overflow: hidden !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .barcode-label-print { width: ${paperWidthMm}mm !important; height: ${paperHeightMm}mm !important; margin: 0 !important; padding: ${pad}mm !important; overflow: hidden !important; }
    }
  `;
}

function getThermalBillPrintStyles() {
  const w = THERMAL_BILL_WIDTH_MM;
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: ${w}mm; min-width: ${w}mm; max-width: ${w}mm; min-height: 100%; background: #fff; font-family: 'Montserrat', sans-serif; font-size: 11pt; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .thermal-bill { width: ${w}mm; min-width: ${w}mm; max-width: ${w}mm; padding: 4mm 5mm; overflow-wrap: break-word; word-wrap: break-word; }
    .thermal-bill .bill-header { text-align: center; margin-bottom: 5mm; }
    .thermal-bill .bill-logo { display: block; margin: 0 auto 3mm; width: 18mm; height: 18mm; object-fit: contain; max-width: 100%; }
    .thermal-bill .bill-number { font-weight: 700; font-size: 13pt; word-break: break-word; margin-top: 2mm; }
    .thermal-bill .bill-datetime { font-size: 10pt; font-weight: 500; color: #111; margin-top: 1.5mm; }
    .thermal-bill .line-solid { border: none; border-top: 2px solid #000; margin: 4mm 0; }
    .thermal-bill .line-dashed { border: none; border-top: 1.5px dashed #000; margin: 4mm 0; }
    .thermal-bill .customer-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 4mm; font-size: 10.5pt; margin: 2.5mm 0; }
    .thermal-bill .customer-label { font-weight: 700; flex-shrink: 0; }
    .thermal-bill .customer-value { text-align: right; flex: 1; min-width: 0; word-break: break-word; overflow-wrap: break-word; font-weight: 600; }
    .thermal-bill .items-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 4mm 0 2mm 0; table-layout: fixed; }
    .thermal-bill .items-table th { font-weight: 700; font-size: 10pt; padding: 2.5mm 1.5mm 2.5mm 0; border-bottom: 2px solid #000; }
    .thermal-bill .items-table th.th-sn { width: 10mm; min-width: 10mm; text-align: left; }
    .thermal-bill .items-table th.th-items { text-align: left; }
    .thermal-bill .items-table th.th-rate { width: 18mm; min-width: 18mm; text-align: right; padding-right: 0; }
    .thermal-bill .items-table th.th-amt { width: 18mm; min-width: 18mm; text-align: right; padding-right: 0; }
    .thermal-bill .items-table td { font-size: 10pt; font-weight: 600; padding: 2.5mm 1.5mm 2.5mm 0; border-bottom: 1px solid #ccc; vertical-align: top; }
    .thermal-bill .items-table td.td-sn { text-align: left; }
    .thermal-bill .items-table td.td-items { text-align: left; word-break: break-word; overflow-wrap: break-word; max-width: 0; }
    .thermal-bill .items-table td.td-rate, .thermal-bill .items-table td.td-amt { text-align: right; padding-right: 0; }
    .thermal-bill .items-table tr.group-header td { font-weight: 700; font-size: 10pt; border-bottom: 2px dashed #000; padding: 3mm 1.5mm 3mm 0; background: #f8f8f8; word-break: break-word; overflow-wrap: break-word; }
    .thermal-bill .summary-row { display: flex; justify-content: space-between; gap: 4mm; font-size: 10.5pt; margin: 2.5mm 0; }
    .thermal-bill .summary-label { font-weight: 700; flex-shrink: 0; }
    .thermal-bill .summary-value { text-align: right; flex-shrink: 0; font-weight: 600; }
    .thermal-bill .total-row { display: flex; justify-content: space-between; font-size: 13pt; font-weight: 800; margin-top: 3mm; padding-top: 3mm; border-top: 2.5px solid #000; }
    .thermal-bill .bill-footer { text-align: center; margin-top: 8mm; font-size: 10.5pt; font-weight: 600; color: #000; word-break: break-word; }
    .thermal-bill .bill-footer .thanks { margin-bottom: 2mm; }
    .thermal-bill .bill-footer .footer-phone { margin-bottom: 2mm; }
    @page { size: ${w}mm auto; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; width: ${w}mm !important; min-width: ${w}mm !important; max-width: ${w}mm !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .thermal-bill { width: ${w}mm !important; min-width: ${w}mm !important; max-width: ${w}mm !important; }
      .thermal-bill .items-table tr.group-header td { background: #fff !important; }
    }
  `;
}

// 1. QrLabelPrint Component
const QrLabelPrint = forwardRef(function QrLabelPrint(
  { customerName = "", qrToken = "", labelConfig = {} },
  ref
) {
  const {
    paperWidthMm = 50,
    paperHeightMm = 25,
    qrSizeMm = 20,
    logoSizeMm = 12,
    nameFontSizePt = 6,
  } = labelConfig;

  const qrPx = Math.round(qrSizeMm * 3.78 * 3);

  return (
    <div
      ref={ref}
      className="qr-label-print"
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        width: `${paperWidthMm}mm`,
        height: `${paperHeightMm}mm`,
        boxSizing: "border-box",
        background: "#fff",
        fontFamily: "'Montserrat', sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        className="qr-label-left"
        style={{
          flex: "0 0 50%",
          width: "50%",
          maxWidth: "50%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: `${LABEL_PADDING_MM}mm`,
          paddingBottom: `${LABEL_PADDING_MM}mm`,
          paddingLeft: "1mm",
          paddingRight: "1mm",
          boxSizing: "border-box",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${logoSizeMm}mm`,
            height: `${logoSizeMm}mm`,
            flexShrink: 0,
          }}
        >
          <img
            src={LOGO_SRC}
            alt="Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
        <div style={{ flex: "1 1 0", minHeight: 0 }} />
        <div className="qr-label-text-block" style={{ flexShrink: 0, width: "100%", textAlign: "center" }}>
          <div
            className="qr-label-name"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: `${nameFontSizePt}pt`,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#111",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            {customerName || "—"}
          </div>
          <div
            className="qr-label-token"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "6pt",
              fontWeight: 700,
              color: "#111",
              marginTop: "0.3mm",
              letterSpacing: "0.3px",
            }}
          >
            {qrToken || "—"}
          </div>
        </div>
      </div>
      <div
        className="qr-label-right"
        style={{
          flex: "1 1 0",
          minWidth: 0,
          height: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: `${LABEL_PADDING_MM}mm`,
          paddingBottom: `${LABEL_PADDING_MM}mm`,
          paddingLeft: "1mm",
          paddingRight: "1mm",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          className="qr-wrap"
          style={{
            width: `${qrSizeMm}mm`,
            height: `${qrSizeMm}mm`,
            maxWidth: "100%",
            maxHeight: "100%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            boxShadow: "none",
            border: "none",
          }}
        >
          {qrToken ? (
            <QRCodeCanvas value={qrToken} size={qrPx} level="M" style={{ display: "block", width: "100%", height: "100%" }} aria-hidden="true" />
          ) : null}
        </div>
      </div>
    </div>
  );
});

export default QrLabelPrint;

// 2. printQrLabel
export function printQrLabel(ref, labelConfig = {}) {
  if (!ref?.current) return;
  const root = ref.current;
  const {
    paperWidthMm = 50,
    paperHeightMm = 25,
    qrSizeMm = 20,
  } = labelConfig;

  const leftEl = root.querySelector(".qr-label-left");
  const canvas = root.querySelector("canvas");
  const leftHtml = leftEl ? leftEl.outerHTML : "";
  let qrDataUrl = "";
  const qrImgPx = Math.round(qrSizeMm * 3.78 * 3);
  if (canvas && typeof canvas.toDataURL === "function") {
    try {
      qrDataUrl = canvas.toDataURL("image/png");
    } catch (e) {
      console.warn("QR toDataURL failed", e);
    }
  }

  const pad = LABEL_PADDING_MM;
  const rightHtml = `
    <div class="qr-label-right" style="flex:1 1 0;min-width:0;height:100%;display:flex;align-items:flex-start;justify-content:center;padding-top:${pad}mm;padding-bottom:${pad}mm;padding-left:1mm;padding-right:1mm;box-sizing:border-box;overflow:hidden">
      <div class="qr-wrap" style="width:${qrSizeMm}mm;height:${qrSizeMm}mm;max-width:100%;max-height:100%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#fff;box-shadow:none;border:none">
        ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" width="${qrImgPx}" height="${qrImgPx}" style="width:${qrSizeMm}mm;height:${qrSizeMm}mm;display:block;border:none;outline:none;box-shadow:none;filter:none;-webkit-print-color-adjust:exact;print-color-adjust:exact;image-rendering:crisp-edges;image-rendering:-webkit-optimize-contrast" />` : ""}
      </div>
    </div>`;

  const bodyContent = `<div class="qr-label-print" style="display:flex;flex-direction:row;flex-wrap:nowrap;width:${paperWidthMm}mm;height:${paperHeightMm}mm;box-sizing:border-box;background:#fff;font-family:sans-serif;overflow:hidden">${leftHtml}${rightHtml}</div>`;

  openPrintWindow("QR Label", bodyContent, getLabelPrintStyles(labelConfig), (win) => {
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  });
}

// 3. printBarcodeLabel
const JSBARCODE_URL = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
export function printBarcodeLabel(itemName, sku, labelConfig = {}) {
  const config = { ...DEFAULT_LABEL_CONFIG, ...labelConfig };
  const paperWidthMm = config.paperWidthMm ?? 50;
  const paperHeightMm = config.paperHeightMm ?? 25;

  const safeSku = escapeHtml(sku ?? "—");
  const safeName = escapeHtml(itemName ?? "—");

  const bodyContent = `
    <div class="barcode-label-print" style="width:${paperWidthMm}mm;height:${paperHeightMm}mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${LABEL_PADDING_MM}mm;box-sizing:border-box;overflow:hidden">
      <div class="barcode-container" style="display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg id="barcode"></svg>
      </div>
      <div class="barcode-data" style="font-family:'Montserrat',sans-serif;font-size:7pt;font-weight:700;color:#111;text-align:center;margin-top:0.5mm;letter-spacing:0.5px;word-break:break-all">${safeSku}</div>
      <div class="barcode-item-name" style="font-family:'Montserrat',sans-serif;font-size:6pt;font-weight:600;color:#333;text-align:center;margin-top:0.3mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${safeName}</div>
    </div>`;

  const scriptContent = `
    (function() {
      var sku = ${JSON.stringify(sku || "")};
      function run() {
        if (!sku || !window.JsBarcode) return;
        try {
          window.JsBarcode("#barcode", sku, {
            format: "CODE128",
            width: 1.2,
            height: 40,
            displayValue: false,
            margin: 0
          });
        } catch (e) { console.warn(e); }
        setTimeout(function() {
          window.print();
          window.close();
        }, 350);
      }
      if (window.JsBarcode) {
        run();
      } else {
        var s = document.createElement("script");
        s.src = ${JSON.stringify(JSBARCODE_URL)};
        s.onload = run;
        document.head.appendChild(s);
      }
    })();
  `;

  const fullBody = bodyContent + "<script>" + scriptContent + "</script>";
  const title = "Barcode - " + safeSku;

  openPrintWindow(title, fullBody, getBarcodeLabelPrintStyles(config), () => {});
}

// 4. getNextBillNumber & printThermalBill
const BILL_SEQ_KEY_PREFIX = "billSeq_";

export function getNextBillNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const key = BILL_SEQ_KEY_PREFIX + today;
  let n = 1;
  try {
    const stored = localStorage.getItem(key);
    if (stored != null) n = Math.max(1, parseInt(stored, 10) + 1);
    localStorage.setItem(key, String(n));
  } catch {
    n = 1;
  }
  return `BILL-${today}-${n}`;
}

export function printThermalBill({
  billNumber,
  customerName,
  customerPhone,
  lines,
  total,
}) {
  const rows = (lines || [])
    .map(
      (line) => `<tr>
        <td class="td-items">${escapeHtml(line.description || "Charge")}</td>
        <td class="td-rate">${Number(line.rate || 0).toFixed(2)}</td>
        <td class="td-amt">${Number(line.amount || 0).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div class="thermal-bill">
      <div class="bill-header">
        <img class="bill-logo" src="${LOGO_SRC}" alt="Logo" />
        <div class="bill-number">${escapeHtml(billNumber)}</div>
        <div class="bill-datetime">${escapeHtml(new Date().toLocaleString())}</div>
      </div>
      <div class="customer-row">
        <span class="customer-label">Customer:</span>
        <span class="customer-value">${escapeHtml(customerName || "-")}</span>
      </div>
      <div class="customer-row">
        <span class="customer-label">Phone:</span>
        <span class="customer-value">${escapeHtml(customerPhone || "-")}</span>
      </div>
      <hr class="line-solid" />
      <table class="items-table">
        <thead>
          <tr><th class="th-items">Item</th><th class="th-rate">Rate</th><th class="th-amt">Amount</th></tr>
        </thead>
        <tbody>${rows || "<tr><td colspan='3'>No items</td></tr>"}</tbody>
      </table>
      <div class="total-row"><span>TOTAL</span><span>Rs. ${Number(total || 0).toFixed(2)}</span></div>
      <div class="bill-footer">Thank you for choosing us.</div>
    </div>
  `;

  openPrintWindow(`Bill - ${billNumber}`, html, getThermalBillPrintStyles(), (win) => {
    setTimeout(() => {
      win.print();
      win.onafterprint = () => win.close();
    }, 250);
  });
}

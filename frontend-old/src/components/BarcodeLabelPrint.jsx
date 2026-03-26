/**
 * Barcode label print: 50x25mm, no logo. Centered layout: barcode (JsBarcode) in the middle,
 * then barcode data (SKU) below, then item name below that. Uses LabelPrintShared for styles and print window.
 */

import {
  LABEL_PADDING_MM,
  DEFAULT_LABEL_CONFIG,
  getBarcodeLabelPrintStyles,
  openPrintWindow,
  escapeHtml,
} from "./LabelPrintShared.js";

const JSBARCODE_URL = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";

/**
 * Open print window for a barcode label (50x25mm, no logo).
 * Layout: barcode (centered) → barcode data (SKU) → item name.
 * @param {string} itemName - Shown below the barcode data (long names get one line + ellipsis)
 * @param {string} sku - Barcode value; also shown as text below the barcode
 * @param {{ paperWidthMm?: number, paperHeightMm?: number }} labelConfig
 */
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

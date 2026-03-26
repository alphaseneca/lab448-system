/**
 * Thermal bill print: 80mm width, variable height (roll paper).
 * Layout: logo (same as QR labels) → Bill no. & date → customer (label + value same line) → grouped items → total → footer.
 * Uses LabelPrintShared for styles (same pattern as QR/Barcode), openPrintWindow, escapeHtml, PLACEHOLDER_LOGO_SRC.
 */

import {
  openPrintWindow,
  escapeHtml,
  PLACEHOLDER_LOGO_SRC,
  getThermalBillPrintStyles,
  THERMAL_BILL_WIDTH_MM,
} from "./LabelPrintShared.js";

const BILL_SEQ_KEY_PREFIX = "billSeq_";

/**
 * Get next bill number for today (sequential per day in localStorage).
 * Format: BILL-YYYYMMDD-N (e.g. BILL-20260222-1, BILL-20260222-2).
 */
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

/**
 * @param {{
 *   billNumber: string;
 *   dateTime: string;
 *   customer: { name?: string; phone?: string; address?: string };
 *   groups: Array<{ repairLabel: string; charges: Array<{ description: string; amount: number }> }>;
 *   total: number;
 *   logoSrc?: string;
 *   footerWebsite?: string;
 *   footerPhone?: string;
 * }} billData
 * @returns {string} HTML for the thermal bill
 */
export function buildThermalBillHtml(billData) {
  const {
    billNumber = "—",
    dateTime = "",
    customer = {},
    groups = [],
    total = 0,
    logoSrc = PLACEHOLDER_LOGO_SRC,
    footerWebsite = "lab448.ukesharyl.com.np",
    footerPhone = "98xxxxxxxx",
  } = billData;

  const w = THERMAL_BILL_WIDTH_MM;
  const safeBillNo = escapeHtml(billNumber);
  const safeDate = escapeHtml(dateTime);
  const safeName = escapeHtml(customer.name ?? "—");
  const safePhone = escapeHtml(customer.phone ?? customer.phone2 ?? "—");
  const safeAddr = escapeHtml((customer.address ?? "").trim() || "—");
  const safeWebsite = escapeHtml(footerWebsite);
  const safeFooterPhone = escapeHtml(String(footerPhone ?? "").trim());
  const safeLogoSrc = escapeHtml(logoSrc);

  const tableRows = [];
  groups.forEach((group, groupIdx) => {
    const groupNum = groupIdx + 1;
    const repairLabel = escapeHtml(group.repairLabel || "Repair");
    tableRows.push(
      `<tr class="group-header"><td colspan="4">${groupNum}. ${repairLabel.replace(/^\d+\.?\s*/, "")}</td></tr>`
    );
    const charges = group.charges && group.charges.length > 0
      ? group.charges
      : [{ description: "Repair / service", amount: 0 }];
    charges.forEach((c, chargeIdx) => {
      const subNum = chargeIdx + 1;
      const sn = `${groupNum}.${subNum}`;
      const desc = escapeHtml(c.description || "Charge");
      const amount = Number(c.amount);
      const rate = amount;
      const rateStr = rate.toFixed(2);
      const amtStr = amount.toFixed(2);
      tableRows.push(
        `<tr><td class="td-sn">${sn}</td><td class="td-items">${desc}</td><td class="td-rate">${rateStr}</td><td class="td-amt">${amtStr}</td></tr>`
      );
    });
  });

  if (tableRows.length === 0) {
    tableRows.push(
      "<tr><td class='td-sn'>1.1</td><td class='td-items' colspan='3'>No items</td></tr>"
    );
  }

  const totalStr = `Rs. ${Number(total).toFixed(2)}`;

  // Root div with explicit width (same pattern as BarcodeLabelPrint / QrLabelPrint bodyContent)
  return `
    <div class="thermal-bill" style="width:${w}mm;min-width:${w}mm;max-width:${w}mm;padding:4mm 5mm;box-sizing:border-box">
      <div class="bill-header">
        <img class="bill-logo" src="${safeLogoSrc}" alt="Logo" />
        <div class="bill-number">Bill no. ${safeBillNo}</div>
        <div class="bill-datetime">${safeDate}</div>
      </div>
      <hr class="line-solid"/>
      <div class="customer-row"><span class="customer-label">Customer:</span><span class="customer-value">${safeName}</span></div>
      <div class="customer-row"><span class="customer-label">Phone:</span><span class="customer-value">${safePhone}</span></div>
      <div class="customer-row"><span class="customer-label">Address:</span><span class="customer-value">${safeAddr}</span></div>
      <hr class="line-dashed"/>
      <table class="items-table">
        <thead><tr><th class="th-sn">S.N.</th><th class="th-items">Items</th><th class="th-rate">Rate</th><th class="th-amt">Amount</th></tr></thead>
        <tbody>${tableRows.join("")}</tbody>
      </table>
      <hr class="line-solid"/>
      <div class="summary-row total-row"><span class="summary-label">TOTAL:</span><span class="summary-value">${totalStr}</span></div>
      <hr class="line-dashed"/>
      <div class="bill-footer">
        <div class="thanks">Thank you for choosing us!</div>
        ${safeFooterPhone ? `<div class="footer-phone">${safeFooterPhone}</div>` : ""}
        ${safeWebsite ? `<div class="footer-website">${safeWebsite}</div>` : ""}
      </div>
    </div>
  `;
}

/**
 * Open print window for 80mm thermal bill and trigger print.
 * @param {Parameters<typeof buildThermalBillHtml>[0]} billData
 */
export function printThermalBill(billData) {
  const html = buildThermalBillHtml(billData);
  const billNo = billData?.billNumber ?? "bill";
  const title = `Bill - ${billNo}`;
  openPrintWindow(title, html, getThermalBillPrintStyles(), (win) => {
    win.focus();
    setTimeout(() => {
      win.print();
      win.onafterprint = () => win.close();
    }, 300);
  });
}

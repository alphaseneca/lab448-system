import {
  openPrintWindow,
  escapeHtml,
  PLACEHOLDER_LOGO_SRC,
  getThermalBillPrintStyles,
} from "./LabelPrintShared";

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
        <img class="bill-logo" src="${PLACEHOLDER_LOGO_SRC}" alt="Logo" />
        <div class="bill-number">Bill no. ${escapeHtml(billNumber)}</div>
        <div class="bill-datetime">${escapeHtml(new Date().toLocaleString())}</div>
      </div>
      <div><strong>Customer:</strong> ${escapeHtml(customerName || "-")}</div>
      <div><strong>Phone:</strong> ${escapeHtml(customerPhone || "-")}</div>
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


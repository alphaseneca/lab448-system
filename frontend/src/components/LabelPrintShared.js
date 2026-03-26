export const PLACEHOLDER_LOGO_SRC =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#6b7280">Logo</text></svg>'
  );

export const THERMAL_BILL_WIDTH_MM = 80;

export function openPrintWindow(title, bodyContent, style, onLoad) {
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

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getThermalBillPrintStyles() {
  const w = THERMAL_BILL_WIDTH_MM;
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: ${w}mm; min-width: ${w}mm; max-width: ${w}mm; min-height: 100%; background: #fff; font-family: 'Montserrat', sans-serif; font-size: 10pt; color: #000; }
    .thermal-bill { width: ${w}mm; min-width: ${w}mm; max-width: ${w}mm; padding: 4mm 5mm; }
    .bill-header { text-align: center; margin-bottom: 4mm; }
    .bill-logo { display: block; margin: 0 auto 3mm; width: 14mm; height: 14mm; object-fit: contain; }
    .bill-number { font-weight: 700; font-size: 11pt; }
    .bill-datetime { font-size: 9pt; color: #333; margin-top: 1mm; }
    .line-solid { border: none; border-top: 2px solid #000; margin: 4mm 0; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 4mm 0 2mm 0; table-layout: fixed; }
    .items-table th { font-weight: 700; font-size: 8pt; padding: 2.5mm 1.5mm 2.5mm 0; border-bottom: 1px solid #000; }
    .items-table td { font-size: 8pt; padding: 2mm 1.5mm 2mm 0; border-bottom: 1px solid #eee; vertical-align: top; }
    .th-items, .td-items { text-align: left; }
    .th-rate, .th-amt, .td-rate, .td-amt { text-align: right; }
    .total-row { display: flex; justify-content: space-between; font-size: 11pt; font-weight: 700; margin-top: 3mm; padding-top: 3mm; border-top: 2px solid #000; }
    .bill-footer { text-align: center; margin-top: 6mm; font-size: 9pt; color: #333; }
    @page { size: ${w}mm auto; margin: 0; }
  `;
}


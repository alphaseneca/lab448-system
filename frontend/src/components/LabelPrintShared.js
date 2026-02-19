/**
 * Shared layout, styles, and print helpers for 50x25mm labels (QR and Barcode).
 * Same top/bottom padding and single place to change layout/print logic for easier debugging.
 */

export const LABEL_PADDING_MM = 2.5;

export const PLACEHOLDER_LOGO_SRC =
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

/**
 * @param {{ paperWidthMm?: number, paperHeightMm?: number, qrSizeMm?: number }} config
 * @returns {string} CSS for the print document
 */
export function getLabelPrintStyles(config = {}) {
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

/**
 * @param {string} title
 * @param {string} bodyContent
 * @param {string} style
 * @param {() => void} onLoad
 */
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
  const s = String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Styles for barcode-only label (no logo): 50x25mm, single column, barcode centered, then barcode data, then item name.
 * @param {{ paperWidthMm?: number, paperHeightMm?: number }} config
 * @returns {string}
 */
export function getBarcodeLabelPrintStyles(config = {}) {
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

/**
 * Build left column HTML string (logo + spacer + line1 + line2, bottom-aligned). Used by QR labels only.
 * @param {{ line1: string, line2: string, labelConfig: object }} opts
 * @returns {string}
 */
export function buildLeftColumnHtml(opts) {
  const { line1 = "—", line2 = "—", labelConfig = {} } = opts;
  const pad = LABEL_PADDING_MM;
  const logoSizeMm = labelConfig.logoSizeMm ?? DEFAULT_LABEL_CONFIG.logoSizeMm;
  const nameFontSizePt = labelConfig.nameFontSizePt ?? DEFAULT_LABEL_CONFIG.nameFontSizePt;
  const safe1 = escapeHtml(line1);
  const safe2 = escapeHtml(line2);
  return `
    <div class="qr-label-left" style="flex:0 0 50%;width:50%;max-width:50%;height:100%;display:flex;flex-direction:column;align-items:center;padding-top:${pad}mm;padding-bottom:${pad}mm;padding-left:1mm;padding-right:1mm;box-sizing:border-box;min-width:0;overflow:hidden">
      <div style="width:${logoSizeMm}mm;height:${logoSizeMm}mm;flex-shrink:0">
        <img src="${PLACEHOLDER_LOGO_SRC}" alt="Logo" style="width:100%;height:100%;object-fit:contain;display:block" />
      </div>
      <div style="flex:1 1 0;min-height:0"></div>
      <div class="qr-label-text-block" style="flex-shrink:0;width:100%;text-align:center">
        <div class="qr-label-name" style="font-family:'Montserrat',sans-serif;font-size:${nameFontSizePt}pt;font-weight:700;line-height:1.2;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;max-width:100%;min-width:0">${safe1}</div>
        <div class="qr-label-token" style="font-family:'Montserrat',sans-serif;font-size:6pt;font-weight:700;color:#111;margin-top:0.3mm;letter-spacing:0.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;max-width:100%;min-width:0">${safe2}</div>
      </div>
    </div>`;
}

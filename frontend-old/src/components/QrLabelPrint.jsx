import React, { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  PLACEHOLDER_LOGO_SRC,
  LABEL_PADDING_MM,
  getLabelPrintStyles,
  openPrintWindow,
} from "./LabelPrintShared.js";

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

  // High-res for print: 3x so PNG is crisp at 20mm (avoids blur/shadow in PDF and printers)
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
            src={PLACEHOLDER_LOGO_SRC}
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

/**
 * Open print window for the QR label. Uses a PNG image for the QR so it prints on all printers (not just Save as PDF).
 * @param {React.RefObject} ref - ref from QrLabelPrint
 * @param {{ paperWidthMm: number, paperHeightMm: number, qrSizeMm: number }} labelConfig
 */
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

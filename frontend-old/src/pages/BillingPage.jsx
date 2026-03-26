import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../utils/apiClient.js";
import { useAuth } from "../state/AuthContext.jsx";
import { PERMISSIONS } from "../constants/permissions.js";
import DarkSelect from "../components/DarkSelect.jsx";
import { printThermalBill, getNextBillNumber } from "../components/ThermalBillPrint.jsx";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.015)",
};

const BillingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [repair, setRepair] = useState(null);
  const [combinedData, setCombinedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCharge, setNewCharge] = useState({
    repairId: "",
    description: "",
    amount: 0,
  });
  const [payment, setPayment] = useState({ amount: 0, method: "CASH" });
  const [chargeError, setChargeError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const repairRes = await api.get(`/repairs/${id}`);
      const repairData = repairRes.data;
      setRepair(repairData);
      const customerId = repairData?.customerId || repairData?.customer?.id;
      if (!customerId) {
        setCombinedData(null);
        setLoading(false);
        return;
      }
      try {
        const billingRes = await api.get(`/customers/${customerId}/billing`);
        setCombinedData(billingRes.data);
      } catch {
        setCombinedData(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load");
      setRepair(null);
      setCombinedData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const addCharge = async (e) => {
    e.preventDefault();
    setChargeError("");
    const targetRepairId = combinedData?.items?.length === 1 ? id : newCharge.repairId;
    if (!targetRepairId) {
      setChargeError("Select an item to add the charge to");
      return;
    }
    try {
      await api.post(`/repairs/${targetRepairId}/add-charge`, {
        type: "OTHER",
        description: newCharge.description,
        amount: Number(newCharge.amount),
      });
      setNewCharge((c) => ({ ...c, description: "", amount: 0 }));
      await load();
    } catch (err) {
      setChargeError(err.response?.data?.message || "Failed to add charge");
    }
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    setPaymentError("");
    const customerId = repair?.customerId || repair?.customer?.id;
    if (combinedData?.items?.length > 1 && customerId) {
      try {
        await api.post(`/customers/${customerId}/pay`, {
          amount: Number(payment.amount),
          method: payment.method,
        });
        setPayment({ amount: 0, method: "CASH" });
        await load();
      } catch (err) {
        setPaymentError(
          err.response?.data?.message || "Failed to record payment"
        );
      }
    } else {
      try {
        await api.post(`/repairs/${id}/pay`, {
          amount: Number(payment.amount),
          method: payment.method,
        });
        setPayment({ amount: 0, method: "CASH" });
        await load();
      } catch (err) {
        setPaymentError(
          err.response?.data?.message || "Failed to record payment"
        );
      }
    }
  };

  if (loading && !repair) {
    return (
      <div className="content">
        <p className="muted">Loading billing...</p>
      </div>
    );
  }
  if (error || !repair) {
    return (
      <div className="content">
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "10px",
            color: "#f87171",
          }}
        >
          ✗ {error || "Repair not found"}
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: "12px" }}
          onClick={() => navigate("/repairs")}
        >
          ← Back
        </button>
      </div>
    );
  }

  const customerId = repair.customerId || repair.customer?.id;
  const customer = combinedData?.customer || repair.customer;
  const items =
    combinedData?.items ??
    (repair
      ? [
          {
            repairId: repair.id,
            qrToken: repair.qrToken,
            device: repair.device,
            status: repair.status,
            isLocked: repair.isLocked,
            total: Number(repair.totalCharges),
            paid: (repair.payments || []).reduce((s, p) => s + Number(p.amount), 0),
            due:
              Number(repair.totalCharges) -
              (repair.payments || []).reduce((s, p) => s + Number(p.amount), 0),
            charges: repair.charges || [],
            payments: repair.payments || [],
          },
        ]
      : null);
  const singleItem = items?.length === 1;
  const multiItem = items && items.length > 1;
  const combinedTotal =
    combinedData?.combinedTotal ?? items?.reduce((s, i) => s + i.total, 0) ?? 0;
  const combinedPaid =
    combinedData?.combinedPaid ?? items?.reduce((s, i) => s + i.paid, 0) ?? 0;
  const combinedDue = combinedTotal - combinedPaid;
  const BILLABLE_STATUSES = ["REPAIRED", "UNREPAIRABLE"];
  const canBill =
    singleItem
      ? BILLABLE_STATUSES.includes(repair?.status)
      : true;
  const openRepairsForCharge = items ? items.filter((i) => !i.isLocked) : [];
  const hasDue = combinedDue > 0;

  return (
    <div className="content">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "8px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>
            💳 Billing & payment
          </h2>
          <p className="muted small" style={{ marginTop: "4px" }}>
            {customer?.name}
            {multiItem ? (
              <> · {items.length} items on this bill</>
            ) : (
              <> · {repair.device?.brand} {repair.device?.model}</>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {hasDue && (
            <button
              type="button"
              onClick={() => {
                const pendingItems = (items ?? []).filter((i) => Number(i.due) > 0);
                const pendingTotal = pendingItems.reduce((s, i) => s + Number(i.due), 0);
                const groups = pendingItems.map((item, idx) => {
                  const label = [idx + 1, [item.device?.brand, item.device?.model].filter(Boolean).join(" "), item.qrToken && `(${item.qrToken})`].filter(Boolean).join(" ").trim() || `Repair ${item.repairId}`;
                  const charges = (item.charges || []).map((c) => ({
                    description: c.description || "Charge",
                    amount: Number(c.amount),
                  }));
                  if (charges.length === 0) {
                    charges.push({ description: "Repair / service", amount: Number(item.due) || 0 });
                  }
                  return { repairLabel: label, charges };
                });
                printThermalBill({
                  billNumber: getNextBillNumber(),
                  dateTime: new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }),
                  customer: {
                    name: customer?.name,
                    phone: customer?.phone ?? customer?.phone2,
                    address: customer?.address,
                  },
                  groups,
                  total: pendingTotal,
                  footerWebsite: import.meta.env.VITE_BILL_FOOTER_WEBSITE ?? "lab448.ukesharyal.com.np",
                  footerPhone: import.meta.env.VITE_BILL_FOOTER_PHONE ?? "98xxxxxxxx",
                });
              }}
              className="btn"
              style={{ padding: "10px 20px", fontSize: "14px" }}
            >
              🖨️ Print bill
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(`/repairs/${id}`)}
            className="btn btn-ghost"
            style={{ padding: "10px 20px", fontSize: "14px" }}
          >
            ← Back to repair dashboard
          </button>
        </div>
      </div>

      {!canBill && (
        <div
          style={{
            padding: "14px 18px",
            marginBottom: "20px",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "10px",
            color: "#fbbf24",
            fontSize: "14px",
          }}
        >
          Billing is only available when the item is marked <strong>Repaired</strong> or <strong>Unrepairable</strong>. Update the repair status from the repair dashboard to enable adding charges and recording payments.
        </div>
      )}

      {/* Bill summary */}
      <div
        className="card"
        style={{
          padding: "18px",
          marginBottom: "20px",
          ...(multiItem
            ? {
                background: "linear-gradient(135deg, rgba(124, 92, 255, 0.08), rgba(96, 165, 250, 0.08))",
                border: "1px solid rgba(124, 92, 255, 0.2)",
              }
            : {}),
        }}
      >
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--muted)",
          }}
        >
          Bill summary {multiItem ? "(all items)" : ""}
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px 32px",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span className="muted">Total charges</span>
            <span>₹{Number(combinedTotal).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span className="muted">Paid</span>
            <span>₹{Number(combinedPaid).toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              fontWeight: 600,
            }}
          >
            <span className="muted">Due</span>
            <span>₹{Number(combinedDue).toFixed(2)}</span>
          </div>
        </div>
        {singleItem && (
          <>
            <div className="small muted" style={{ marginTop: "14px" }}>
              Staff share (when fully paid): ₹
              {Number(repair.staffShareAmount).toFixed(2)} · Shop: ₹
              {Number(repair.shopShareAmount).toFixed(2)}
            </div>
            <div className="small muted" style={{ marginTop: "6px" }}>
              Status:{" "}
              <strong style={{ color: "var(--text)" }}>
                {repair.isLocked ? "Paid" : "Open"}
              </strong>
            </div>
          </>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
        }}
      >
        {/* Add charge */}
        {hasPermission(PERMISSIONS.MANAGE_BILLING) && canBill && openRepairsForCharge.length > 0 && (
          <div className="card" style={{ padding: "18px" }}>
            <h3
              style={{
                margin: "0 0 14px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--muted)",
              }}
            >
              {multiItem ? "Add charge to an item" : "Charges"}
            </h3>
            <form onSubmit={addCharge} style={{ marginBottom: "16px" }}>
              {multiItem && openRepairsForCharge.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <label
                    className="small muted"
                    style={{ display: "block", marginBottom: "6px" }}
                  >
                    Item (repair)
                  </label>
                  <DarkSelect
                    value={newCharge.repairId}
                    onChange={(val) =>
                      setNewCharge((c) => ({ ...c, repairId: val }))
                    }
                    options={[
                      { value: "", label: "Select item" },
                      ...openRepairsForCharge.map((i) => ({
                        value: i.repairId,
                        label: `${i.device?.brand || ""} ${i.device?.model || ""} (${i.qrToken}) — Due ₹${Number(i.due).toFixed(2)}`.trim() || i.repairId,
                      })),
                    ]}
                  />
                </div>
              )}
              <div style={{ marginBottom: "10px" }}>
                <label
                  className="small muted"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  Description
                </label>
                <input
                  style={inputStyle}
                  value={newCharge.description}
                  onChange={(e) =>
                    setNewCharge((c) => ({ ...c, description: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label
                    className="small muted"
                    style={{ display: "block", marginBottom: "6px" }}
                  >
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    style={inputStyle}
                    value={newCharge.amount}
                    onChange={(e) =>
                      setNewCharge((c) => ({ ...c, amount: e.target.value }))}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "10px 16px" }}
                >
                  Add charge
                </button>
              </div>
              {chargeError && (
                <div className="small" style={{ color: "#f87171", marginTop: "8px" }}>
                  {chargeError}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Record payment */}
        {hasPermission(PERMISSIONS.TAKE_PAYMENT) && canBill && hasDue && (
          <div className="card" style={{ padding: "18px" }}>
            <h3
              style={{
                margin: "0 0 14px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--muted)",
              }}
            >
              Payments
            </h3>
            {multiItem && (
              <p className="small muted" style={{ marginBottom: "12px" }}>
                Payment is applied across all items with balance due (oldest first).
              </p>
            )}
            <form onSubmit={recordPayment} style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label
                  className="small muted"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={combinedDue}
                  step="0.01"
                  style={inputStyle}
                  value={payment.amount}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, amount: e.target.value }))}
                  required
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label
                  className="small muted"
                  style={{ display: "block", marginBottom: "6px" }}
                >
                  Method
                </label>
                <DarkSelect
                  value={payment.method}
                  onChange={(val) => setPayment((p) => ({ ...p, method: val }))}
                  options={[
                    { value: "CASH", label: "Cash" },
                    { value: "CARD", label: "Card" },
                    { value: "BANK_TRANSFER", label: "Bank transfer" },
                    { value: "OTHER", label: "Other" },
                  ]}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "10px 18px" }}
              >
                Record payment
              </button>
              {paymentError && (
                <div className="small" style={{ color: "#f87171", marginTop: "8px" }}>
                  {paymentError}
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Sectioned items (when multiple) or single item charges + payments list */}
      {items && items.length > 0 && (
        <>
          <h3 style={{ margin: "24px 0 12px", fontSize: "18px", fontWeight: 600 }}>
            {multiItem ? "Items on this bill" : "Charges & payments"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {items.map((item) => (
              <div
                key={item.repairId}
                className="card"
                style={{
                  padding: "18px",
                  ...(multiItem
                    ? { borderLeft: "4px solid rgba(124, 92, 255, 0.5)" }
                    : {}),
                }}
              >
                {multiItem && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>
                        {item.device?.brand} {item.device?.model}
                      </div>
                      <div className="small muted">
                        QR: <span style={{ fontFamily: "monospace" }}>{item.qrToken}</span>
                        {item.device?.serialNumber && ` · S/N: ${item.device.serialNumber}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div className="small muted">Total ₹{Number(item.total).toFixed(2)}</div>
                        <div className="small muted">Paid ₹{Number(item.paid).toFixed(2)}</div>
                        <div style={{ fontWeight: 600 }}>Due ₹{Number(item.due).toFixed(2)}</div>
                      </div>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          background: item.isLocked ? "rgba(34, 197, 94, 0.2)" : "rgba(245, 158, 11, 0.2)",
                          color: "var(--text)",
                        }}
                      >
                        {item.isLocked ? "Paid" : "Open"}
                      </span>
                      {item.repairId !== id && !item.isLocked && (
                        <button
                          type="button"
                          onClick={() => navigate(`/repairs/${item.repairId}/billing`)}
                          className="btn"
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                        >
                          Open →
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div
                  style={{
                    borderTop: multiItem ? "1px solid rgba(255,255,255,0.06)" : "none",
                    paddingTop: multiItem ? "12px" : 0,
                  }}
                >
                  <div className="small muted" style={{ marginBottom: "8px" }}>
                    Charges
                  </div>
                  <table
                    style={{
                      width: "100%",
                      fontSize: "13px",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <th className="small muted" style={{ textAlign: "left", padding: "6px 8px" }}>
                          When
                        </th>
                        <th className="small muted" style={{ textAlign: "left", padding: "6px 8px" }}>
                          Description
                        </th>
                        <th className="small muted" style={{ textAlign: "right", padding: "6px 8px" }}>
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(item.charges || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="small muted"
                            style={{ padding: "12px", textAlign: "center" }}
                          >
                            No charges yet
                          </td>
                        </tr>
                      ) : (
                        (item.charges || []).map((c) => (
                          <tr
                            key={c.id}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <td style={{ padding: "6px 8px" }}>
                              {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                            </td>
                            <td style={{ padding: "6px 8px" }}>
                              {c.description || "Charge"}
                            </td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>
                              ₹{Number(c.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: "12px",
                    marginTop: "12px",
                  }}
                >
                  <div className="small muted" style={{ marginBottom: "8px" }}>
                    Payments
                  </div>
                  <table
                    style={{
                      width: "100%",
                      fontSize: "13px",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <th className="small muted" style={{ textAlign: "left", padding: "6px 8px" }}>
                          When
                        </th>
                        <th className="small muted" style={{ textAlign: "left", padding: "6px 8px" }}>
                          Method
                        </th>
                        <th className="small muted" style={{ textAlign: "right", padding: "6px 8px" }}>
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(item.payments || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="small muted"
                            style={{ padding: "12px", textAlign: "center" }}
                          >
                            No payments yet
                          </td>
                        </tr>
                      ) : (
                        (item.payments || []).map((p) => (
                          <tr
                            key={p.id}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <td style={{ padding: "6px 8px" }}>
                              {p.receivedAt ? new Date(p.receivedAt).toLocaleString() : "—"}
                            </td>
                            <td style={{ padding: "6px 8px" }}>{p.method}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>
                              ₹{Number(p.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BillingPage;

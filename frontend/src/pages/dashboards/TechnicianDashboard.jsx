import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../../utils/apiClient.js";
import { useAuth } from "../../state/AuthContext.jsx";

const StatCard = ({ label, value, icon, gradient }) => (
  <div
    className="card"
    style={{
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      border: "none",
      position: "relative",
      overflow: "hidden",
      padding: "20px",
      borderRadius: "12px",
    }}
  >
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.9 }}>
        {icon}
      </div>
      <div
        className="small muted"
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "8px",
          fontSize: "28px",
          fontWeight: 700,
          color: "#fff",
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

const StartRepairModal = ({
  isOpen,
  token,
  repairInfo,
  onConfirm,
  onCancel,
}) => {
  const modalRef = useRef(null);
  const yesButtonRef = useRef(null);
  const noButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      yesButtonRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();

      if (document.activeElement === yesButtonRef.current) {
        noButtonRef.current?.focus();
      } else {
        yesButtonRef.current?.focus();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (document.activeElement === yesButtonRef.current) {
        onConfirm();
      } else if (document.activeElement === noButtonRef.current) {
        onCancel();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #064e3b, #065f46)",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "420px",
          width: "90%",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.2) inset",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🔧</span>
          <h3
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #34d399, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Start Repair
          </h3>
        </div>

        <p
          style={{
            margin: "0 0 16px 0",
            color: "#cbd5e1",
            fontSize: "15px",
            lineHeight: "1.5",
          }}
        >
          Are you sure you want to start this repair?
        </p>

        {repairInfo && (
          <div
            style={{
              margin: "16px 0",
              padding: "16px",
              background: "rgba(15, 23, 42, 0.8)",
              borderRadius: "12px",
              fontSize: "14px",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span style={{ color: "#94a3b8" }}>Token:</span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: "#34d399",
                  fontWeight: 600,
                }}
              >
                {token}
              </span>
            </div>
            {repairInfo.customer && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span style={{ color: "#94a3b8" }}>Customer:</span>
                <span style={{ color: "#f1f5f9" }}>
                  {repairInfo.customer.name}
                </span>
              </div>
            )}
            {repairInfo.device && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Device:</span>
                <span style={{ color: "#f1f5f9" }}>
                  {repairInfo.device.brand} {repairInfo.device.model}
                </span>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "24px",
          }}
        >
          <button
            ref={yesButtonRef}
            onClick={onConfirm}
            className="btn btn-primary"
            style={{
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: 600,
              background: "linear-gradient(135deg, #059669, #047857)",
              border:
                document.activeElement === yesButtonRef.current
                  ? "2px solid #fff"
                  : "none",
              borderRadius: "10px",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow:
                document.activeElement === yesButtonRef.current
                  ? "0 0 0 3px rgba(5, 150, 105, 0.5)"
                  : "none",
              minWidth: "100px",
            }}
          >
            Yes
          </button>
          <button
            ref={noButtonRef}
            onClick={onCancel}
            className="btn btn-ghost"
            style={{
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: 500,
              background: "rgba(255, 255, 255, 0.05)",
              border:
                document.activeElement === noButtonRef.current
                  ? "2px solid #9e2929"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "#f1f5f9",
              cursor: "pointer",
              transition: "all 0.2s",
              minWidth: "100px",
            }}
          >
            No
          </button>
        </div>

        <div
          style={{
            marginTop: "20px",
            fontSize: "12px",
            color: "#5e728f",
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "16px",
          }}
        >
          <span
            style={{
              background: "rgba(255,255,255,0.05)",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            ← → arrows to switch · Enter to select · Esc to cancel
          </span>
        </div>
      </div>
    </div>
  );
};

const TechnicianDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [manualToken, setManualToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [processingToken, setProcessingToken] = useState(false);

  const [showStartModal, setShowStartModal] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [repairInfo, setRepairInfo] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const scannerContainerId = useRef(`dashboard-scanner-${Date.now()}`);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const tokenInputRef = useRef(null);

  const isTechnicianUser = hasRole("TECHNICIAN") || hasRole("ADMIN");
  const canViewRepairDetails = isTechnicianUser;
  const canUpdateRepairStatus = isTechnicianUser;
  const canManageWorkQueue = isTechnicianUser;
  const canUpdateDiagnosis = isTechnicianUser;
  const canViewPerformanceMetrics = isTechnicianUser;
 const handleTokenWithConfirmation = useCallback(async (token) => {
  if (!token || !token.trim()) {
    setTokenError("Please enter a QR token");
    return;
  }

  const trimmedToken = token.trim();
  setProcessingToken(true);
  setTokenError("");

  try {
    const response = await api.get(`/repairs/by-qr/${trimmedToken}`);

    if (response.data && response.data.id) {
 const finalizedStatuses = ["REPAIRED", "UNREPAIRABLE", "DELIVERED"];
    if (finalizedStatuses.includes(response.data.status)) {
      setTokenError(`This repair is already ${response.data.status.toLowerCase()}. Cannot start.`);
      setProcessingToken(false);
      return;
    }

      // Check if the repair is already assigned to someone else (with Admin bypass)
      const isAdmin = user?.roleCode === "ADMIN" || user?.permissions?.includes("*:*");
      if (response.data.status === "IN_REPAIR" && 
          response.data.assignedToUserId && 
          String(response.data.assignedToUserId) !== String(user?.id) &&
          !isAdmin) {
        
        // Get the technician name from the response
        const techName = response.data.assignedTo?.name || "another technician";
        
        // Show error message instead of opening modal
        setTokenError(`This repair item is already being repaired by ${techName}.`);
        setProcessingToken(false);
        return;
      }
      
      // If not assigned or assigned to current user, proceed with modal
      // If already assigned to me and in repair, skip modal and go straight to workspace
      const isAssignedToMe = response.data.assignedToUserId && String(response.data.assignedToUserId) === String(user?.id);
      if (response.data.status === "IN_REPAIR" && (isAssignedToMe || isAdmin)) {
        navigate(`/repairs/${response.data.id}`);
        return;
      }

      setPendingToken(trimmedToken);
      setRepairInfo(response.data);
      setShowStartModal(true);
    } else {
      setTokenError("No repair found with this token");
    }
  } catch (err) {
    console.error("Token lookup error:", err);
    if (err.response?.status === 404) {
      setTokenError("No repair found with this token");
    } else if (err.response?.status === 403) {

      const errorMsg = err.response.data?.message || "You don't have permission to access this repair";
      setTokenError(errorMsg);
    } else {
      setTokenError("Failed to lookup token. Please try again.");
    }
  } finally {
    setProcessingToken(false);
  }
}, [user?.id,navigate]);

 const startScanner = useCallback(async () => {
    try {
      setTokenError("");
      setIsScanning(true);

      // Give React time to render the scanner container
      setTimeout(async () => {
        try {
          const html5Qrcode = new Html5Qrcode(scannerContainerId.current);
          scannerRef.current = html5Qrcode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          await html5Qrcode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              // console.log("Dashboard QR Scanned:", decodedText);
              handleTokenWithConfirmation(decodedText);
              stopScanner();
            },
            (errorMessage) => {
              // Ignore scan errors as they are frequent while searching
            }
          );
        } catch (err) {
          console.error("Failed to start camera:", err);
          setTokenError("Failed to start camera. Please ensure permissions are granted.");
          setIsScanning(false);
        }
      }, 100);
    } catch (err) {
      console.error("Scanner error:", err);
      setIsScanning(false);
    }
  }, [handleTokenWithConfirmation, stopScanner]);


  
  const handleStartRepair = useCallback(async () => {
    if (!pendingToken || !repairInfo) return;

    setShowStartModal(false);
    setProcessingToken(true);
    setTokenError("");

    try {
      const repairId = repairInfo.id;

      // Only transition if not already IN_REPAIR
     if ( repairInfo.status !== "IN_REPAIR") {
        try {
          await api.post(`/repairs/${repairId}/transition`, {
            newStatus: "IN_REPAIR",
          });
        } 
        
        catch (transitionErr) {
          
          if (transitionErr.response?.status === 409) {
            
            setTokenError(transitionErr.response.data.message || "This repair is already being worked on by another technician.");
            setPendingToken("");
            setRepairInfo(null);
            setManualToken("");
            setTimeout(() => tokenInputRef.current?.focus(), 100);
            return;
          }
          throw transitionErr;
        }
      }

       
      navigate(`/repairs/${repairId}`);
    } catch (err) {
       console.error("Full error:", err);
  const realMessage = err.response?.data?.message || err.message;
  setTokenError(realMessage);   
    } finally {
      setProcessingToken(false);
      setPendingToken("");
      setRepairInfo(null);
      setManualToken("");
      setTimeout(() => tokenInputRef.current?.focus(), 100);
    }
  }, [pendingToken, repairInfo, navigate]);

  const handleCancelStart = useCallback(() => {
    setShowStartModal(false);
    setPendingToken("");
    setRepairInfo(null);
    setManualToken("");
    setTimeout(() => tokenInputRef.current?.focus(), 100);
  }, []);
  useEffect(() => {
    if (isTechnicianUser && tokenInputRef.current) {
      tokenInputRef.current.focus();
    }

    const handleGlobalKeyPress = (e) => {
      if (
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        e.key !== "Enter" &&
        e.key.length === 1
      ) {
        if (tokenInputRef.current) {
          tokenInputRef.current.focus();
        }
      }
    };

    const handleGlobalPaste = (e) => {
      if (
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        const pastedText = e.clipboardData.getData("text");
        if (pastedText && tokenInputRef.current) {
          e.preventDefault();
          tokenInputRef.current.focus();
          setManualToken(pastedText);

          if (pastedText.trim().length > 0) {
            handleTokenWithConfirmation(pastedText);
          }
        }
      }
    };

    window.addEventListener("keypress", handleGlobalKeyPress);
    window.addEventListener("paste", handleGlobalPaste);

    return () => {
      window.removeEventListener("keypress", handleGlobalKeyPress);
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [isTechnicianUser, handleTokenWithConfirmation]);
  

  // --- FIX: Dashboard data fetching ---
  useEffect(() => {
    if (!isTechnicianUser) {
      setError(
        "Access denied. You need TECHNICIAN role to access this dashboard."
      );
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await api.get("/dashboard/technician");
        setData(response.data);
        setError("");
      } catch (err) {
        console.error("Dashboard error:", err);
        if (err.response?.status === 403) {
          setError("Permission denied. Contact your administrator.");
        } else if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setError(
            err.response?.data?.message || "Failed to load dashboard data"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isTechnicianUser, navigate]);

  const handleTokenInputChange = (e) => {
    const value = e.target.value;
    setManualToken(value);
    setTokenError("");
  };

  const handleTokenInputKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTokenWithConfirmation(manualToken);
    }
  };

  const current = data?.current_month_stats ?? {};
  const assigned = Array.isArray(data?.my_active_repairs)
    ? data.my_active_repairs
    : [];
  const pending = Array.isArray(data?.pending_repairs)
    ? data.pending_repairs
    : [];

  if (!isTechnicianUser) {
    return (
      <div
        className="content"
        style={{ padding: "40px 20px", textAlign: "center" }}
      >
        <div
          style={{ fontSize: "64px", marginBottom: "24px", opacity: 0.3 }}
        ></div>
        <h2 style={{ marginBottom: "12px" }}>Access Restricted</h2>
        <p
          className="muted"
          style={{ maxWidth: "500px", margin: "0 auto 24px" }}
        >
          This dashboard is only available to users with{" "}
          <strong>TECHNICIAN</strong> role.
        </p>
        <p className="small muted" style={{ marginBottom: "32px" }}>
          Your current role: <strong>{user?.roleName ?? "Unknown"}</strong>
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn btn-primary"
        >
          Go to Main Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="content dashboard-technician">
      <StartRepairModal
        isOpen={showStartModal}
        token={pendingToken}
        repairInfo={repairInfo}
        onConfirm={handleStartRepair}
        onCancel={handleCancelStart}
      />

      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>
          🔧 Technician Dashboard
        </h2>
        <div className="small muted" style={{ marginTop: "4px" }}>
          Welcome, <strong>{user?.name ?? "Technician"}</strong> (
          {user?.roleName ?? "N/A"})
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "10px",
            color: "#f87171",
            marginBottom: "16px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: "24px", padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3
            className="muted"
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Quick QR Scan / Manual Entry
          </h3>
        </div>

        <div style={{ marginBottom: "20px" }}>
          {!isScanning ? (
            <button
              onClick={startScanner}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "16px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                borderRadius: "12px",
                boxShadow: "0 10px 20px rgba(16, 185, 129, 0.25)",
                color: "#fff"
              }}
            >
              <span style={{ fontSize: "24px" }}>📸</span>
              START CAMERA SCANNER
            </button>
          ) : (
            <div style={{ position: "relative" }}>
              <div 
                key={Date.now()}
                id={scannerContainerId.current} 
                style={{ 
                  width: "100%", 
                  minHeight: "300px", 
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "#000",
                  border: "2px solid var(--accent)"
                }}
              />
              <button
                onClick={stopScanner}
                className="btn"
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  zIndex: 10,
                  padding: "8px 16px",
                  background: "rgba(239, 68, 68, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "12px"
                }}
              >
                Close Scanner
              </button>
              <div style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                right: "12px",
                textAlign: "center",
                background: "rgba(0,0,0,0.6)",
                padding: "8px",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#fff",
                zIndex: 10
              }}>
                Point camera at QR code
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 1, minWidth: "300px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "13px",
                color: "var(--muted)",
              }}
            >
              Enter or Scan QR Token
            </label>
            <input
              ref={tokenInputRef}
              type="text"
              value={manualToken}
              onChange={handleTokenInputChange}
              onKeyPress={handleTokenInputKeyPress}
              placeholder="Scan QR code or paste token (e.g., LAB2501310001)"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "15px",
                background: "rgba(255, 255, 255, 0.03)",
                border: tokenError
                  ? "1px solid #ef4444"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "calc(var(--radius) - 2px)",
                color: "var(--text)",
                outline: "none",
                transition: "all 0.2s",
              }}
              autoFocus
              disabled={processingToken}
            />
            {tokenError && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>⚠️</span> {tokenError}
              </div>
            )}
          </div>

          <button
            onClick={() => handleTokenWithConfirmation(manualToken)}
            className="btn btn-primary"
            disabled={processingToken}
            style={{
              padding: "14px 28px",
              fontSize: "14px",
              fontWeight: "600",
              minWidth: "160px",
              background: processingToken
                ? "linear-gradient(90deg, #6b7280, #4b5563)"
                : "linear-gradient(90deg, #3b82f6, #2563eb)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              cursor: processingToken ? "wait" : "pointer",
              transition: "all 0.2s",
              opacity: processingToken ? 0.7 : 1,
            }}
          >
            {processingToken ? (
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  className="spinner-small"
                  style={{
                    display: "inline-block",
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                ></span>
                Opening...
              </span>
            ) : (
              "Open Repair →"
            )}
          </button>
        </div>

        <div
          className="muted small"
          style={{
            marginTop: "12px",
            display: "flex",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <span>
            📌 Enter a QR code token or use your scanner to open a repair
            workspace
          </span>
          <span
            style={{
              padding: "2px 8px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "4px",
              fontSize: "11px",
            }}
          >
            Scanner automatically focuses here
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div
            className="spinner"
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f4f6",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              margin: "0 auto 16px",
            }}
          ></div>
          <div className="muted">Loading dashboard data...</div>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            <StatCard
              icon="📋"
              label="Assigned"
              value={assigned.length ?? 0}
              gradient={["#10b981", "#059669"]}
            />
            <StatCard
              icon="⏳"
              label="In Progress"
              value={current.repairs_in_progress ?? 0}
              gradient={["#f59e0b", "#d97706"]}
            />
            <StatCard
              icon="✅"
              label="Completed (month)"
              value={current.total_repairs_completed ?? 0}
              gradient={["#3b82f6", "#2563eb"]}
            />
            <StatCard
              icon="⏱️"
              label="Avg completion (hrs)"
              value={
                current.average_completion_time_hours !== undefined
                  ? `${current.average_completion_time_hours}`
                  : "N/A"
              }
              gradient={["#8b5cf6", "#7c3aed"]}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              marginTop: "24px",
            }}
          >
            <div className="card">
              <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>
                Assigned Repairs
              </h3>
              {assigned.length === 0 ? (
                <p className="muted">No assigned repairs</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left" }}>
                    <thead>
                      <tr>
                        <th>QR</th>
                        <th>Device</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assigned.slice(0, 10).map((r) => (
                        <tr key={r.id}>
                          <td
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <code style={{ fontFamily: "monospace" }}>
                              {r.qrToken || r.id}
                            </code>
                            <button
                              className="btn btn-ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  r.qrToken || r.id,
                                );
                                alert("Copied " + (r.qrToken || r.id));
                              }}
                            >
                              Copy
                            </button>
                          </td>
                          <td>
                            {r.device?.brand} {r.device?.model}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                background:
                                  r.status === "IN_PROGRESS"
                                    ? "#d8a665"
                                    : "#3cbd69",
                                color:
                                  r.status === "IN_PROGRESS"
                                    ? "#6e1e04"
                                    : "#034b1f",
                              }}
                            >
                              {r.status || "UNKNOWN"}
                            </span>
                          </td>
                          <td>
                            {canViewRepairDetails && (
                              <Link
                                to={`/repairs/${r.id}`}
                                className="btn btn-ghost"
                                style={{ fontSize: "12px" }}
                              >
                                Open
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>
                Pending Repairs
              </h3>
              {pending.length === 0 ? (
                <p className="muted">No pending repairs</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left" }}>
                    <thead>
                      <tr>
                        <th>QR</th>
                        <th>Issue</th>
                        <th>Priority</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.slice(0, 10).map((r) => (
                        <tr key={r.id}>
                          <td
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <code style={{ fontFamily: "monospace" }}>
                              {r.qrToken || r.id}
                            </code>
                            <button
                              className="btn btn-ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  r.qrToken || r.id,
                                );
                                alert("Copied " + (r.qrToken || r.id));
                              }}
                            >
                              Copy
                            </button>
                          </td>
                          <td>{r.issue || "N/A"}</td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                background:
                                  r.priority === "HIGH" ? "#fee2e2" : "#ffedd5",
                                color:
                                  r.priority === "HIGH" ? "#991b1b" : "#9a3412",
                              }}
                            >
                              {r.priority || "MEDIUM"}
                            </span>
                          </td>
                          <td>
                            {canUpdateRepairStatus && (
                              <Link
                                to={`/repairs/${r.id}`}
                                className="btn btn-primary"
                                style={{ fontSize: "12px" }}
                              >
                                Start
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: "24px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
              Quick Actions
            </h3>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {canManageWorkQueue && (
                <Link to="/queue" className="btn btn-primary">
                  📋 Work Queue
                </Link>
              )}
              {canUpdateDiagnosis && (
                <Link to="/repairs" className="btn btn-ghost">
                  🔍 View All Repairs
                </Link>
              )}
              {canViewPerformanceMetrics && (
                <Link to="/technician/performance" className="btn btn-ghost">
                  📊 Performance
                </Link>
              )}
            </div>
          </div>

          {canViewPerformanceMetrics && (
            <div className="card" style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>
                📊 Performance Metrics
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    background: "#081f4d",
                    borderRadius: "8px",
                  }}
                >
                  <div className="small muted">Total Completed</div>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>
                    {current.total_repairs_completed ?? 0}
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px",
                    background: "#081f4d",
                    borderRadius: "8px",
                  }}
                >
                  <div className="small muted">Avg Completion Time</div>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>
                    {current.average_completion_time_hours !== undefined
                      ? `${current.average_completion_time_hours}h`
                      : "N/A"}
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px",
                    background: "#081f4d",
                    borderRadius: "8px",
                  }}
                >
                  <div className="small muted">Success Rate</div>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>
                    {data?.success_rate
                      ? `${Number(data.success_rate).toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        .spinner-small { animation: spin 0.8s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        table { border-collapse: collapse; }
        th, td { padding: 14px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        td > code { font-family: monospace; font-size: 13px; }
        input:focus { 
          border-color: #3b82f6 !important; 
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); 
        }
      `}</style>
    </div>
  );
};

export default TechnicianDashboard;
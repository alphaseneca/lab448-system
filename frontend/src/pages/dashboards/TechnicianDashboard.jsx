import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';
import { ROLES, REPAIR_STATUSES } from '../../constants/constants';

// ---- Inline Modal for Starting Repair ----
const StartRepairModal = ({ isOpen, token, repairInfo, onConfirm, onCancel }) => {
  const yesButtonRef = useRef(null);
  const noButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && yesButtonRef.current) {
      yesButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !repairInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-secondary border border-panel rounded-xl shadow-2xl max-w-md w-full p-6 text-center animate-slide-up relative">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-primary/20 text-accent-primary mb-4">
          <span className="material-symbols-rounded text-3xl">build</span>
        </div>
        <h2 className="text-2xl font-bold text-primary tracking-tight mb-2">Start Repair?</h2>
        <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
          Scan detected for token <strong className="text-primary font-mono">{token}</strong>.
          This device is a <strong className="text-primary">{repairInfo.device?.brand} {repairInfo.device?.modelName}</strong>.
        </p>

        <div className="flex justify-center gap-4 mt-6">
          <button ref={noButtonRef} onClick={onCancel} className="btn py-2 px-6 bg-surface hover:bg-surface border border-panel hover:text-primary transition-all">
            Cancel
          </button>
          <button ref={yesButtonRef} onClick={onConfirm} className="btn btn-primary py-2 px-8 flex items-center gap-2">
            <span className="material-symbols-rounded icon-sm">play_arrow</span> Start Work
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Main Component ----
export default function TechnicianDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  // Scanning State
  const [manualToken, setManualToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [processingToken, setProcessingToken] = useState(false);
  
  // Modal State
  const [showStartModal, setShowStartModal] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [repairInfo, setRepairInfo] = useState(null);

  const tokenInputRef = useRef(null);

  const isTechnicianUser = hasRole(ROLES.TECHNICIAN) || hasRole(ROLES.ADMIN);

  // Focus management and scanning listeners
  useEffect(() => {
    if (isTechnicianUser && tokenInputRef.current) {
      tokenInputRef.current.focus();
    }

    const handleGlobalKeyPress = (e) => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && e.key !== 'Enter' && e.key.length === 1) {
        if (tokenInputRef.current) tokenInputRef.current.focus();
      }
    };

    const handleGlobalPaste = (e) => {
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        const pastedText = e.clipboardData.getData('text');
        if (pastedText && tokenInputRef.current) {
          e.preventDefault();
          tokenInputRef.current.focus();
          setManualToken(pastedText);
          if (pastedText.trim().length > 0) handleTokenWithConfirmation(pastedText);
        }
      }
    };

    window.addEventListener('keypress', handleGlobalKeyPress);
    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('keypress', handleGlobalKeyPress);
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isTechnicianUser]);

  // Data Fetch
  useEffect(() => {
    if (!isTechnicianUser) {
      setError('Access denied. You need TECHNICIAN role to access this dashboard.');
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get('/dashboard/technician')
      .then(r => {
        setData(r.data);
        setError('');
      })
      .catch(err => {
        console.error('Dashboard error:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
      })
      .finally(() => setLoading(false));
  }, [isTechnicianUser]);

  // Actions
  const handleTokenWithConfirmation = useCallback(async (token) => {
    if (!token || !token.trim()) {
      setTokenError('Please enter a QR token');
      return;
    }
    const trimmedToken = token.trim();
    setProcessingToken(true);
    setTokenError('');

    try {
      const response = await api.get(`/repair-orders/by-qr/${trimmedToken}`);
      if (response.data && response.data.id) {
        setPendingToken(trimmedToken);
        setRepairInfo(response.data);
        setShowStartModal(true);
      } else {
        setTokenError('No repair found with this token');
      }
    } catch (err) {
      if (err.response?.status === 404) setTokenError('No repair found with this token');
      else if (err.response?.status === 403) setTokenError("This repair is assigned to another technician");
      else setTokenError('Failed to lookup token. Please try again.');
    } finally {
      setProcessingToken(false);
    }
  }, []);

  const handleStartRepair = useCallback(async () => {
    if (!pendingToken || !repairInfo) return;
    setShowStartModal(false);
    setProcessingToken(true);

    try {
      const repairId = repairInfo.id;
      
      // Pull and assign the order explicitly to the scanning technician by transitioning it to IN_REPAIR
      // The backend assigns ownership to the initiator upon moving to IN_REPAIR implicitly
      if (repairInfo.status !== REPAIR_STATUSES.IN_REPAIR && repairInfo.status !== REPAIR_STATUSES.IN_DIAGNOSTICS && repairInfo.status !== REPAIR_STATUSES.QUALITY_CONTROL) {
        await api.post(`/repair-orders/${repairId}/transition`, { newStatus: REPAIR_STATUSES.IN_REPAIR, reason: "Technician scanned token to begin" });
      } else if (repairInfo.status === REPAIR_STATUSES.IN_REPAIR) {
        // Force the pull even if already in repair
        await api.post(`/repair-orders/${repairId}/transition`, { newStatus: REPAIR_STATUSES.IN_REPAIR, reason: "Technician explicitly pulled item" });
      }

      navigate(APP_ROUTES.REPAIR_WORKSPACE(repairId));
    } catch (err) {
      console.error('Error starting repair:', err);
      setTokenError('Failed to start repair. Please try again.');
    } finally {
      setProcessingToken(false);
      setPendingToken('');
      setRepairInfo(null);
      setManualToken('');
      setTimeout(() => tokenInputRef.current?.focus(), 100);
    }
  }, [pendingToken, repairInfo, navigate]);

  const handleCancelStart = useCallback(() => {
    setShowStartModal(false);
    setPendingToken('');
    setRepairInfo(null);
    setManualToken('');
    setTimeout(() => tokenInputRef.current?.focus(), 100);
  }, []);

  const handleTokenInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTokenWithConfirmation(manualToken);
    }
  };

  if (!isTechnicianUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted text-sm max-w-md text-center">This dashboard requires the TECHNICIAN role.</p>
      </div>
    );
  }

  const current = data?.current_month_stats || {};
  const assigned = Array.isArray(data?.my_active_repairs) ? data.my_active_repairs : [];
  const pending = Array.isArray(data?.pending_repairs) ? data.pending_repairs : [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      <StartRepairModal
        isOpen={showStartModal}
        token={pendingToken}
        repairInfo={repairInfo}
        onConfirm={handleStartRepair}
        onCancel={handleCancelStart}
      />

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">🔧 Technician Dashboard</h1>
        <p className="text-muted text-sm mt-1">
          Welcome, <strong className="text-primary">{user?.fullName || "Mechanic"}</strong>. Ready to work?
        </p>
      </header>

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-md font-medium flex items-center gap-2">
           <span className="material-symbols-rounded">error</span> {error}
        </div>
      )}

      {/* QR SCAN WIDGET */}
      <div className="card border-l-4" style={{ borderLeftColor: 'var(--accent-primary)' }}>
        <h3 className="text-sm uppercase font-bold tracking-wider text-secondary mb-4 flex items-center gap-2">
          <span className="material-symbols-rounded icon-sm text-accent-primary">qr_code_scanner</span> Select / Accept Assignment
        </h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
             <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Enter QR Token Manually or Scan</label>
             <input
                ref={tokenInputRef}
                type="text"
                placeholder="e.g. LAB44820240001"
                className="font-mono text-base tracking-widest placeholder:tracking-normal w-full"
                value={manualToken}
                onChange={(e) => { setManualToken(e.target.value); setTokenError(''); }}
                onKeyPress={handleTokenInputKeyPress}
                disabled={processingToken}
             />
             {tokenError && <p className="text-danger text-xs mt-2 font-medium flex items-center gap-1"><span className="material-symbols-rounded icon-sm">warning</span> {tokenError}</p>}
          </div>

          <button
             onClick={() => handleTokenWithConfirmation(manualToken)}
             disabled={processingToken || !manualToken}
             className="btn btn-primary"
             style={{ minWidth: 160 }}
          >
             {processingToken ? 'Processing...' : 'Pull Records'}
          </button>
        </div>
        <p className="text-xs text-muted mt-3 italic text-right md:text-left">Use your barcode scanner or paste a token ID here.</p>
      </div>

      {loading ? (
        <div className="text-center p-12"><span className="material-symbols-rounded animate-spin icon-lg text-accent-primary">refresh</span></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="card !bg-gradient-to-br from-success/20 to-transparent border border-success/30 !p-5">
               <div className="text-success/80 text-xs font-bold uppercase tracking-wider mb-2">My Queue</div>
               <div className="text-3xl font-extrabold text-success">{assigned.length || 0}</div>
             </div>
             <div className="card !bg-gradient-to-br from-warning/20 to-transparent border border-warning/30 !p-5">
               <div className="text-warning/80 text-xs font-bold uppercase tracking-wider mb-2">In Progress</div>
               <div className="text-3xl font-extrabold text-warning">{current.repairs_in_progress || 0}</div>
             </div>
             <div className="card !bg-gradient-to-br from-accent-primary/20 to-transparent border border-accent-primary/30 !p-5">
               <div className="text-accent-primary/80 text-xs font-bold uppercase tracking-wider mb-2">Completed Month</div>
               <div className="text-3xl font-extrabold text-accent-primary">{current.repairs_completed || 0}</div>
             </div>
             <div className="card !p-5">
               <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Efficiency</div>
               <div className="text-3xl font-extrabold text-primary">{current.avg_completion_minutes ? `${(current.avg_completion_minutes / 60).toFixed(1)}h` : 'N/A'}</div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            
            {/* Active/Assigned Queue */}
            <div className="card !p-0 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-panel bg-surface/30">
                <h3 className="text-sm uppercase font-bold tracking-wider text-secondary">My Active Assignments ({assigned.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface/20 text-xs uppercase tracking-wider text-muted font-bold">
                    <tr>
                      <th className="p-4 py-3 border-b border-panel font-medium">QR Token</th>
                      <th className="p-4 py-3 border-b border-panel font-medium">Device</th>
                      <th className="p-4 py-3 border-b border-panel font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-panel">
                    {assigned.length === 0 ? (
                      <tr><td colSpan="3" className="p-6 text-center text-muted italic">Queue is clear!</td></tr>
                    ) : assigned.map(r => (
                      <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                        <td className="p-4 font-mono font-medium text-xs text-secondary">{r.qrToken || r.ticketNumber}</td>
                        <td className="p-4 font-bold text-primary">{r.device?.brand} {r.device?.modelName}</td>
                        <td className="p-4 text-right">
                          <Link to={APP_ROUTES.REPAIR_WORKSPACE(r.id)} className="btn btn-ghost text-xs">Work <span className="material-symbols-rounded icon-sm text-xs">arrow_forward</span></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Unassigned Pool Workspace */}
            <div className="card !p-0 overflow-hidden flex flex-col opacity-90 hover:opacity-100 transition-opacity">
              <div className="p-4 border-b border-panel bg-warning/10">
                <h3 className="text-sm uppercase font-bold tracking-wider text-warning flex items-center gap-2"><span className="material-symbols-rounded icon-sm">front_loader</span> Unassigned Pending Waitlist</h3>
              </div>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface/20 text-xs uppercase tracking-wider text-muted font-bold sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="p-4 py-3 border-b border-panel font-medium">Ticket #</th>
                      <th className="p-4 py-3 border-b border-panel font-medium">Device & Issue</th>
                      <th className="p-4 py-3 border-b border-panel font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-panel">
                    {pending.length === 0 ? (
                      <tr><td colSpan="3" className="p-6 text-center text-muted italic text-xs">No pending repairs waiting in shop.</td></tr>
                    ) : pending.map(r => (
                      <tr key={r.id} className="hover:bg-surface/50 transition-colors text-xs">
                        <td className="p-4 font-mono font-medium text-muted">{r.ticketNumber}</td>
                        <td className="p-4">
                          <p className="font-bold text-primary mb-0.5">{r.device?.brand} {r.device?.modelName}</p>
                          <p className="text-muted max-w-[150px] truncate">{r.intakeNotes || 'No notes'}</p>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleTokenWithConfirmation(r.qrToken || r.ticketNumber)} className="btn btn-secondary text-[11px] py-1 px-3 border border-warning/30 text-warning hover:bg-warning/20 hover:text-warning">Accept</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

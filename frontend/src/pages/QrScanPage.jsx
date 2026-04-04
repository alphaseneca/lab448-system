import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';
import { REPAIR_STATUS_LABELS } from '../constants/constants';

export default function QrScanPage() {
  const navigate = useNavigate();
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [copyToast, setCopyToast] = useState('');
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueFilter, setQueueFilter] = useState('');

  const scannerRef = useRef(null);
  const qrReaderId = 'qr-scanner-viewport';

  // ── Load queue ────────────────────────────────────────────────────
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setQueueLoading(true);
    try {
      const res = await api.get('/repair-orders', {
        params: { statuses: 'PENDING,IN_DIAGNOSTICS,APPROVED,IN_REPAIR,QUALITY_CONTROL', limit: 100 },
      });
      setQueue(res.data?.data || res.data || []);
    } catch {
      setQueue([]);
    } finally {
      setQueueLoading(false);
    }
  };

  // ── Camera scanner ────────────────────────────────────────────────
  const startScanner = async () => {
    setError('');
    setCameraError('');
    setCameraLoading(true);

    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }

    const el = document.getElementById(qrReaderId);
    if (el) el.innerHTML = '';

    try {
      const scanner = new Html5Qrcode(qrReaderId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (decodedText) => handleToken(decodedText),
        () => {}
      );
      setCameraLoading(false);
      setScanning(true);
    } catch {
      // Try front camera
      try {
        const scanner = new Html5Qrcode(qrReaderId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
          (decodedText) => handleToken(decodedText),
          () => {}
        );
        setCameraLoading(false);
        setScanning(true);
      } catch {
        setCameraError('Camera access denied. Please grant camera permissions and try again.');
        setCameraLoading(false);
        scannerRef.current = null;
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setCameraLoading(false);
    const el = document.getElementById(qrReaderId);
    if (el) el.innerHTML = '';
  };

  useEffect(() => () => {
    if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); }
  }, []);

  // ── Token resolution ──────────────────────────────────────────────
  const handleToken = async (token) => {
    if (!token?.trim()) { setError('Please enter a token.'); return; }
    if (scanning) await stopScanner();
    setError('');
    try {
      const res = await api.get(`/repair-orders/by-qr/${token.trim()}`);
      navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(res.data.id));
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) setError('No repair found with this QR token.');
      else if (status === 403) setError('Permission denied.');
      else setError('Invalid or unrecognized token.');
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────
  const copyToken = (token) => {
    try {
      navigator.clipboard.writeText(token).then(() => {
        setCopyToast(`Copied: ${token}`);
        setTimeout(() => setCopyToast(''), 2500);
      });
    } catch {
      setCopyToast('Copy failed');
      setTimeout(() => setCopyToast(''), 2000);
    }
  };

  const filteredQueue = queue.filter(r => {
    if (!queueFilter) return true;
    const q = queueFilter.toLowerCase();
    return (
      (r.customer?.name || '').toLowerCase().includes(q) ||
      (r.device?.brand || '').toLowerCase().includes(q) ||
      (r.device?.modelName || '').toLowerCase().includes(q) ||
      (r.qrToken || '').toLowerCase().includes(q) ||
      (r.ticketNumber || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    const dangerStates = ['CANCELLED'];
    const successStates = ['READY_FOR_DELIVERY', 'DELIVERED'];
    const warningStates = ['WAITING_FOR_PARTS', 'WAITING_ON_CUSTOMER'];
    if (dangerStates.includes(status)) return 'badge badge-danger';
    if (successStates.includes(status)) return 'badge badge-success';
    if (warningStates.includes(status)) return 'badge badge-warning';
    return 'badge badge-primary';
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      <header>
        <h1 className="text-3xl font-extrabold mb-1">QR Scanner</h1>
        <p className="text-secondary">Scan a device QR code or search the active repair queue.</p>
      </header>

      {/* Copy toast */}
      {copyToast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-semibold shadow-xl animate-fade-in"
          style={{ background: 'var(--accent-primary)', color: '#fff' }}>
          {copyToast}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md border text-sm font-medium flex items-center gap-3 badge-danger">
          <span className="material-symbols-rounded icon-md">warning</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Camera Card ─────────────────────────────────────────── */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
              <span className="material-symbols-rounded icon-sm">photo_camera</span> Camera Scan
            </h2>
            {!scanning ? (
              <button className="btn btn-primary" onClick={startScanner} disabled={cameraLoading}>
                {cameraLoading
                  ? <><span className="material-symbols-rounded icon-sm animate-spin">progress_activity</span> Starting...</>
                  : <><span className="material-symbols-rounded icon-sm">qr_code_scanner</span> Start Camera</>
                }
              </button>
            ) : (
              <button className="btn" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }} onClick={stopScanner}>
                <span className="material-symbols-rounded icon-sm">stop_circle</span> Stop
              </button>
            )}
          </div>

          {/* Scanner viewport */}
          <div id={qrReaderId}
            className="rounded-lg overflow-hidden flex items-center justify-center"
            style={{ minHeight: 280, background: scanning ? '#000' : 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
            {!scanning && !cameraLoading && (
              <div className="text-center text-muted p-8">
                <span className="material-symbols-rounded" style={{ fontSize: '48px', opacity: 0.4 }}>qr_code_scanner</span>
                <p className="text-sm mt-3">Click "Start Camera" to activate</p>
              </div>
            )}
            {scanning && (
              <div style={{
                position: 'absolute', width: 240, height: 240,
                border: '2px solid var(--accent-primary)', borderRadius: 8,
                pointerEvents: 'none', zIndex: 5,
                boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)',
              }} />
            )}
          </div>

          {cameraError && (
            <div className="text-xs text-center p-3 rounded border" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
              {cameraError}
            </div>
          )}
          <p className="text-xs text-muted">Point the camera at the device QR label. Camera focus auto-detects codes.</p>
        </div>

        {/* ── Manual Entry Card ────────────────────────────────────── */}
        <div className="card flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
            <span className="material-symbols-rounded icon-sm">keyboard</span> Manual Token Entry
          </h2>
          <p className="text-sm text-muted">Enter or paste a QR token to jump directly to the repair workspace.</p>
          <div className="flex gap-3">
            <input
              type="text" value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleToken(manualToken)}
              placeholder="e.g. LAB2501310001"
              className="flex-1 font-mono"
            />
            <button className="btn btn-primary" onClick={() => handleToken(manualToken)}>
              <span className="material-symbols-rounded icon-sm">open_in_new</span> Open
            </button>
          </div>
          <p className="text-xs text-muted">Press Enter or click Open to look up the repair.</p>
        </div>
      </div>

      {/* ── Queue Table ─────────────────────────────────────────────── */}
      <section className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
            <span className="material-symbols-rounded icon-sm">pending_actions</span> Active Repair Queue
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{filteredQueue.length} orders</span>
            <button className="btn btn-ghost text-xs" onClick={loadQueue} disabled={queueLoading}>
              <span className={`material-symbols-rounded icon-sm ${queueLoading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        <input
          type="text" value={queueFilter}
          onChange={e => setQueueFilter(e.target.value)}
          placeholder="Filter by customer, device, ticket..."
        />

        {queueLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary">progress_activity</span>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <span className="material-symbols-rounded" style={{ fontSize: 40, opacity: 0.4 }}>inbox</span>
            <p className="text-sm mt-2">{queueFilter ? 'No repairs match your filter.' : 'No active repairs in queue.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-panel">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-panel bg-surface/50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">QR Token</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map(r => (
                  <tr key={r.id} className="border-b border-panel last:border-0 hover:bg-surface transition-colors cursor-pointer"
                    onClick={() => navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(r.id))}>
                    <td className="px-4 py-3 font-mono font-bold text-primary">{r.ticketNumber || '—'}</td>
                    <td className="px-4 py-3 font-semibold">{r.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-secondary">{r.device?.brand} {r.device?.modelName}</td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadge(r.status)}>
                        {REPAIR_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="font-mono text-xs text-muted hover:text-primary flex items-center gap-1 transition-colors"
                        onClick={ev => { ev.stopPropagation(); copyToken(r.qrToken); }}>
                        {r.qrToken} <span className="material-symbols-rounded" style={{ fontSize: 14 }}>content_copy</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="material-symbols-rounded text-muted icon-sm">arrow_forward</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

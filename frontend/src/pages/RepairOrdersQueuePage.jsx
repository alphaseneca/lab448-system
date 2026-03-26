import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { APP_ROUTES } from '../constants/routes';
import { REPAIR_STATUSES } from '../constants/constants';

const QUEUE_STATUSES = [
  REPAIR_STATUSES.PENDING,
  REPAIR_STATUSES.IN_REPAIR,
  REPAIR_STATUSES.READY_FOR_DELIVERY,
];

export default function RepairOrdersQueuePage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/repair-orders');
      const list = (res.data.data || []).filter((row) => QUEUE_STATUSES.includes(row.status));
      setRows(list);
    } catch (err) {
      console.error('Failed to load repair order queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Repair Order Queue</h1>
          <p className="text-secondary tracking-wide">Operational queue for pending and in-progress repair orders.</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchQueue}>Refresh</button>
      </header>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface/40 border-b border-panel">
              <th className="px-4 py-3 text-xs uppercase text-muted">Order</th>
              <th className="px-4 py-3 text-xs uppercase text-muted">Customer</th>
              <th className="px-4 py-3 text-xs uppercase text-muted">Device</th>
              <th className="px-4 py-3 text-xs uppercase text-muted">Status</th>
              <th className="px-4 py-3 text-xs uppercase text-muted text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-8 text-muted" colSpan="5">Loading queue...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-8 text-muted" colSpan="5">No active repair orders in queue.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-t border-panel/50 hover:bg-surface-hover">
                <td className="px-4 py-3 font-semibold text-accent-primary">{row.ticketNumber || row.id}</td>
                <td className="px-4 py-3">{row.customer?.name || '-'}</td>
                <td className="px-4 py-3">{row.device?.brand} {row.device?.modelName}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3 text-right">
                  <button className="btn btn-secondary py-1 px-2 text-xs" onClick={() => navigate(APP_ROUTES.REPAIR_ORDER_DETAILS(row.id))}>
                    Open Workspace
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


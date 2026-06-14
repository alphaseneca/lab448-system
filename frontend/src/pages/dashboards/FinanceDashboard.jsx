import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import RoleDashboardBase from './RoleDashboardBase';

export default function FinanceDashboard() {
  return (
    <RoleDashboardBase
      title="Finance Dashboard"
      subtitle="Revenue tracking, due balances, and payment visibility."
      endpoint="/dashboard/finance"
      metricsBuilder={(data) => {
        const month = data?.current_month || {};
        const unpaidCount = data?.unpaid_invoices?.length ?? 0;
        return [
          { label: 'Today Collections', value: `Rs. ${Number(data?.today_collections || 0).toFixed(2)}`, icon: 'payments' },
          { label: 'Month Revenue', value: `Rs. ${Number(month.total_revenue || 0).toFixed(2)}`, icon: 'bar_chart' },
          { label: 'Outstanding', value: `Rs. ${Number(month.outstanding_amount || 0).toFixed(2)}`, icon: 'account_balance_wallet' },
          { label: 'Pending Invoices', value: unpaidCount, icon: 'receipt_long' },
        ];
      }}
      actions={[
        { to: APP_ROUTES.CUSTOMERS, label: 'Billing & Payments' },
        { to: APP_ROUTES.REPAIR_ORDERS_LIST, label: 'Repair Orders' },
      ]}
    >
      {(data) => {
        const breakdown = data?.current_month?.payment_method_breakdown || {};
        const recent = data?.recent_payments || [];
        const unpaid = data?.unpaid_invoices || [];

        return (
          <div className="flex flex-col gap-6 mt-6">
            {/* Payment Method Breakdown */}
            {Object.keys(breakdown).length > 0 && (
              <div className="card">
                <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4 flex items-center gap-2">
                  <span className="material-symbols-rounded icon-sm text-accent-primary">pie_chart</span>
                  Payment Method Breakdown (This Month)
                </h3>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(breakdown).map(([method, amt]) => (
                    <div key={method} className="px-5 py-4 bg-surface border border-panel rounded-xl flex flex-col gap-1 min-w-[150px]">
                      <span className="text-xs font-semibold text-secondary tracking-wide uppercase">
                        {method.replace(/_/g, ' ')}
                      </span>
                      <span className="text-lg font-extrabold text-text-primary">
                        Rs. {Number(amt || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent Payments */}
              <div className="card flex flex-col gap-4 !p-0 overflow-hidden">
                <div className="p-5 border-b border-panel bg-surface flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                    <span className="material-symbols-rounded icon-sm text-accent-primary">history</span>
                    Recent Payments
                  </h3>
                  <span className="text-xs text-muted font-medium">{recent.length} records</span>
                </div>
                <div className="overflow-x-auto max-h-[350px] scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-panel bg-secondary/40">
                        <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-muted uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-muted text-sm">
                            No recent payments recorded.
                          </td>
                        </tr>
                      ) : (
                        recent.slice(0, 15).map((p) => (
                          <tr key={p.id} className="border-b border-panel last:border-0 hover:bg-surface transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-text-primary">
                              {p.invoice?.invoiceNumber || '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-secondary">
                              {p.invoice?.customer?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-extrabold text-green-400">
                              Rs. {Number(p.amount).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <span className="badge badge-neutral">{p.paymentMethod || p.method || 'OTHER'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending / Unpaid Invoices */}
              <div className="card flex flex-col gap-4 !p-0 overflow-hidden">
                <div className="p-5 border-b border-panel bg-surface flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                    <span className="material-symbols-rounded icon-sm text-accent-primary">pending_actions</span>
                    Pending Invoices
                  </h3>
                  <span className="text-xs text-muted font-medium">{unpaid.length} pending</span>
                </div>
                <div className="overflow-x-auto max-h-[350px] scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-panel bg-secondary/40">
                        <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-muted uppercase tracking-wider">Balance Due</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaid.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-muted text-sm">
                            No pending invoices.
                          </td>
                        </tr>
                      ) : (
                        unpaid.slice(0, 15).map((inv) => (
                          <tr key={inv.id} className="border-b border-panel last:border-0 hover:bg-surface transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-text-primary">
                              {inv.invoiceNumber || '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-secondary">
                              {inv.customer?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-extrabold text-red-400">
                              Rs. {Number(inv.outstanding ?? (Number(inv.totalAmount) - Number(inv.totalPaidAmount))).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {inv.repairOrderId ? (
                                <NavLink to={APP_ROUTES.REPAIR_ORDER_BILLING(inv.repairOrderId)} className="btn btn-secondary py-1.5 px-3 text-xs">
                                  Collect
                                </NavLink>
                              ) : (
                                <span className="text-xs text-muted">No order</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </RoleDashboardBase>
  );
}

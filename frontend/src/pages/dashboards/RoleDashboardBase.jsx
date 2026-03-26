import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../../services/api';

function StatCard({ label, value, icon }) {
  return (
    <div className="card card-hoverable !p-5">
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-xs font-bold text-secondary uppercase tracking-wider">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
    </div>
  );
}

export default function RoleDashboardBase({
  title,
  subtitle,
  endpoint,
  metricsBuilder,
  actions = [],
  children,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get(endpoint);
        setData(res.data);
      } catch (err) {
        console.error(`Failed to load ${title} dashboard`, err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [endpoint, title]);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-extrabold mb-1">{title}</h1>
        <p className="text-secondary">{subtitle}</p>
      </header>

      {loading ? (
        <div className="h-44 flex items-center justify-center">
          <span className="material-symbols-rounded icon-lg animate-spin text-accent-primary">refresh</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {metricsBuilder(data).map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
            ))}
          </div>

          {actions.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                {actions.map((action) => (
                  <NavLink key={action.to} to={action.to} className="btn btn-ghost">
                    {action.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {children?.(data)}
        </>
      )}
    </div>
  );
}

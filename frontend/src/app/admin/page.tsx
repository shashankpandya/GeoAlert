'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DashboardData {
  timestamp: string;
  providers: Array<{
    source_id: string;
    name: string;
    classification: string;
    uptime_percentage: number;
    error_rate: number;
    last_ingested_at: string | null;
    status: string;
  }>;
  alertCountsBySeverity: Record<string, number>;
  systemStatus: string;
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<{ status: string } | null>(null);

  const loadData = async () => {
    // Always check health first
    try {
      const hr = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
      if (hr.ok) setHealth(await hr.json());
    } catch {
      setHealth(null);
    }

    try {
      const r = await fetch(`${API_BASE}/api/admin/dashboard`, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
      setData(await r.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 30000);
    return () => clearInterval(iv);
  }, []);

  const totalAlerts = data ? Object.values(data.alertCountsBySeverity).reduce((s, n) => s + n, 0) : 0;

  const cardStyle: React.CSSProperties = {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '8px',
    padding: '16px',
  };

  return (
    <main role="main" style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui, sans-serif', padding: '24px 20px' }}>
      <header role="banner" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.85rem' }}>&#8592; Home</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Admin Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>
            {loading ? 'Loading...' : data ? `Updated ${new Date(data.timestamp).toLocaleTimeString()}` : 'Auto-refresh every 30s'}
          </span>
          <button onClick={loadData} style={{ background: '#21262d', color: '#8b949e', border: '1px solid #30363d', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Refresh
          </button>
        </div>
      </header>

      {/* API Status */}
      <section aria-labelledby="api-status" style={{ ...cardStyle, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 id="api-status" style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>API Status</h2>
        <span style={{
          background: health ? '#14532d' : '#450a0a',
          color: health ? '#86efac' : '#fca5a5',
          padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700
        }}>
          {health ? `\u2713 Online (${API_BASE})` : `\u2715 Offline \u2014 start backend on port 8000`}
        </span>
        {health && <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>v{(health as Record<string, unknown>).version as string ?? '?'}</span>}
      </section>

      {error && (
        <div role="alert" style={{ ...cardStyle, marginBottom: '16px', borderColor: '#7f1d1d', background: '#450a0a', color: '#fca5a5', fontSize: '0.9rem' }}>
          <strong>Dashboard error:</strong> {error}
          {!health && <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#f87171' }}>
            Start the backend: <code style={{ background: '#7f1d1d', padding: '2px 6px', borderRadius: '4px' }}>cd backend &amp;&amp; uvicorn app.main:app --reload --port 8000</code>
          </p>}
        </div>
      )}

      {/* Alert counts */}
      {data && (
        <>
          <section aria-labelledby="alert-counts" style={{ marginBottom: '16px' }}>
            <h2 id="alert-counts" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Active Alerts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Total', count: totalAlerts, color: '#58a6ff' },
                { label: 'Extreme', count: data.alertCountsBySeverity.extreme ?? 0, color: '#f85149' },
                { label: 'Severe', count: data.alertCountsBySeverity.severe ?? 0, color: '#fb923c' },
                { label: 'Moderate', count: data.alertCountsBySeverity.moderate ?? 0, color: '#fbbf24' },
                { label: 'Minor', count: data.alertCountsBySeverity.minor ?? 0, color: '#4ade80' },
              ].map(item => (
                <div key={item.label} style={{ ...cardStyle, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color }}>{item.count}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '4px' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="providers-heading">
            <h2 id="providers-heading" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
              Alert Providers ({data.providers.length})
            </h2>
            {data.providers.length === 0 ? (
              <div style={{ ...cardStyle, color: '#8b949e', textAlign: 'center', padding: '32px' }}>
                No providers configured yet. Use <code>/api/sources/classify</code> to add sources.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {data.providers.map(p => (
                  <div key={p.source_id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '2px' }}>
                        {p.classification} &middot; Last: {p.last_ingested_at ? new Date(p.last_ingested_at).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: p.uptime_percentage >= 95 ? '#4ade80' : p.uptime_percentage >= 80 ? '#fbbf24' : '#f85149' }}>
                        {p.uptime_percentage.toFixed(1)}% uptime
                      </span>
                      <span style={{ color: p.error_rate > 10 ? '#f85149' : '#8b949e' }}>
                        {p.error_rate.toFixed(1)}% errors
                      </span>
                      <span style={{ background: p.status === 'active' ? '#14532d' : '#450a0a', color: p.status === 'active' ? '#86efac' : '#fca5a5', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

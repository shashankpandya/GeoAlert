'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const IS_PROD = process.env.NODE_ENV === 'production';

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

const ALERT_STAT_CONFIG = [
  { key: 'total',    label: 'Total',    color: 'var(--accent)' },
  { key: 'extreme',  label: 'Extreme',  color: 'var(--sev-extreme)' },
  { key: 'severe',   label: 'Severe',   color: 'var(--sev-severe)' },
  { key: 'moderate', label: 'Moderate', color: 'var(--sev-moderate)' },
  { key: 'minor',    label: 'Minor',    color: 'var(--sev-minor)' },
] as const;

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const hr = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
      if (hr.ok) setHealth(await hr.json());
      else setHealth(null);
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
  }, []);

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 30000);
    return () => clearInterval(iv);
  }, [loadData]);

  const totalAlerts = data
    ? Object.values(data.alertCountsBySeverity).reduce((s, n) => s + n, 0)
    : 0;

  return (
    <main
      role="main"
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--bg)',
        color: 'var(--text-primary)',
        padding: '24px 20px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      {/* Page header */}
      <header style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Admin Dashboard
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {loading
              ? 'Loading...'
              : data
              ? `Last updated ${new Date(data.timestamp).toLocaleTimeString()}`
              : 'Auto-refreshes every 30 seconds'}
          </p>
        </div>
        <button
          onClick={loadData}
          className="ga-btn ga-btn-ghost"
          aria-label="Refresh dashboard"
        >
          ↻ Refresh
        </button>
      </header>

      {/* API Status card */}
      <section
        aria-labelledby="api-status-heading"
        className="ga-card"
        style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
      >
        <h2 id="api-status-heading" style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          API Status
        </h2>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 12px', borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem', fontWeight: 700,
          background: health ? 'var(--sev-minor-bg)' : 'var(--sev-extreme-bg)',
          color: health ? 'var(--sev-minor-text)' : 'var(--sev-extreme-text)',
          border: `1px solid ${health ? 'var(--sev-minor)' : 'var(--sev-extreme)'}`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: health ? 'var(--status-online)' : 'var(--status-offline)', flexShrink: 0 }} />
          {health ? `Online — ${API_BASE}` : 'Offline'}
        </span>
        {health && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            v{(health.version as string) ?? '?'}
          </span>
        )}
        {health && (
          <a
            href={`${API_BASE}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.78rem', color: 'var(--accent)', marginLeft: 'auto', minHeight: 'unset' }}
          >
            API Docs →
          </a>
        )}
      </section>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="ga-card"
          style={{
            marginBottom: 16, padding: '14px 18px',
            borderColor: 'var(--sev-extreme)',
            background: 'var(--sev-extreme-bg)',
            color: 'var(--sev-extreme-text)',
            fontSize: '0.88rem',
          }}
        >
          <strong>Could not load dashboard data</strong>
          <p style={{ marginTop: 6, opacity: 0.85 }}>
            {IS_PROD
              ? 'The backend may be starting up (Render free tier wakes after ~30s of inactivity). Try refreshing in a moment.'
              : `Run: cd backend && uvicorn app.main:app --reload`}
          </p>
        </div>
      )}

      {/* Alert count grid */}
      <section aria-labelledby="alerts-heading" style={{ marginBottom: 24 }}>
        <h2
          id="alerts-heading"
          style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}
        >
          Active Alerts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {ALERT_STAT_CONFIG.map(({ key, label, color }) => {
            const count = key === 'total'
              ? totalAlerts
              : (data?.alertCountsBySeverity[key] ?? 0);
            return (
              <div
                key={key}
                className="ga-card"
                style={{ padding: '16px 12px', textAlign: 'center' }}
              >
                <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {loading ? '—' : count}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5, textTransform: 'capitalize', fontWeight: 600 }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* System status */}
      {data && (
        <section aria-labelledby="system-heading" style={{ marginBottom: 24 }}>
          <h2
            id="system-heading"
            style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}
          >
            System
          </h2>
          <div className="ga-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: data.systemStatus === 'operational' ? 'var(--status-online)' : 'var(--status-warning)',
              boxShadow: data.systemStatus === 'operational' ? '0 0 0 3px rgba(22,163,74,.15)' : 'none',
            }} />
            <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.9rem' }}>
              {data.systemStatus}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {new Date(data.timestamp).toLocaleString()}
            </span>
          </div>
        </section>
      )}

      {/* Providers */}
      <section aria-labelledby="providers-heading">
        <h2
          id="providers-heading"
          style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}
        >
          Alert Providers {data && `(${data.providers.length})`}
        </h2>

        {loading ? (
          <div className="ga-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span className="ga-spinner" style={{ margin: '0 auto 8px', display: 'block', width: 24, height: 24, borderWidth: 3 }} />
            Loading providers...
          </div>
        ) : !data || data.providers.length === 0 ? (
          <div className="ga-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📡</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No providers configured</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Add alert sources to start ingesting real emergency data.
            </p>
            <a
              href={`${API_BASE}/api/docs#/sources/classify_source_api_sources_classify_post`}
              target="_blank"
              rel="noopener noreferrer"
              className="ga-btn ga-btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Add a source via API →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.providers.map(p => (
              <div
                key={p.source_id}
                className="ga-card"
                style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {p.classification === 'official' ? '✓ Official' : '○ Community'}
                    {' · '}
                    Last: {p.last_ingested_at ? new Date(p.last_ingested_at).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                  <span style={{ color: p.uptime_percentage >= 95 ? 'var(--status-online)' : p.uptime_percentage >= 80 ? 'var(--sev-moderate)' : 'var(--status-offline)' }}>
                    {p.uptime_percentage.toFixed(1)}% uptime
                  </span>
                  <span style={{ color: p.error_rate > 10 ? 'var(--status-offline)' : 'var(--text-muted)' }}>
                    {p.error_rate.toFixed(1)}% errors
                  </span>
                  <span style={{
                    padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700,
                    background: p.status === 'active' ? 'var(--sev-minor-bg)' : 'var(--sev-extreme-bg)',
                    color: p.status === 'active' ? 'var(--sev-minor-text)' : 'var(--sev-extreme-text)',
                  }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

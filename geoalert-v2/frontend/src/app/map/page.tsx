'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { AlertFeatureCollection, Alert, AlertsResponse, MinimalAlert, Severity } from '@/types';
import { calculateFreshness } from '@/types';
import { AlertDetailsPanel } from '@/components/AlertDetailsPanel';
import { saveOfflinePackage } from '@/lib/offline-db';
import { OfflineIndicator } from '@/components/OfflineIndicator';

const MapView = dynamic(() => import('@/components/MapView').then(m => m.MapView), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.9rem', gap: 10 }}>
      <span className="ga-spinner" /> Loading map...
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const EMPTY: AlertFeatureCollection = { type: 'FeatureCollection', features: [] };
const SEV_ORDER: Severity[] = ['extreme', 'severe', 'moderate', 'minor'];

function alertsToGeoJSON(alerts: Alert[]): AlertFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: alerts
      .filter(a => a.geometry && (a.geometry as { type?: string }).type)
      .map(a => ({
        type: 'Feature' as const,
        geometry: a.geometry,
        properties: {
          alertId: a.id,
          severity: a.severity,
          event: a.event,
          headline: a.headline,
          source: a.source?.classification ?? 'community',
          isStale: a.metadata?.isStale ?? false,
        },
      })),
  };
}

const SEV_DOT: Record<Severity, string> = {
  extreme: 'var(--sev-extreme)',
  severe:  'var(--sev-severe)',
  moderate:'var(--sev-moderate)',
  minor:   'var(--sev-minor)',
};

export default function MapPage() {
  const [geoAlerts, setGeoAlerts] = useState<AlertFeatureCollection>(EMPTY);
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [alertsById, setAlertsById] = useState<Map<string, Alert>>(new Map());
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [downloadingOffline, setDownloadingOffline] = useState(false);
  const [offlineDownloaded, setOfflineDownloaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch(`${API_BASE}/api/alerts?limit=200`, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data: AlertsResponse = await res.json();
        const map = new Map<string, Alert>();
        data.alerts.forEach(a => map.set(a.id as string, a));
        setAlertsById(map);
        setAllAlerts(data.alerts);
        setGeoAlerts(alertsToGeoJSON(data.alerts));
        setLastFetch(new Date());
        setFetchError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setFetchError(
          msg.includes('fetch') || msg.includes('Failed')
            ? 'Backend not running on port 8000'
            : `Error: ${msg}`
        );
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
    const iv = setInterval(loadAlerts, 2 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const filteredAlerts = severityFilter === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.severity === severityFilter);

  const countBySeverity = allAlerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {});

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedAlert(alertsById.get(id) ?? null);
  }, [alertsById]);

  const handleClose = useCallback(() => {
    setSelectedId(undefined);
    setSelectedAlert(null);
    triggerRef.current?.focus();
  }, []);

  const handleDownloadOfflinePackage = useCallback(async () => {
    setDownloadingOffline(true);
    try {
      const miniAlerts: MinimalAlert[] = Array.from(alertsById.values()).map(a => ({
        id: String(a.id), severity: a.severity, event: a.event, headline: a.headline,
        instruction: a.instruction || '', source: a.source?.classification ?? 'community',
        areas: a.areas || [], effective: a.effective as string, expires: a.expires as string,
        isStale: a.metadata?.isStale ?? false,
      }));
      await saveOfflinePackage(miniAlerts);
      setOfflineDownloaded(true);
      setTimeout(() => setOfflineDownloaded(false), 3000);
    } catch (err) {
      console.error('[GeoAlert] Offline save failed:', err);
    } finally {
      setDownloadingOffline(false);
    }
  }, [alertsById]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <aside
        role="complementary"
        aria-label="Alert list"
        style={{
          width: 320, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface-1)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar header */}
        <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Alerts
                {!loading && (
                  <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                    {allAlerts.length} total
                  </span>
                )}
              </h1>
              {lastFetch && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 1 }}>
                  Updated {lastFetch.toLocaleTimeString()}
                </div>
              )}
            </div>
            <button
              ref={triggerRef}
              onClick={handleDownloadOfflinePackage}
              disabled={downloadingOffline || loading}
              className="ga-btn ga-btn-ghost ga-btn-sm"
              aria-label="Save offline package"
              title="Download offline package"
            >
              {downloadingOffline ? <span className="ga-spinner" /> : offlineDownloaded ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              )}
            </button>
          </div>

          {/* Severity filter tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
            {(['all', ...SEV_ORDER] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`ga-filter-pill${severityFilter === sev ? ' active' : ''}`}
                aria-pressed={severityFilter === sev}
              >
                {sev !== 'all' && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: SEV_DOT[sev], flexShrink: 0, display: 'inline-block' }} />
                )}
                {sev === 'all' ? `All (${allAlerts.length})` : `${sev}${countBySeverity[sev] ? ` (${countBySeverity[sev]})` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {fetchError && (
          <div role="alert" style={{
            margin: '0 16px 10px', padding: '10px 12px',
            background: 'var(--sev-moderate-bg)', color: 'var(--sev-moderate-text)',
            borderRadius: 'var(--radius-sm)', fontSize: '0.78rem',
            border: '1px solid var(--sev-moderate)',
          }}>
            <strong>Live data unavailable</strong>
            <p style={{ marginTop: 3, opacity: 0.85 }}>
              {process.env.NODE_ENV === 'production'
                ? 'Backend may be waking up — try again in 30s.'
                : 'Run: uvicorn app.main:app --port 8000'}
            </p>
          </div>
        )}

        {/* Alert list */}
        <div
          role="list"
          aria-label="Alert list"
          style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span className="ga-spinner" /> Fetching alerts...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {allAlerts.length === 0 
                ? (fetchError ? 'No connection to backend' : 'No active alerts — database is empty') 
                : `No ${severityFilter} alerts`}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredAlerts.map(alert => {
                const isSelected = String(alert.id) === selectedId;
                const freshState = calculateFreshness(alert.effective as string);
                return (
                  <button
                    key={String(alert.id)}
                    role="listitem"
                    onClick={() => handleSelect(String(alert.id))}
                    className={`ga-alert-item sev-border-${alert.severity}${isSelected ? ' selected' : ''}`}
                    aria-pressed={isSelected}
                    style={{ marginTop: 2 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <span className={`ga-badge ga-badge-${alert.severity}`}>{alert.severity}</span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600,
                        color: freshState === 'fresh' ? 'var(--fresh-color)' : freshState === 'aging' ? 'var(--aging-color)' : 'var(--stale-color)',
                        background: freshState === 'fresh' ? 'var(--fresh-bg)' : freshState === 'aging' ? 'var(--aging-bg)' : 'var(--stale-bg)',
                        padding: '1px 6px', borderRadius: 'var(--radius-full)',
                      }}>
                        {freshState}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 5 }}>
                      {alert.event}
                    </div>
                    {alert.areas?.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {alert.areas.slice(0, 2).join(', ')}
                      </div>
                    )}
                    {alert.source && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: 4 }}>
                        {alert.source.classification === 'official' ? '✓ Official' : '○ Community'} · {alert.source.displayName}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapView
          alerts={geoAlerts}
          selectedAlertId={selectedId}
          onAlertSelect={handleSelect}
          offlineMode={false}
        />
      </div>

      {/* ── Alert details panel ── */}
      {selectedAlert && (
        <AlertDetailsPanel
          alert={selectedAlert}
          onClose={handleClose}
          offlineMode={false}
          triggerRef={triggerRef}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}

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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', background:'var(--bg)', flexDirection:'column', gap:12 }}>
      <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .6s linear infinite' }} />
      <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading map...</span>
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const EMPTY: AlertFeatureCollection = { type:'FeatureCollection', features:[] };
const SEV_ORDER: Severity[] = ['extreme','severe','moderate','minor'];

const SEV_LABEL: Record<Severity, string> = {
  extreme: 'Extreme', severe: 'Severe', moderate: 'Moderate', minor: 'Minor',
};
const SEV_DOT: Record<Severity, string> = {
  extreme: 'var(--sev-extreme)', severe: 'var(--sev-severe)',
  moderate: 'var(--sev-moderate)', minor: 'var(--sev-minor)',
};

function alertsToGeoJSON(alerts: Alert[]): AlertFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: alerts
      .filter(a => a.geometry && (a.geometry as { type?: string }).type)
      .map(a => ({
        type: 'Feature' as const,
        geometry: a.geometry,
        properties: { alertId: a.id, severity: a.severity, event: a.event, headline: a.headline, source: a.source?.classification ?? 'community', isStale: a.metadata?.isStale ?? false },
      })),
  };
}

function PinIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}

function ClockIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

function BellIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [offlineDownloaded, setOfflineDownloaded] = useState(false);
  const [downloadingOffline, setDownloadingOffline] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch(`${API_BASE}/api/alerts?limit=200`, { signal: AbortSignal.timeout(10000) });
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
            ? process.env.NODE_ENV === 'production'
              ? 'Service is starting up — try again in 30 seconds'
              : 'Backend offline — run: uvicorn app.main:app --port 8000'
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

  const filteredAlerts = (severityFilter === 'all' ? allAlerts : allAlerts.filter(a => a.severity === severityFilter))
    .filter(a => !searchQuery || a.event.toLowerCase().includes(searchQuery.toLowerCase()) || a.areas?.some(ar => ar.toLowerCase().includes(searchQuery.toLowerCase())));

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

  const handleDownload = useCallback(async () => {
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
    } catch (e) { console.error('[GeoAlert] Offline save failed:', e); }
    finally { setDownloadingOffline(false); }
  }, [alertsById]);

  const extremeCount = allAlerts.filter(a => a.severity === 'extreme').length;

  return (
    <div style={{ display:'flex', height:'calc(100vh - 58px)', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside role="complementary" aria-label="Alert list" style={{
        width:340, flexShrink:0, display:'flex', flexDirection:'column',
        background:'var(--surface-1)', borderRight:'1px solid var(--border)',
        overflow:'hidden',
      }}>

        {/* Sidebar header */}
        <div style={{ padding:'16px 16px 0', flexShrink:0 }}>

          {/* Alert status bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {extremeCount > 0 ? (
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    padding:'3px 10px', borderRadius:'var(--radius-full)',
                    background:'var(--sev-extreme-bg)', color:'var(--sev-extreme-text)',
                    border:'1px solid var(--sev-extreme)',
                    fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em',
                  }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--sev-extreme)', display:'inline-block', animation:'pulse-dot 1.5s ease infinite' }} />
                    {extremeCount} Critical
                  </span>
                ) : (
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    padding:'3px 10px', borderRadius:'var(--radius-full)',
                    background:'var(--sev-minor-bg)', color:'var(--sev-minor-text)',
                    border:'1px solid var(--sev-minor)',
                    fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
                  }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--sev-minor)', display:'inline-block' }} />
                    {loading ? 'Loading...' : allAlerts.length === 0 ? 'No active alerts' : `${allAlerts.length} alerts`}
                  </span>
                )}
              </div>
              {lastFetch && (
                <div style={{ fontSize:'0.68rem', color:'var(--text-subtle)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                  <ClockIcon />
                  Updated {lastFetch.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </div>
              )}
            </div>
            <button
              ref={triggerRef}
              onClick={handleDownload}
              disabled={downloadingOffline || loading || allAlerts.length === 0}
              className="ga-btn ga-btn-ghost ga-btn-sm"
              aria-label="Save alerts for offline use"
              title="Download offline package"
              style={{ padding:'0 10px' }}
            >
              {downloadingOffline ? <span className="ga-spinner" style={{ width:12, height:12 }} /> :
               offlineDownloaded ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
               ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               )}
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position:'relative', marginBottom:10 }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)', display:'flex', pointerEvents:'none' }}>
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              type="search"
              placeholder="Search alerts or areas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width:'100%', height:34,
                padding:'0 10px 0 32px',
                background:'var(--surface-2)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)', fontSize:'0.82rem',
                color:'var(--text-primary)', outline:'none',
                transition:'border-color var(--transition)',
                minHeight:'unset',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-subtle)', padding:2, display:'flex', alignItems:'center', minHeight:'unset', height:'auto' }}
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Severity filter pills */}
          <div style={{ display:'flex', gap:4, marginBottom:12, flexWrap:'wrap' }}>
            {(['all', ...SEV_ORDER] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`ga-filter-pill${severityFilter === sev ? ' active' : ''}`}
                aria-pressed={severityFilter === sev}
              >
                {sev !== 'all' && <span style={{ width:6, height:6, borderRadius:'50%', background:SEV_DOT[sev], display:'inline-block', flexShrink:0 }} />}
                {sev === 'all' ? 'All' : SEV_LABEL[sev]}
                {sev !== 'all' && countBySeverity[sev] ? (
                  <span style={{ fontSize:'0.65rem', opacity:.8 }}>({countBySeverity[sev]})</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'var(--border)', marginBottom:10, marginLeft:-16, marginRight:-16 }} />
        </div>

        {/* Error banner */}
        {fetchError && (
          <div role="alert" style={{ margin:'0 12px 10px', padding:'10px 12px', background:'var(--sev-moderate-bg)', color:'var(--sev-moderate-text)', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', border:'1px solid var(--sev-moderate)', lineHeight:1.5 }}>
            <strong style={{ display:'block', marginBottom:2 }}>Live data unavailable</strong>
            <span style={{ opacity:.85 }}>{fetchError}</span>
          </div>
        )}

        {/* Alert list */}
        <div role="list" aria-label="Alert list" style={{ flex:1, overflowY:'auto', padding:'0 12px 16px' }}>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'8px 0' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height:72, background:'var(--surface-2)', borderRadius:'var(--radius-md)', animation:'pulse-dot 1.5s ease infinite', opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 20px', textAlign:'center' }}>
              <div style={{ color:'var(--text-subtle)', marginBottom:16, opacity:.6 }}>
                <BellIcon />
              </div>
              <p style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:6, fontSize:'0.9rem' }}>
                {searchQuery ? 'No matching alerts' : allAlerts.length === 0 ? 'No active alerts' : `No ${severityFilter} alerts`}
              </p>
              <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.6, maxWidth:200 }}>
                {searchQuery
                  ? 'Try a different search term or clear the filter'
                  : allAlerts.length === 0
                  ? 'Alert data is pulled from official sources. Check back soon or try Crisis Mode.'
                  : `Switch to "All" to see ${allAlerts.length} other alert${allAlerts.length !== 1 ? 's' : ''}`}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="ga-btn ga-btn-ghost ga-btn-sm" style={{ marginTop:12 }}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {filteredAlerts.length > 0 && (
                <div style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--text-subtle)', textTransform:'uppercase', letterSpacing:'0.07em', padding:'6px 2px 4px' }}>
                  {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}{searchQuery ? ` matching "${searchQuery}"` : severityFilter !== 'all' ? ` · ${SEV_LABEL[severityFilter]}` : ''}
                </div>
              )}
              {filteredAlerts.map((alert, idx) => {
                const isSelected = String(alert.id) === selectedId;
                const freshState = calculateFreshness(alert.effective as string);
                const freshColor = freshState === 'fresh' ? 'var(--fresh-color)' : freshState === 'aging' ? 'var(--aging-color)' : 'var(--stale-color)';

                return (
                  <button
                    key={String(alert.id)}
                    role="listitem"
                    onClick={() => handleSelect(String(alert.id))}
                    className={`ga-alert-item sev-border-${alert.severity}${isSelected ? ' selected' : ''} animate-fade-in`}
                    aria-pressed={isSelected}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                      <span className={`ga-badge ga-badge-${alert.severity}`}>{alert.severity}</span>
                      <span style={{ fontSize:'0.68rem', fontWeight:600, color:freshColor, whiteSpace:'nowrap' }}>
                        {freshState}
                      </span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)', lineHeight:1.3, marginBottom:5 }}>
                      {alert.event}
                    </div>
                    {alert.areas && alert.areas.length > 0 && (
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.75rem', color:'var(--text-muted)' }}>
                        <PinIcon />
                        <span>{alert.areas.slice(0,2).join(', ')}</span>
                      </div>
                    )}
                    {alert.source && (
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.68rem', color:'var(--text-subtle)', marginTop:4 }}>
                        {alert.source.classification === 'official' ? (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--status-online)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <span>Official source</span>
                          </>
                        ) : (
                          <><span style={{ opacity:.6 }}>○</span><span>Community</span></>
                        )}
                        <span style={{ opacity:.4 }}>·</span>
                        <span>{alert.source.displayName}</span>
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
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <MapView alerts={geoAlerts} selectedAlertId={selectedId} onAlertSelect={handleSelect} offlineMode={false} />

        {/* Map overlay — keyboard hint */}
        <div style={{
          position:'absolute', bottom:16, right:16,
          background:'var(--surface-overlay)', backdropFilter:'blur(8px)',
          border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
          padding:'6px 10px', fontSize:'0.68rem', color:'var(--text-muted)',
          pointerEvents:'none',
          display:'flex', alignItems:'center', gap:6,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
          Tab to cycle alerts · Arrow keys to pan
        </div>
      </div>

      {selectedAlert && (
        <AlertDetailsPanel alert={selectedAlert} onClose={handleClose} offlineMode={false} triggerRef={triggerRef} />
      )}
      <OfflineIndicator />
    </div>
  );
}

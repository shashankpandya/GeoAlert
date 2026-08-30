'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AlertFeatureCollection, Alert, AlertsResponse, MinimalAlert } from '@/types';
import { AlertDetailsPanel } from '@/components/AlertDetailsPanel';
import { saveOfflinePackage } from '@/lib/offline-db';
import { OfflineIndicator } from '@/components/OfflineIndicator';

const MapView = dynamic(() => import('@/components/MapView').then(m => m.MapView), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0d1117', color: '#8b949e', fontSize: '0.9rem' }}>
      Loading map...
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const EMPTY: AlertFeatureCollection = { type: 'FeatureCollection', features: [] };

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

export default function MapPage() {
  const [geoAlerts, setGeoAlerts] = useState<AlertFeatureCollection>(EMPTY);
  const [alertsById, setAlertsById] = useState<Map<string, Alert>>(new Map());
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [downloadingOffline, setDownloadingOffline] = useState(false);
  const [offlineDownloaded, setOfflineDownloaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Fetch alerts on mount
  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch(`${API_BASE}/api/alerts?limit=200`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data: AlertsResponse = await res.json();
        const map = new Map<string, Alert>();
        data.alerts.forEach(a => map.set(a.id as string, a));
        setAlertsById(map);
        setGeoAlerts(alertsToGeoJSON(data.alerts));
        setFetchError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setFetchError(
          msg.includes('timeout') || msg.includes('fetch')
            ? 'Could not reach the backend. Is it running on port 8000?'
            : `Error: ${msg}`
        );
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
    // Refresh every 2 minutes
    const interval = setInterval(loadAlerts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
        id: String(a.id),
        severity: a.severity,
        event: a.event,
        headline: a.headline,
        instruction: a.instruction || '',
        source: a.source?.classification ?? 'community',
        areas: a.areas || [],
        effective: a.effective as string,
        expires: a.expires as string,
        isStale: a.metadata?.isStale ?? false,
      }));
      await saveOfflinePackage(miniAlerts);
      setOfflineDownloaded(true);
      setTimeout(() => setOfflineDownloaded(false), 3000);
    } catch (err) {
      console.error('[GeoAlert] Failed to save offline package:', err);
    } finally {
      setDownloadingOffline(false);
    }
  }, [alertsById]);

  const alertCount = geoAlerts.features.length;

  return (
    <main role="main" aria-label="Alert map view" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117' }}>
      {/* Header */}
      <header role="banner" style={{ background: '#161b22', color: '#e6edf3', padding: '10px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #30363d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.85rem' }} aria-label="Back to homepage">← Home</Link>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            GeoAlert Live Map
            {!loading && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#8b949e', marginLeft: '8px' }}>{alertCount} alert{alertCount !== 1 ? 's' : ''}</span>}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading && <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>Loading alerts...</span>}
          <button
            ref={triggerRef}
            onClick={handleDownloadOfflinePackage}
            disabled={downloadingOffline || loading}
            aria-label="Download offline package"
            style={{ background: offlineDownloaded ? '#15803d' : '#21262d', color: offlineDownloaded ? '#fff' : '#8b949e', border: '1px solid #30363d', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: downloadingOffline ? 'not-allowed' : 'pointer', opacity: downloadingOffline ? 0.7 : 1, minHeight: '36px' }}
          >
            {downloadingOffline ? 'Saving...' : offlineDownloaded ? '✓ Saved offline' : '⬇ Save offline'}
          </button>
        </div>
      </header>

      {/* Error banner */}
      {fetchError && (
        <div role="alert" style={{ background: '#450a0a', color: '#fca5a5', padding: '10px 20px', fontSize: '0.85rem', borderBottom: '1px solid #7f1d1d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠ {fetchError}</span>
          <span style={{ color: '#f87171', fontSize: '0.75rem' }}>Map shows no live data — backend connection required</span>
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView
          alerts={geoAlerts}
          selectedAlertId={selectedId}
          onAlertSelect={handleSelect}
          offlineMode={!isOnline}
        />
        {loading && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#161b22', color: '#8b949e', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #30363d', pointerEvents: 'none' }}>
            Fetching alerts...
          </div>
        )}
      </div>

      {selectedAlert && (
        <AlertDetailsPanel
          alert={selectedAlert}
          onClose={handleClose}
          offlineMode={!isOnline}
          triggerRef={triggerRef}
        />
      )}

      <OfflineIndicator />
    </main>
  );
}

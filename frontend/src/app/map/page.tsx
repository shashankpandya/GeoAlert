'use client';

import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AlertFeatureCollection, Alert } from '@/types';
import { AlertDetailsPanel } from '@/components/AlertDetailsPanel';
import { saveOfflinePackage } from '@/lib/offline-db';
import { OfflineIndicator } from '@/components/OfflineIndicator';

const MapView = dynamic(() => import('@/components/MapView').then(m => m.MapView), {
  ssr: false,
  loading: () => <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',background:'#f3f4f6' }}>Loading map...</div>,
});

const EMPTY: AlertFeatureCollection = { type: 'FeatureCollection', features: [] };

export default function MapPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alerts] = useState<AlertFeatureCollection>(EMPTY);
  const [isOnline] = useState(true);
  const [downloadingOffline, setDownloadingOffline] = useState(false);
  const [offlineDownloaded, setOfflineDownloaded] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    // In production: fetch full alert from /api/alerts/{id}
    // For now set a placeholder so panel renders
    setSelectedAlert(null);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(undefined);
    setSelectedAlert(null);
  }, []);

  const handleDownloadOfflinePackage = useCallback(async () => {
    setDownloadingOffline(true);
    try {
      // In production: fetch /api/alerts and convert to MinimalAlert[]
      // For now save the current empty alert set as the offline package
      await saveOfflinePackage([]);
      setOfflineDownloaded(true);
      setTimeout(() => setOfflineDownloaded(false), 3000);
    } catch (err) {
      console.error('[GeoAlert] Failed to save offline package:', err);
    } finally {
      setDownloadingOffline(false);
    }
  }, []);

  return (
    <main role='main' aria-label='Alert map view'
          style={{ display:'flex',flexDirection:'column',height:'100vh' }}>
      <header role='banner' style={{ background:'#1e3a5f',color:'#fff',padding:'12px 20px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px' }}>
        <h1 style={{ fontSize:'1.25rem',fontWeight:700 }}>GeoAlert - Live Map</h1>
        <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
          {!isOnline && <p role='status' style={{ fontSize:'0.8rem',color:'#fbbf24',margin:0 }}>Offline - cached data</p>}
          <button
            onClick={handleDownloadOfflinePackage}
            disabled={downloadingOffline}
            aria-label="Download offline package"
            style={{
              background: offlineDownloaded ? '#15803d' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: downloadingOffline ? 'not-allowed' : 'pointer',
              opacity: downloadingOffline ? 0.7 : 1,
              transition: 'background 0.2s',
            }}
          >
            {downloadingOffline ? 'Downloading…' : offlineDownloaded ? '✓ Saved offline' : '⬇ Download Offline Package'}
          </button>
        </div>
      </header>
      <div style={{ flex:1,position:'relative' }}>
        <MapView
          alerts={alerts}
          selectedAlertId={selectedId}
          onAlertSelect={handleSelect}
          offlineMode={!isOnline}
        />
      </div>
      {selectedAlert && (
        <AlertDetailsPanel
          alert={selectedAlert}
          onClose={handleClose}
          offlineMode={!isOnline}
          triggerRef={triggerRef}
        />
      )}
      {/* ARIA live region for global announcements */}
      <div id='alert-announcer' aria-live='polite' aria-atomic='false'
           style={{ position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)' }} />
      <OfflineIndicator />
    </main>
  );
}

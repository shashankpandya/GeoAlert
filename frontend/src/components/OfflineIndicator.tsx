'use client';

import React, { useEffect, useState } from 'react';
import { processSyncQueue } from '@/lib/offline-db';

interface OfflineIndicatorProps {
  lastSyncTime?: string | null;
  staleAlertCount?: number;
}

export function useOnlineStatus(): boolean {
  // Always start as true (matches server render), then sync after mount
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Sync actual value after hydration
    setIsOnline(navigator.onLine);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

export function OfflineIndicator({ lastSyncTime, staleAlertCount = 0 }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [justRestored, setJustRestored] = useState(false);
  // Track previous value to detect online restoration
  const [prevOnline, setPrevOnline] = useState(true);

  useEffect(() => {
    if (isOnline && !prevOnline) {
      // Just came back online
      setJustRestored(true);
      setSyncing(true);
      processSyncQueue().finally(() => {
        setSyncing(false);
        setTimeout(() => setJustRestored(false), 3000);
      });
    }
    setPrevOnline(isOnline);
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide when online and not showing restoration toast
  if (isOnline && !justRestored) return null;

  const bgColor = isOnline ? '#15803d' : '#b45309';
  const message = isOnline
    ? syncing ? 'Connection restored — syncing...' : 'Back online!'
    : `Offline${
        lastSyncTime ? ` — cached data from ${new Date(lastSyncTime).toLocaleTimeString()}` : ''
      }${
        staleAlertCount > 0 ? ` (${staleAlertCount} stale alerts)` : ''
      }`;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        background: bgColor, color: '#fff', padding: '10px 20px', borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,.2)', fontSize: '0.9rem', fontWeight: 600,
        zIndex: 1000, maxWidth: '90vw', textAlign: 'center',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}
    >
      <span aria-hidden="true">{isOnline ? '✓' : '⚠'}</span>
      {message}
    </div>
  );
}

export default OfflineIndicator;

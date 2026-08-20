'use client';

import React, { useEffect, useState } from 'react';
import { processSyncQueue } from '@/lib/offline-db';

interface OfflineIndicatorProps {
  lastSyncTime?: string | null;
  staleAlertCount?: number;
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);
  return isOnline;
}

export function OfflineIndicator({ lastSyncTime, staleAlertCount = 0 }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    if (isOnline && !syncing) {
      setSyncing(true);
      setJustRestored(true);
      processSyncQueue().finally(() => {
        setSyncing(false);
        setTimeout(() => setJustRestored(false), 3000);
      });
    }
  }, [isOnline]); // eslint-disable-line

  if (isOnline && !justRestored) return null;

  const bgColor = isOnline ? '#15803d' : '#b45309';
  const message = isOnline
    ? syncing ? 'Connection restored — syncing...' : 'Back online!'
    : `Offline${lastSyncTime ? ` — cached data from ${new Date(lastSyncTime).toLocaleTimeString()}` : ''}${staleAlertCount > 0 ? ` (${staleAlertCount} stale alerts)` : ''}`;

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

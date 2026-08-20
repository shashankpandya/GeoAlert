'use client';

import type { MinimalAlert } from '@/types';

const DB_NAME = 'geoalert-offline';
const DB_VERSION = 1;
const SCHEMA_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('alerts')) {
        db.createObjectStore('alerts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(db: IDBDatabase, storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineAlerts(): Promise<MinimalAlert[]> {
  const db = await openDB();
  return tx<MinimalAlert[]>(db, 'alerts', 'readonly', (s) => s.getAll());
}

export async function putOfflineAlert(alert: MinimalAlert): Promise<void> {
  const db = await openDB();
  await tx(db, 'alerts', 'readwrite', (s) => s.put({ ...alert, cachedAt: Date.now() }));
}

export async function clearOfflineAlerts(): Promise<void> {
  const db = await openDB();
  await tx(db, 'alerts', 'readwrite', (s) => s.clear());
}

export async function getSetting(key: string): Promise<unknown> {
  const db = await openDB();
  return tx(db, 'settings', 'readonly', (s) => s.get(key));
}

export async function putSetting(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  await tx(db, 'settings', 'readwrite', (s) => s.put({ key, value, updatedAt: Date.now() }));
}

export async function queueSync(type: string, payload: unknown): Promise<void> {
  const db = await openDB();
  await tx(db, 'syncQueue', 'readwrite', (s) =>
    s.add({ type, payload, createdAt: Date.now(), retryCount: 0 })
  );
}

export async function processSyncQueue(): Promise<void> {
  const db = await openDB();
  const items = await tx<Array<{ id: number; type: string; payload: unknown }>>(
    db, 'syncQueue', 'readonly', (s) => s.getAll()
  );
  for (const item of items) {
    try {
      if (item.type === 'fetch-alerts') {
        await fetch('/api/alerts');
      }
      await tx(db, 'syncQueue', 'readwrite', (s) => s.delete(item.id));
    } catch {
      // Leave in queue for next retry
    }
  }
}

export async function saveOfflinePackage(alerts: MinimalAlert[]): Promise<void> {
  const pkg = {
    schemaVersion: SCHEMA_VERSION,
    alerts,
    downloadedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  await putSetting('offline_package', pkg);
}

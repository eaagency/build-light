import localforage from 'localforage';
import { Weather } from '@prisma/client';

/**
 * Offline Daily Log Storage
 * Manages offline daily log creation and syncing using IndexedDB
 */

// Configure localforage
const offlineStore = localforage.createInstance({
  name: 'buildlight-daily-logs',
  storeName: 'pending_logs',
  description: 'Stores daily logs created while offline',
});

export interface OfflineDailyLog {
  id: string; // Temporary ID
  projectId: string;
  date: string; // ISO string
  weather: Weather;
  activities: string;
  crewNotes?: string;
  photos: string[];
  assignedToId: string;
  createdAt: string; // ISO string
  syncStatus: 'pending' | 'syncing' | 'failed';
  syncError?: string;
}

/**
 * Save a daily log for offline creation
 */
export async function saveOfflineLog(
  log: Omit<OfflineDailyLog, 'id' | 'createdAt' | 'syncStatus'>
): Promise<OfflineDailyLog> {
  const offlineLog: OfflineDailyLog = {
    ...log,
    id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };

  await offlineStore.setItem(offlineLog.id, offlineLog);
  return offlineLog;
}

/**
 * Get all pending offline logs
 */
export async function getPendingLogs(): Promise<OfflineDailyLog[]> {
  const logs: OfflineDailyLog[] = [];

  await offlineStore.iterate<OfflineDailyLog, void>((value) => {
    if (value.syncStatus === 'pending' || value.syncStatus === 'failed') {
      logs.push(value);
    }
  });

  // Sort by creation date
  return logs.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Update sync status of an offline log
 */
export async function updateLogSyncStatus(
  id: string,
  status: 'pending' | 'syncing' | 'failed',
  error?: string
): Promise<void> {
  const log = await offlineStore.getItem<OfflineDailyLog>(id);

  if (log) {
    log.syncStatus = status;
    if (error) {
      log.syncError = error;
    }
    await offlineStore.setItem(id, log);
  }
}

/**
 * Remove an offline log after successful sync
 */
export async function removeOfflineLog(id: string): Promise<void> {
  await offlineStore.removeItem(id);
}

/**
 * Get count of pending logs
 */
export async function getPendingLogCount(): Promise<number> {
  const logs = await getPendingLogs();
  return logs.length;
}

/**
 * Clear all offline logs (use with caution)
 */
export async function clearAllOfflineLogs(): Promise<void> {
  await offlineStore.clear();
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Add online/offline event listeners
 */
export function addOnlineListener(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('online', callback);

  return () => {
    window.removeEventListener('online', callback);
  };
}

export function addOfflineListener(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('offline', callback);
  };
}

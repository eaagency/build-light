'use client';

import { useState, useEffect } from 'react';
import {
  getPendingLogs,
  updateLogSyncStatus,
  removeOfflineLog,
  addOnlineListener,
  addOfflineListener,
  isOnline,
  type OfflineDailyLog,
} from './offline-storage';
import { createDailyLog } from '../api/daily-logs';
import { show } from '../toast';

/**
 * useOfflineSync Hook
 * Manages syncing of offline daily logs when connection is restored
 */
export function useOfflineSync(projectId: string, onSyncComplete?: () => void) {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update pending count
  const updatePendingCount = async () => {
    const logs = await getPendingLogs();
    setPendingCount(logs.length);
  };

  // Sync a single log
  const syncLog = async (log: OfflineDailyLog): Promise<boolean> => {
    try {
      await updateLogSyncStatus(log.id, 'syncing');

      await createDailyLog(projectId, {
        date: new Date(log.date),
        weather: log.weather,
        activities: log.activities,
        crewNotes: log.crewNotes,
        photos: log.photos,
        assignedToId: log.assignedToId,
      });

      // Remove from offline storage after successful sync
      await removeOfflineLog(log.id);
      return true;
    } catch (error: any) {
      console.error('Failed to sync log:', error);

      // Update status to failed
      await updateLogSyncStatus(log.id, 'failed', error.message);
      return false;
    }
  };

  // Sync all pending logs
  const syncPendingLogs = async () => {
    if (!isOnline() || isSyncing) return;

    setIsSyncing(true);

    try {
      const pendingLogs = await getPendingLogs();

      if (pendingLogs.length === 0) {
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const log of pendingLogs) {
        const success = await syncLog(log);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Update pending count
      await updatePendingCount();

      // Show result
      if (successCount > 0) {
        show(
          `${successCount} log${successCount > 1 ? 's' : ''} synced successfully`,
          { icon: '✅' }
        );
        onSyncComplete?.();
      }

      if (failCount > 0) {
        show(`${failCount} log${failCount > 1 ? 's' : ''} failed to sync`, {
          icon: '⚠️',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      show('Failed to sync logs', { icon: '❌' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle online status changes
  useEffect(() => {
    // Initial state
    setIsOffline(!isOnline());
    updatePendingCount();

    // Listen for online event
    const removeOnlineListener = addOnlineListener(() => {
      setIsOffline(false);
      show('Back online', { icon: '🌐' });
      syncPendingLogs();
    });

    // Listen for offline event
    const removeOfflineListener = addOfflineListener(() => {
      setIsOffline(true);
      show('You are offline. Logs will sync when back online.', { icon: '📵' });
    });

    return () => {
      removeOnlineListener();
      removeOfflineListener();
    };
  }, [projectId]);

  return {
    isOffline,
    pendingCount,
    isSyncing,
    syncPendingLogs,
    updatePendingCount,
  };
}

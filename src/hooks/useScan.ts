// Eliza Security Agent - useScan Hook
// Manage scan state and GitHub API interactions

import { useState, useCallback } from 'react';
import { fetchGitHubRepo } from '../lib/github';
import { SCAN_LOGS } from '../lib/constants';
import type { Repository } from '../data/mockRepoData';

// Scan states
export const SCAN_STATE = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Custom hook for managing scan state
 * @returns {Object} - Scan state and functions
 */
export function useScan() {
  const [scanState, setScanState] = useState(SCAN_STATE.IDLE);
  const [repoData, setRepoData] = useState<Repository | null>(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({
    fetch: 0,
    analyze: 0,
    threats: 0,
    profile: 0,
  });

  /**
   * Start scanning a repository
   * @param {string} url - Repository URL
   */
  const startScan = useCallback(async (url) => {
    setScanState(SCAN_STATE.SCANNING);
    setError('');
    setLogs([]);
    setProgress({ fetch: 0, analyze: 0, threats: 0, profile: 0 });

    // Animate logs
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < SCAN_LOGS.length) {
        setLogs(prev => [...prev, SCAN_LOGS[logIndex++]]);
      } else {
        clearInterval(logInterval);
      }
    }, 220);

    const progressTimers = [
      setTimeout(() => setProgress(prev => ({ ...prev, fetch: 35 })), 250),
      setTimeout(() => setProgress(prev => ({ ...prev, fetch: 100, analyze: 45 })), 900),
      setTimeout(() => setProgress(prev => ({ ...prev, analyze: 100, threats: 55 })), 1700),
      setTimeout(() => setProgress(prev => ({ ...prev, threats: 100, profile: 65 })), 2500),
    ];

    try {
      const result = await fetchGitHubRepo(url);
      setRepoData(result);
      setProgress({ fetch: 100, analyze: 100, threats: 100, profile: 100 });
      setScanState(SCAN_STATE.SUCCESS);
      clearInterval(logInterval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed.');
      setScanState(SCAN_STATE.ERROR);
      setProgress({ fetch: 100, analyze: 100, threats: 100, profile: 100 });
      clearInterval(logInterval);
    } finally {
      progressTimers.forEach(timer => clearTimeout(timer));
    }
  }, []);

  /**
   * Reset scan state
   */
  const resetScan = useCallback(() => {
    setScanState(SCAN_STATE.IDLE);
    setRepoData(null);
    setError('');
    setLogs([]);
    setProgress({ fetch: 0, analyze: 0, threats: 0, profile: 0 });
  }, []);

  return {
    scanState,
    repoData,
    error,
    logs,
    progress,
    startScan,
    resetScan,
    isScanning: scanState === SCAN_STATE.SCANNING,
    hasResult: scanState === SCAN_STATE.SUCCESS && repoData !== null,
  };
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

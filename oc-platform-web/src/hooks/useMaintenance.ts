import { useState, useEffect, useCallback } from 'react';
import request from '@/utils/request';

interface MaintenanceStatus {
  enabled: boolean;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  estimatedTime: string | null;
}

const MAINTENANCE_CACHE_KEY = 'maintenance_status';
const MAINTENANCE_CACHE_TTL = 60000;

let cachedStatus: { data: MaintenanceStatus; timestamp: number } | null = null;

export function useMaintenance() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);

  const checkMaintenance = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      if (!forceRefresh && cachedStatus && now - cachedStatus.timestamp < MAINTENANCE_CACHE_TTL) {
        setStatus(cachedStatus.data);
        setIsMaintenance(cachedStatus.data.enabled);
        setLoading(false);
        return cachedStatus.data.enabled;
      }

      const response = await request.get('/api/v1/public/system/maintenance');
      const data = response.data.data as MaintenanceStatus;
      
      cachedStatus = { data, timestamp: now };
      localStorage.setItem(MAINTENANCE_CACHE_KEY, JSON.stringify(cachedStatus));
      
      setStatus(data);
      setIsMaintenance(data.enabled);
      setLoading(false);
      
      return data.enabled;
    } catch {
      setIsMaintenance(false);
      setLoading(false);
      return false;
    }
  }, []);

  const clearCache = useCallback(() => {
    cachedStatus = null;
    localStorage.removeItem(MAINTENANCE_CACHE_KEY);
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(MAINTENANCE_CACHE_KEY);
    if (cached) {
      try {
        cachedStatus = JSON.parse(cached);
      } catch {
        cachedStatus = null;
      }
    }
    
    checkMaintenance();
  }, [checkMaintenance]);

  return {
    isMaintenance,
    loading,
    status,
    checkMaintenance,
    clearCache,
  };
}

export function useMaintenanceRedirect() {
  const { isMaintenance, loading } = useMaintenance();

  useEffect(() => {
    if (!loading && isMaintenance) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/maintenance' && !currentPath.startsWith('/admin') && currentPath !== '/login') {
        window.location.href = '/maintenance';
      }
    }
  }, [isMaintenance, loading]);

  return { isMaintenance, loading };
}

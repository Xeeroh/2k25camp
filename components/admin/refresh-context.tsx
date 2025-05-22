"use client";

import { createContext, useContext, useState, useCallback } from 'react';

interface RefreshContextType {
  refreshAll: () => Promise<void>;
  isRefreshing: boolean;
  registerRefreshCallback: (callback: () => Promise<void>) => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCallbacks, setRefreshCallbacks] = useState<(() => Promise<void>)[]>([]);

  const registerRefreshCallback = useCallback((callback: () => Promise<void>) => {
    setRefreshCallbacks(prev => [...prev, callback]);
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await Promise.all(refreshCallbacks.map(callback => callback()));
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCallbacks]);

  return (
    <RefreshContext.Provider value={{ refreshAll, isRefreshing, registerRefreshCallback }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh debe ser usado dentro de un RefreshProvider');
  }
  return context;
} 
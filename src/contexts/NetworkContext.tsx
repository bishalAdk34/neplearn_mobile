import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { networkManager } from '../services/network';

interface NetworkContextValue {
  isConnected: boolean;
  isOffline: boolean;
  isInitialized: boolean;
}

export const NetworkContext = createContext<NetworkContextValue>({
  isConnected: true,
  isOffline: false,
  isInitialized: false,
});

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInitialized, setIsInitialized] = useState(networkManager.isInitialized);

  useEffect(() => {
    setIsConnected(networkManager.getIsConnected());
    setIsInitialized(networkManager.isInitialized);

    const unsubscribe = networkManager.addListener((connected) => {
      setIsConnected(connected);
    });

    const unsubInit = networkManager.onInitialized(() => {
      setIsInitialized(true);
      setIsConnected(networkManager.getIsConnected());
    });

    return () => {
      unsubscribe();
      unsubInit();
    };
  }, []);

  const value: NetworkContextValue = {
    isConnected,
    isOffline: isInitialized ? !isConnected : false,
    isInitialized,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

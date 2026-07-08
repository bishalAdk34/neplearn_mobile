import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { networkManager } from '../services/network';

interface NetworkContextValue {
  isConnected: boolean;
  isOffline: boolean;
}

export const NetworkContext = createContext<NetworkContextValue>({
  isConnected: true,
  isOffline: false,
});

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsConnected(networkManager.getIsConnected());

    // Listen for changes
    const unsubscribe = networkManager.addListener((connected) => {
      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  const value: NetworkContextValue = {
    isConnected,
    isOffline: !isConnected,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

import { useContext } from 'react';
import { NetworkContext } from '../contexts/NetworkContext';

export function useNetworkState() {
  return useContext(NetworkContext);
}

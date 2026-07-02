import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

type NetworkListener = (isConnected: boolean) => void;

class NetworkManager {
  private isConnected: boolean = true;
  private listeners: Set<NetworkListener> = new Set();
  private subscription: NetInfoSubscription | null = null;

  async init(): Promise<void> {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? true;

    this.subscription = NetInfo.addEventListener(this.handleNetworkChange);
  }

  private handleNetworkChange = (state: NetInfoState): void => {
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected ?? false;

    if (wasConnected !== this.isConnected) {
      this.notifyListeners();
    }
  };

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isConnected);
      } catch (e) {
        console.error('Network listener error:', e);
      }
    });
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners.clear();
  }
}

export const networkManager = new NetworkManager();

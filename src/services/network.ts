type NetworkListener = (isConnected: boolean) => void;

function getNativeNetwork(): {
  getNetworkStateAsync: () => Promise<{ isConnected: boolean | null }>;
  addNetworkStateListener: (l: (s: { isConnected: boolean | null }) => void) => { remove: () => void };
} | null {
  try {
    return require('expo-network');
  } catch {
    return null;
  }
}

class NetworkManager {
  private isConnected: boolean = true;
  private listeners: Set<NetworkListener> = new Set();
  private cleanup: (() => void) | null = null;

  async init(): Promise<void> {
    const native = getNativeNetwork();
    if (native) {
      try {
        const state = await native.getNetworkStateAsync();
        this.isConnected = state.isConnected ?? true;
        const sub = native.addNetworkStateListener((s) => {
          this.setConnected(s.isConnected ?? false);
        });
        this.cleanup = () => sub.remove();
        return;
      } catch {
      }
    }

    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      this.isConnected = navigator.onLine;
      const onLine = () => this.setConnected(true);
      const offLine = () => this.setConnected(false);
      window.addEventListener('online', onLine);
      window.addEventListener('offline', offLine);
      this.cleanup = () => {
        window.removeEventListener('online', onLine);
        window.removeEventListener('offline', offLine);
      };
      return;
    }
  }

  private setConnected(connected: boolean): void {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      this.notifyListeners();
    }
  }

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
    this.cleanup?.();
    this.listeners.clear();
  }
}

export const networkManager = new NetworkManager();

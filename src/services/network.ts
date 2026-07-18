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

async function verifyWithFetch(): Promise<boolean> {
  try {
    const res = await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch {
    try {
      const res = await fetch('https://httpbin.org/status/204', { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

class NetworkManager {
  private isConnected: boolean = true;
  private _isInitialized: boolean = false;
  private listeners: Set<NetworkListener> = new Set();
  private initListeners: Set<() => void> = new Set();
  private cleanup: (() => void) | null = null;

  async init(): Promise<void> {
    const native = getNativeNetwork();
    if (native) {
      try {
        const state = await native.getNetworkStateAsync();
        let connected = state.isConnected ?? true;
        if (!connected) {
          connected = await verifyWithFetch();
        }
        this.isConnected = connected;
        const sub = native.addNetworkStateListener((s) => {
          const next = s.isConnected ?? false;
          if (next) {
            this.setConnected(true);
          } else {
            verifyWithFetch().then((verified) => {
              this.setConnected(verified);
            });
          }
        });
        this.cleanup = () => sub.remove();
        this.setInitialized();
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
      this.setInitialized();
      return;
    }

    this.setInitialized();
  }

  private setInitialized(): void {
    this._isInitialized = true;
    this.initListeners.forEach((cb) => {
      try { cb(); } catch {}
    });
    this.initListeners.clear();
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  onInitialized(cb: () => void): () => void {
    if (this._isInitialized) {
      cb();
      return () => {};
    }
    this.initListeners.add(cb);
    return () => this.initListeners.delete(cb);
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

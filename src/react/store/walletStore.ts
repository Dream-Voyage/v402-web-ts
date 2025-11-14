/**
 * Wallet Store (External Store)
 *
 * Lightweight state management without Context Provider
 * Uses singleton pattern + event emitter for reactivity
 */

import {NetworkType} from '../../types';
import {
    connectWallet as connectWalletUtil,
    disconnectWallet as disconnectWalletUtil,
    getConnectedNetworkType,
    getCurrentWallet,
    isWalletManuallyDisconnected,
    onAccountsChanged,
} from '../../utils';

type Listener = () => void;

interface WalletState {
  address: string | null;
  networkType: NetworkType | null;
  isConnecting: boolean;
  error: string | null;
}

class WalletStore {
  private state: WalletState = {
    address: null,
    networkType: null,
    isConnecting: false,
    error: null,
  };

  private listeners = new Set<Listener>();
  private initialized = false;

  // Initialize store (call once)
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Auto-reconnect on init
    this.autoReconnect();

    // Listen for account changes (EVM only)
    onAccountsChanged((accounts) => {
      const connectedType = getConnectedNetworkType();
      if (connectedType === NetworkType.EVM) {
        if (accounts.length === 0) {
          this.setState({address: null});
          console.log('🔌 Wallet disconnected');
        } else {
          if (!isWalletManuallyDisconnected()) {
            this.setState({address: accounts[0]});
            console.log('🔄 Account changed:', accounts[0]);
          }
        }
      }
    });
  }

  private async autoReconnect() {
    if (!isWalletManuallyDisconnected()) {
      const connectedType = getConnectedNetworkType();
      if (connectedType) {
        const currentAddress = await getCurrentWallet(connectedType);
        if (currentAddress) {
          this.setState({
            address: currentAddress,
            networkType: connectedType,
          });
          console.log('🔄 Auto-reconnected wallet:', currentAddress);
        }
      }
    }
  }

  // Get current state
  getState(): WalletState {
    return this.state;
  }

  // Update state and notify listeners
  private setState(partial: Partial<WalletState>) {
    this.state = {...this.state, ...partial};
    this.notifyListeners();
  }

  // Subscribe to state changes
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Connect wallet
  async connect(type: NetworkType): Promise<void> {
    this.setState({isConnecting: true, error: null});

    try {
      const walletAddress = await connectWalletUtil(type);

      console.log('✅ Wallet connected:', walletAddress, 'Network:', type);

      this.setState({
        address: walletAddress,
        networkType: type,
        isConnecting: false,
      });

      console.log('📝 Store state updated');
    } catch (err: any) {
      this.setState({
        error: err.message || 'Failed to connect wallet',
        isConnecting: false,
      });
      throw err;
    }
  }

  // Disconnect wallet
  disconnect(): void {
    disconnectWalletUtil();
    this.setState({
      address: null,
      networkType: null,
      error: null,
    });
    console.log('🔌 Wallet disconnected from store');
  }

  // Clear error
  clearError(): void {
    this.setState({error: null});
  }
}

// Singleton instance
export const walletStore = new WalletStore();

// Initialize on import (browser only)
if (typeof window !== 'undefined') {
  walletStore.init();
}


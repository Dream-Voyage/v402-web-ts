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
    onChainChanged,
    onWalletDisconnect,
    saveWalletAddress,
    switchNetwork as switchNetworkUtil,
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
      const currentStateNetwork = this.state.networkType;

      // 只有当前激活的网络是EVM时才处理账户变化
      if (connectedType === NetworkType.EVM && currentStateNetwork === NetworkType.EVM) {
        if (accounts.length === 0) {
          this.setState({address: null});
          console.log('🔌 Wallet disconnected');
        } else {
          if (!isWalletManuallyDisconnected(NetworkType.EVM)) {
            // 更新当前地址和缓存
            this.setState({address: accounts[0]});
            saveWalletAddress(NetworkType.EVM, accounts[0]);
            console.log('🔄 Account changed:', accounts[0]);
          }
        }
      }
    });

    // Listen for network/chain changes (EVM only)
    onChainChanged(() => {
      const connectedType = getConnectedNetworkType();
      const currentStateNetwork = this.state.networkType;

      // 只有当前激活的网络是EVM时才处理链变化
      // 这表示用户在钱包中切换了链（比如从以太坊切换到BSC）
      if (connectedType === NetworkType.EVM && currentStateNetwork === NetworkType.EVM) {
        console.log('⚠️ EVM chain changed detected - disconnecting wallet');
        // 清除EVM网络的缓存
        disconnectWalletUtil(NetworkType.EVM, false);
        this.setState({
          address: null,
          networkType: null,
          error: 'Network changed. Please reconnect your wallet.',
        });
      }
    });

    // Listen for wallet disconnect (Solana only)
    onWalletDisconnect(() => {
      const connectedType = getConnectedNetworkType();
      const currentStateNetwork = this.state.networkType;

      // 只有当前激活的网络是Solana时才处理断开
      if ((connectedType === NetworkType.SOLANA || connectedType === NetworkType.SVM) &&
          (currentStateNetwork === NetworkType.SOLANA || currentStateNetwork === NetworkType.SVM)) {
        console.log('⚠️ Solana wallet disconnected');
        // 清除Solana网络的缓存
        disconnectWalletUtil(connectedType, false);
        this.setState({
          address: null,
          networkType: null,
        });
      }
    });
  }

  private async autoReconnect() {
    const connectedType = getConnectedNetworkType();
    if (connectedType && !isWalletManuallyDisconnected(connectedType)) {
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

  // Get current state
  getState(): WalletState {
    return this.state;
  }

  // Update state and notify listeners
  private setState(partial: Partial<WalletState>) {
    const oldState = {...this.state};
    this.state = {...this.state, ...partial};

    // Log state changes that clear address
    if (oldState.address && !this.state.address) {
      console.log('⚠️ setState clearing address:', {
        oldAddress: oldState.address,
        oldNetwork: oldState.networkType,
        newNetwork: this.state.networkType,
        partial,
        stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n')
      });
    }

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
    console.log('🔵 connect() called:', {
      targetNetwork: type,
      currentNetwork: this.state.networkType,
      currentAddress: this.state.address,
      stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n')
    });

    // 先保存当前网络的地址到缓存（如果有的话）
    if (this.state.address && this.state.networkType && this.state.networkType !== type) {
      saveWalletAddress(this.state.networkType, this.state.address);
      console.log('💾 Saved previous wallet to cache:', this.state.networkType, this.state.address);
    }

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

  // Switch network (use cached wallet if available)
  async switchNetwork(type: NetworkType): Promise<void> {
    console.log('🔷 switchNetwork() called:', {
      targetNetwork: type,
      currentNetwork: this.state.networkType,
      currentAddress: this.state.address,
      stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n')
    });

    // 先保存当前网络的地址到缓存（如果有的话）
    if (this.state.address && this.state.networkType) {
      saveWalletAddress(this.state.networkType, this.state.address);
      console.log('💾 Saved current wallet to cache:', this.state.networkType, this.state.address);
    }

    this.setState({isConnecting: true, error: null});

    try {
      // Try to switch using cached address
      const address = await switchNetworkUtil(type);

      if (address) {
        // Successfully switched using cached wallet
        console.log('✅ Switched to network:', type, 'Address:', address);
        this.setState({
          address,
          networkType: type,
          isConnecting: false,
        });
      } else {
        // No cached wallet or validation failed, need to connect
        console.log('⚠️ No cached wallet found for', type, ', connecting...');
        // 先更新 networkType，避免事件监听器误判
        // 清除 address 但保留 networkType 为目标网络
        this.setState({
          address: null,
          networkType: type,  // 设置为目标网络，避免事件监听器干扰
          isConnecting: true,
        });
        // 连接新钱包
        await this.connect(type);
      }
    } catch (err: any) {
      this.setState({
        error: err.message || 'Failed to switch network',
        isConnecting: false,
      });
      throw err;
    }
  }

  // Disconnect wallet
  disconnect(clearCache: boolean = true): void {
    const currentNetwork = this.state.networkType;

    console.log('🔴 disconnect() called:', {
      currentNetwork,
      currentAddress: this.state.address,
      clearCache,
      stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n')
    });

    if (currentNetwork) {
      if (clearCache) {
        // 断开并清除当前网络的缓存
        disconnectWalletUtil(currentNetwork, false);
      }
      // 标记该网络为手动断开
      const { markWalletDisconnected } = require('../../utils/wallet');
      markWalletDisconnected(currentNetwork);
    }

    this.setState({
      address: null,
      networkType: null,
      error: null,
    });
    console.log('🔌 Wallet disconnected from store:', currentNetwork);
  }

  // Clear error
  clearError(): void {
    this.setState({error: null});
  }

  // Ensure network matches expected type (for page-specific network requirements)
  async ensureNetwork(expectedNetwork: NetworkType): Promise<void> {
    console.log('🎯 ensureNetwork() called:', {
      expectedNetwork,
      currentNetwork: this.state.networkType,
      currentAddress: this.state.address,
    });

    // 如果当前网络已经匹配，直接返回
    if (this.state.networkType === expectedNetwork && this.state.address) {
      console.log('✅ Network already matches, no action needed');
      return;
    }

    // 如果当前网络不匹配，尝试切换
    if (this.state.networkType !== expectedNetwork) {
      console.log('🔄 Network mismatch, switching to:', expectedNetwork);
      await this.switchNetwork(expectedNetwork);
    } else if (!this.state.address) {
      // 网络匹配但没有地址，需要连接
      console.log('⚠️ Network matches but no address, connecting...');
      await this.connect(expectedNetwork);
    }
  }
}

// Singleton instance
export const walletStore = new WalletStore();

// Initialize on import (browser only)
if (typeof window !== 'undefined') {
  walletStore.init();
}


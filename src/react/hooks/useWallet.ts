/**
 * useWallet Hook
 *
 * React hook for wallet connection management
 */

import {useCallback, useEffect, useState} from 'react';
import {NetworkType} from '../../types';
import {
    connectWallet as connectWalletUtil,
    disconnectWallet as disconnectWalletUtil,
    getConnectedNetworkType,
    getCurrentWallet,
    isWalletManuallyDisconnected,
    onAccountsChanged,
} from '../../utils';

export interface UseWalletReturn {
  // State
  address: string | null;
  networkType: NetworkType | null;
  isConnecting: boolean;
  error: string | null;

  // Actions
  connect: (networkType: NetworkType) => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

/**
 * Hook for managing wallet connection
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { address, connect, disconnect, isConnecting } = useWallet();
 *
 *   return (
 *     <div>
 *       {address ? (
 *         <button onClick={disconnect}>Disconnect {address}</button>
 *       ) : (
 *         <button onClick={() => connect(NetworkType.SOLANA)}>
 *           Connect Wallet
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [networkType, setNetworkType] = useState<NetworkType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet on mount
  useEffect(() => {
    const initWallet = async () => {
      if (!isWalletManuallyDisconnected()) {
        const connectedType = getConnectedNetworkType();
        if (connectedType) {
          const currentAddress = await getCurrentWallet(connectedType);
          if (currentAddress) {
            setAddress(currentAddress);
            setNetworkType(connectedType);
            console.log('🔄 Auto-reconnected wallet:', currentAddress);
          }
        }
      }
    };

    initWallet();

    // Listen for account changes (EVM only)
    const unsubscribe = onAccountsChanged((accounts) => {
      const connectedType = getConnectedNetworkType();
      if (connectedType === NetworkType.EVM) {
        if (accounts.length === 0) {
          setAddress(null);
          console.log('🔌 Wallet disconnected');
        } else {
          if (!isWalletManuallyDisconnected()) {
            setAddress(accounts[0]);
            console.log('🔄 Account changed:', accounts[0]);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // Only run on mount

  // Connect wallet
  const connect = useCallback(async (type: NetworkType) => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletAddress = await connectWalletUtil(type);

      console.log('✅ Wallet connected:', walletAddress, 'Network:', type);

      // Update state - this should trigger re-render
      setAddress(walletAddress);
      setNetworkType(type);

      // Force a small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 0));

      console.log('📝 State updated in hook');
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    disconnectWalletUtil();
    setAddress(null);
    setNetworkType(null);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    address,
    networkType,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError,
  };
}


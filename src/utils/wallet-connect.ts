/**
 * Wallet connection utilities for demo/UI
 * Higher-level helpers built on top of base wallet utilities
 */

import {NetworkType} from "../types";
import {
    clearWalletDisconnection,
    getConnectedNetworkType as getStoredNetworkType,
    isWalletManuallyDisconnected as checkManualDisconnect,
    markWalletDisconnected,
    saveConnectedNetworkType
} from "./wallet";

/**
 * Connect wallet and return address
 */
export async function connectWallet(networkType: NetworkType): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('请在浏览器环境中使用');
  }

  let address: string;

  switch (networkType) {
    case NetworkType.EVM: {
      if (!(window as any).ethereum) {
        throw new Error('请安装 MetaMask 或其他以太坊钱包');
      }
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
        params: [],
      });
      if (!accounts || accounts.length === 0) {
        throw new Error('未能获取到钱包地址');
      }
      address = accounts[0];
      break;
    }

    case NetworkType.SOLANA:
    case NetworkType.SVM: {
      const solana = (window as any).solana;
      if (!solana) {
        throw new Error('请安装 Phantom 或其他 Solana 钱包');
      }
      const response = await solana.connect();
      address = response.publicKey.toString();
      break;
    }

    default:
      throw new Error('不支持的网络类型');
  }

  // Save connection state
  clearWalletDisconnection();
  saveConnectedNetworkType(networkType);

  return address;
}

/**
 * Disconnect wallet
 */
export function disconnectWallet(): void {
  markWalletDisconnected();
}

/**
 * Get current wallet address
 */
export async function getCurrentWallet(networkType?: NetworkType): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const type = networkType || getStoredNetworkType();
  if (!type) {
    return null;
  }

  try {
    switch (type) {
      case NetworkType.EVM: {
        if (!(window as any).ethereum) return null;
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts',
          params: [],
        });
        return accounts && accounts.length > 0 ? accounts[0] : null;
      }

      case NetworkType.SOLANA:
      case NetworkType.SVM: {
        const solana = (window as any).solana;
        if (!solana || !solana.isConnected) return null;
        return solana.publicKey?.toString() || null;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Failed to get current wallet:', error);
    return null;
  }
}

/**
 * Listen for account changes (EVM only)
 */
export function onAccountsChanged(
    callback: (accounts: string[]) => void
): () => void {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return () => {
    };
  }

  const ethereum = (window as any).ethereum;
  const handler = (accounts: string[]) => {
    callback(accounts);
  };

  ethereum.on('accountsChanged', handler);

  return () => {
    ethereum.removeListener?.('accountsChanged', handler);
  };
}

/**
 * Re-export for convenience
 */
export {getStoredNetworkType as getConnectedNetworkType};
export {checkManualDisconnect as isWalletManuallyDisconnected};


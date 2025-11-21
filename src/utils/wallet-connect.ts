/**
 * Wallet connection utilities for demo/UI
 * Higher-level helpers built on top of base wallet utilities
 */

import {NetworkType} from "../types";
import {
  clearWalletDisconnection,
  getCachedWalletAddress,
  getConnectedNetworkType as getStoredNetworkType,
  isWalletManuallyDisconnected as checkManualDisconnect,
  markWalletDisconnected,
  removeWalletAddress,
  saveConnectedNetworkType,
  saveWalletAddress
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
  clearWalletDisconnection(networkType); // 清除该网络的断开标记
  saveConnectedNetworkType(networkType);
  // 缓存钱包地址，支持多网络切换
  saveWalletAddress(networkType, address);

  return address;
}

/**
 * Disconnect wallet
 * @param networkType - 可选，指定要断开的网络类型。如果不指定，则断开当前网络
 * @param clearAll - 是否清除所有网络的缓存，默认为 false
 */
export function disconnectWallet(networkType?: NetworkType, clearAll: boolean = false): void {
  if (clearAll) {
    // 清除所有网络的钱包缓存
    const { clearAllWalletAddresses } = require('./wallet');
    clearAllWalletAddresses();
    markWalletDisconnected();
  } else if (networkType) {
    // 只清除指定网络的缓存
    removeWalletAddress(networkType);
    // 不调用 markWalletDisconnected()，避免影响其他网络
  } else {
    // 清除当前连接的网络缓存
    const currentNetwork = getStoredNetworkType();
    if (currentNetwork) {
      removeWalletAddress(currentNetwork);
    }
    // 不调用 markWalletDisconnected()，避免影响其他网络
  }
}

/**
 * Get current wallet address
 * 优先从缓存读取，如果缓存存在则验证其有效性
 */
export async function getCurrentWallet(networkType?: NetworkType): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const type = networkType || getStoredNetworkType();
  if (!type) {
    return null;
  }

  // 先尝试从缓存读取
  const cachedAddress = getCachedWalletAddress(type);
  
  try {
    let currentAddress: string | null = null;
    
    switch (type) {
      case NetworkType.EVM: {
        if (!(window as any).ethereum) return cachedAddress;
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts',
          params: [],
        });
        currentAddress = accounts && accounts.length > 0 ? accounts[0] : null;
        break;
      }

      case NetworkType.SOLANA:
      case NetworkType.SVM: {
        const solana = (window as any).solana;
        if (!solana || !solana.isConnected) return cachedAddress;
        currentAddress = solana.publicKey?.toString() || null;
        break;
      }

      default:
        return cachedAddress;
    }

    // 如果钱包返回的地址与缓存不一致，更新缓存
    if (currentAddress && currentAddress !== cachedAddress) {
      saveWalletAddress(type, currentAddress);
    }
    
    // 如果钱包没有返回地址但有缓存，返回缓存（钱包可能暂时未连接但用户没有断开）
    return currentAddress || cachedAddress;
  } catch (error) {
    console.error('Failed to get current wallet:', error);
    // 如果出错，返回缓存的地址
    return cachedAddress;
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
 * Listen for chain/network changes (EVM only)
 */
export function onChainChanged(
    callback: (chainId: string) => void
): () => void {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return () => {
    };
  }

  const ethereum = (window as any).ethereum;
  const handler = (chainId: string) => {
    console.log('🔄 Chain changed to:', chainId);
    callback(chainId);
  };

  ethereum.on('chainChanged', handler);

  return () => {
    ethereum.removeListener?.('chainChanged', handler);
  };
}

/**
 * Listen for wallet disconnect (Solana only)
 */
export function onWalletDisconnect(
    callback: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {
    };
  }

  const solana = (window as any).solana;
  if (!solana) {
    return () => {
    };
  }

  const handler = () => {
    console.log('🔌 Solana wallet disconnected');
    callback();
  };

  solana.on('disconnect', handler);

  return () => {
    solana.removeListener?.('disconnect', handler);
  };
}

/**
 * 切换到指定网络
 * 如果该网络已有缓存的钱包地址，则直接切换
 * 如果没有缓存，则需要连接钱包
 */
export async function switchNetwork(networkType: NetworkType): Promise<string | null> {
  const cachedAddress = getCachedWalletAddress(networkType);
  
  if (cachedAddress) {
    // 如果有缓存地址，直接切换网络类型
    saveConnectedNetworkType(networkType);
    clearWalletDisconnection(networkType); // 清除该网络的断开标记
    
    // 验证钱包是否仍然连接
    const currentAddress = await getCurrentWallet(networkType);
    if (currentAddress) {
      return currentAddress;
    }
  }
  
  // 如果没有缓存或验证失败，返回 null 表示需要重新连接
  return null;
}

/**
 * Re-export for convenience
 */
export {getStoredNetworkType as getConnectedNetworkType};
export {checkManualDisconnect as isWalletManuallyDisconnected};
export {getCachedWalletAddress, saveWalletAddress, removeWalletAddress};
export {getAllWalletAddresses} from './wallet';


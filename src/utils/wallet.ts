/**
 * Wallet utilities
 *
 * Generic wallet connection and management utilities
 * Framework-agnostic and chain-agnostic
 */

import {NetworkType} from "../types";

const WALLET_DISCONNECTED_KEY = 'wallet_manually_disconnected';
const CONNECTED_NETWORK_TYPE_KEY = 'connected_network_type';

/**
 * Check if a wallet is installed for a specific network type
 */
export function isWalletInstalled(networkType: NetworkType): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  switch (networkType) {
    case NetworkType.EVM:
      return !!(window as any).ethereum;

    case NetworkType.SOLANA:
    case NetworkType.SVM:
      return !!(window as any).solana || !!(window as any).phantom;

    default:
      return false;
  }
}

/**
 * Get wallet provider for a network type
 */
export function getWalletProvider(networkType: NetworkType): any {
  if (typeof window === 'undefined') {
    return null;
  }

  switch (networkType) {
    case NetworkType.EVM:
      return (window as any).ethereum;

    case NetworkType.SOLANA:
    case NetworkType.SVM:
      return (window as any).solana || (window as any).phantom;

    default:
      return null;
  }
}

/**
 * Format wallet address for display (show first 6 and last 4 characters)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Mark wallet as manually disconnected
 */
export function markWalletDisconnected(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');
    localStorage.removeItem(CONNECTED_NETWORK_TYPE_KEY);
  }
}

/**
 * Clear wallet disconnection flag
 */
export function clearWalletDisconnection(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(WALLET_DISCONNECTED_KEY);
  }
}

/**
 * Check if user manually disconnected wallet
 */
export function isWalletManuallyDisconnected(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true';
}

/**
 * Save connected network type
 */
export function saveConnectedNetworkType(networkType: NetworkType): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONNECTED_NETWORK_TYPE_KEY, networkType);
  }
}

/**
 * Get saved network type
 */
export function getConnectedNetworkType(): NetworkType | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const type = localStorage.getItem(CONNECTED_NETWORK_TYPE_KEY);
  return type as NetworkType || null;
}

/**
 * Get wallet install URL
 */
export function getWalletInstallUrl(networkType: NetworkType): string {
  switch (networkType) {
    case NetworkType.EVM:
      return 'https://metamask.io/download/';
    case NetworkType.SOLANA:
    case NetworkType.SVM:
      return 'https://phantom.app/download';
    default:
      return '#';
  }
}

/**
 * Get wallet display name
 */
export function getWalletDisplayName(networkType: NetworkType): string {
  switch (networkType) {
    case NetworkType.EVM:
      return 'MetaMask';
    case NetworkType.SOLANA:
    case NetworkType.SVM:
      return 'Phantom';
    default:
      return 'Unknown Wallet';
  }
}

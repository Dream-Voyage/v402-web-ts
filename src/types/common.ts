/**
 * Common types for x402 SDK
 * Framework-agnostic types that work across different wallet implementations
 */

import {VersionedTransaction} from "@solana/web3.js";

/**
 * Generic wallet adapter interface - works with any wallet provider
 * Compatible with Anza wallet-adapter, Privy, and custom implementations
 */
export interface WalletAdapter {
    // Anza wallet-adapter standard
    publicKey?: { toString(): string };

    // Alternative property (e.g., Privy or custom wallets)
    address?: string;

    // Transaction signing - required for payment authorization
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
}

/**
 * EVM wallet adapter interface
 */
export interface EvmWalletAdapter {
    address: string;
    signTypedData: (
        domain: any,
        types: any,
        message: any
    ) => Promise<string>;
    switchChain?: (chainId: string) => Promise<void>;
}

/**
 * Network type enum - for wallet detection
 */
export enum NetworkType {
    EVM = 'evm',
    SOLANA = 'solana',
    SVM = 'svm', // Alias for Solana
    UNKNOWN = 'unknown'
}

export const PROD_BACK_URL = "https://v402.onvoyage.ai/api";
export const DEV_BACK_URL = "http://localhost:3000/api";


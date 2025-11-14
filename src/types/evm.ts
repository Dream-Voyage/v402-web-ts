/**
 * EVM specific types
 * Uses x402 official types as base
 */

import {z} from "zod";
import {type ExactEvmPayload, ExactEvmPayloadSchema, type PaymentRequirements,} from "x402/types";
import type {EvmWalletAdapter} from "./common";

// Re-export x402 EVM types
export type {ExactEvmPayload, PaymentRequirements};
export {ExactEvmPayloadSchema};

/**
 * EVM network enum (common networks)
 */
export const EvmNetworkSchema = z.enum([
  "ethereum",
  "sepolia",
  "base",
  "base-sepolia",
  "polygon",
  "arbitrum",
  "optimism",
]);

export type EvmNetwork = z.infer<typeof EvmNetworkSchema>;

/**
 * EVM payment payload schema (conforms to x402 spec)
 */
export const EvmPaymentPayloadSchema = z.object({
  x402Version: z.literal(1),
  scheme: z.literal("exact"),
  network: EvmNetworkSchema,
  payload: ExactEvmPayloadSchema,
});

export type EvmPaymentPayload = z.infer<typeof EvmPaymentPayloadSchema>;

/**
 * Configuration for EVM payment client
 */
export interface EvmClientConfig {
  wallet: EvmWalletAdapter;
  network: EvmNetwork;
  maxPaymentAmount?: bigint; // Maximum amount willing to pay (in atomic units)
}

/**
 * Configuration for creating EVM payment header
 */
export interface CreateEvmPaymentHeaderParams {
  wallet: EvmWalletAdapter;
  paymentRequirements: PaymentRequirements;
  x402Version: number;
  chainId: number;
}

/**
 * Network configuration for EVM chains
 */
export interface EvmNetworkConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Common EVM network configurations
 */
export const EVM_NETWORK_CONFIGS: Record<string, EvmNetworkConfig> = {
  "ethereum": {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    rpcUrls: ["https://eth.llamarpc.com"],
    nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
  },
  "sepolia": {
    chainId: "0xaa36a7",
    chainName: "Sepolia",
    rpcUrls: ["https://sepolia.infura.io/v3/"],
    nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
  },
  "base": {
    chainId: "0x2105",
    chainName: "Base",
    rpcUrls: ["https://mainnet.base.org"],
    nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
  },
  "base-sepolia": {
    chainId: "0x14a34",
    chainName: "Base Sepolia",
    rpcUrls: ["https://sepolia.base.org"],
    nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
  },
};

/**
 * Get chain ID from network name
 */
export function getChainId(network: string): number {
  const chainIdMap: Record<string, number> = {
    'ethereum': 1,
    'sepolia': 11155111,
    'base': 8453,
    'base-sepolia': 84532,
    'polygon': 137,
    'arbitrum': 42161,
    'optimism': 10,
  };
  return chainIdMap[network.toLowerCase()] || 1;
}


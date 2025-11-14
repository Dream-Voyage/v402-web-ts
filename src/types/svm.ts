/**
 * SVM (Solana) specific types
 * Uses x402 official types as base
 */

import {z} from "zod";
import {type ExactSvmPayload, ExactSvmPayloadSchema, type PaymentRequirements,} from "x402/types";
import type {WalletAdapter} from "./common";

// Re-export x402 SVM types
export type {ExactSvmPayload, PaymentRequirements};
export {ExactSvmPayloadSchema};

/**
 * Solana network enum
 */
export const SolanaNetworkSchema = z.enum([
  "solana-devnet",
  "solana",
  "solana-mainnet", // Alias for mainnet
]);

export type SolanaNetwork = z.infer<typeof SolanaNetworkSchema>;

/**
 * Solana payment payload schema (conforms to x402 spec)
 */
export const SolanaPaymentPayloadSchema = z.object({
  x402Version: z.literal(1),
  scheme: z.literal("exact"),
  network: SolanaNetworkSchema,
  payload: ExactSvmPayloadSchema,
});

export type SolanaPaymentPayload = z.infer<typeof SolanaPaymentPayloadSchema>;

/**
 * Configuration for Solana payment client
 */
export interface SvmClientConfig {
  wallet: WalletAdapter;
  network: SolanaNetwork;
  rpcUrl?: string;
  maxPaymentAmount?: bigint; // Maximum amount willing to pay (in atomic units)
}

/**
 * Configuration for creating Solana payment header
 */
export interface CreateSvmPaymentHeaderParams {
  wallet: WalletAdapter;
  paymentRequirements: PaymentRequirements;
  x402Version: number;
  rpcUrl: string;
}


/**
 * SVM (Solana) Payment Service
 *
 * Exports both high-level and low-level APIs for Solana payments
 */

// Low-level API: Build payment header yourself
export {
  createSvmPaymentHeader,
  getDefaultSolanaRpcUrl,
} from "./payment-header";

// High-level API: Automatic payment handling
export {
  handleSvmPayment,
  createSvmPaymentFetch,
} from "./payment-handler";


/**
 * x402 Payment Services
 *
 * This module provides payment handling for both SVM (Solana) and EVM chains.
 *
 * ## Usage Patterns
 *
 * ### Pattern 1: High-level API (Recommended for most users)
 * Use `handleSvmPayment` or `handleEvmPayment` for automatic payment flow
 *
 * ### Pattern 2: Low-level API (Advanced users)
 * Use `createSvmPaymentHeader` or `createEvmPaymentHeader` to build headers
 * Then handle fetch requests yourself (useful for custom fetch implementations)
 */

// ============================================
// SVM (Solana) exports
// ============================================
export {
  // High-level API
  handleSvmPayment,
  createSvmPaymentFetch,

  // Low-level API
  createSvmPaymentHeader,
  getDefaultSolanaRpcUrl,
} from "./svm";

// ============================================
// EVM exports
// ============================================
export {
  // High-level API
  handleEvmPayment,
  createEvmPaymentFetch,

  // Low-level API
  createEvmPaymentHeader,
  getChainIdFromNetwork,
} from "./evm";

// ============================================
// Legacy exports (for backward compatibility)
// ============================================
export {
  createSvmPaymentHeader as createSolanaPaymentHeader,
} from "./svm";

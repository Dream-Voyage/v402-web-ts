/**
 * EVM Payment Service
 *
 * Exports both high-level and low-level APIs for EVM payments
 */

// Low-level API: Build payment header yourself
export {
    createEvmPaymentHeader,
    getChainIdFromNetwork,
} from "./payment-header";

// High-level API: Automatic payment handling
export {
    handleEvmPayment,
    createEvmPaymentFetch,
} from "./payment-handler";


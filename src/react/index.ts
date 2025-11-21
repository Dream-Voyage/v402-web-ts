/**
 * x402 Payment SDK - React Package
 *
 * Pre-built React hooks and components for easy integration
 *
 * ## Quick Start
 *
 * ```tsx
 * import { WalletConnect, PaymentButton, useWallet, usePayment } from '@x402/sdk/react';
 *
 * // No Provider needed! Just use the hooks directly
 * function App() {
 *   const { address } = useWallet();
 *
 *   return (
 *     <div>
 *       <WalletConnect />
 *       {address && <PaymentButton endpoint="/api/protected" />}
 *     </div>
 *   );
 * }
 * ```
 */

// Hooks (No Provider needed!)
export { useWallet } from './hooks/useWalletStore';
export type { UseWalletReturn } from './hooks/useWalletStore';

// Hooks
export { usePayment } from './hooks/usePayment';
export type { UsePaymentReturn } from './hooks/usePayment';

export { usePaymentInfo } from './hooks/usePaymentInfo';
export type { UsePaymentInfoReturn } from './hooks/usePaymentInfo';

// Components
export { WalletConnect } from './components/WalletConnect';
export type { WalletConnectProps } from './components/WalletConnect';

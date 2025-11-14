/**
 * WalletConnect Component
 *
 * Pre-built wallet connection UI component
 */

'use client';

import React from 'react';
import {NetworkType} from '../../types';
import {formatAddress, getNetworkDisplayName, getWalletInstallUrl, isWalletInstalled,} from '../../utils';
import {useWallet} from '../hooks/useWalletStore';

export interface WalletConnectProps {
  supportedNetworks?: NetworkType[];
  className?: string;
  onConnect?: (address: string, networkType: NetworkType) => void;
  onDisconnect?: () => void;
}

/**
 * Pre-built wallet connection component
 *
 * @example
 * ```tsx
 * import { WalletConnect } from '../react';
 *
 * function App() {
 *   return (
 *     <WalletConnect
 *       supportedNetworks={[NetworkType.SOLANA, NetworkType.EVM]}
 *       onConnect={(address, network) => console.log('Connected:', address)}
 *     />
 *   );
 * }
 * ```
 */
export function WalletConnect({
                                supportedNetworks = [NetworkType.SOLANA, NetworkType.EVM],
                                className = '',
                                onConnect,
                                onDisconnect,
                              }: WalletConnectProps) {
  const {address, networkType, isConnecting, error, connect, disconnect} = useWallet();

  const handleConnect = async (network: NetworkType) => {
    try {
      await connect(network);
      // Note: address state won't be updated yet due to async setState
      // The parent component will re-render when address updates
    } catch (err) {
      // Error is already set in hook
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  return (
      <div className={`x402-wallet-connect ${className}`}>
        {!address ? (
            <div className="x402-wallet-section">
              <h3 className="x402-section-title">Choose Your Wallet</h3>

              {supportedNetworks.length === 0 ? (
                  <p className="x402-hint">No payment required</p>
              ) : (
                  <div className="x402-wallet-buttons">
                    {supportedNetworks.map((network) => {
                      const installed = isWalletInstalled(network);
                      return (
                          <div key={network} className="x402-wallet-option">
                            <button
                                className="x402-connect-button"
                                onClick={() => handleConnect(network)}
                                disabled={isConnecting || !installed}
                            >
                              {isConnecting ? 'Connecting...' : getNetworkDisplayName(network)}
                            </button>
                            {!installed && (
                                <a
                                    href={getWalletInstallUrl(network)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="x402-install-link"
                                >
                                  Install Wallet
                                </a>
                            )}
                          </div>
                      );
                    })}
                  </div>
              )}

              {error && <p className="x402-error">{error}</p>}

              <p className="x402-hint">
                To switch accounts, please change it in your wallet extension
              </p>
            </div>
        ) : (
            <div className="x402-wallet-info">
              <div className="x402-wallet-address">
            <span className="x402-wallet-label">
              Connected {networkType && `(${getNetworkDisplayName(networkType)})`}:
            </span>
                <span className="x402-address">{formatAddress(address)}</span>
              </div>
              <div className="x402-wallet-actions">
                <button className="x402-disconnect-button" onClick={handleDisconnect}>
                  Disconnect
                </button>
              </div>
              <p className="x402-hint">
                Switch account in your wallet to change address
              </p>
            </div>
        )}
      </div>
  );
}


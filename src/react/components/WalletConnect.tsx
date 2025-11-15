/**
 * WalletConnect Component
 *
 * Pre-built wallet connection UI component with inline styles
 */

'use client';

import React, {useState} from 'react';
import {NetworkType} from '../../types';
import {formatAddress, getNetworkDisplayName, getWalletInstallUrl, isWalletInstalled,} from '../../utils';
import {useWallet} from '../hooks/useWalletStore';
import {
    buttonsContainerStyle,
    containerStyle,
    getAddressStyle,
    getConnectButtonStyle,
    getDisconnectButtonStyle,
    getErrorStyle,
    getHintStyle,
    getInstallLinkStyle,
    getLabelStyle,
    getSectionStyle,
    getTitleStyle,
    walletActionsStyle,
    walletAddressStyle,
    walletOptionStyle,
} from '../styles/inline-styles';

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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

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
      <div style={{ ...containerStyle, ...(className ? {} : {}) }} className={className}>
        {!address ? (
            <div style={getSectionStyle()}>
              <h3 style={getTitleStyle()}>Connect Wallet</h3>

              {supportedNetworks.length === 0 ? (
                  <p style={getHintStyle()}>No payment required</p>
              ) : (
                  <div style={buttonsContainerStyle}>
                    {supportedNetworks.map((network) => {
                      const installed = isWalletInstalled(network);
                      return (
                          <div key={network} style={walletOptionStyle}>
                            <button
                                style={getConnectButtonStyle(isConnecting || !installed, hoveredButton === network)}
                                onClick={() => handleConnect(network)}
                                disabled={isConnecting || !installed}
                                onMouseEnter={() => setHoveredButton(network)}
                                onMouseLeave={() => setHoveredButton(null)}
                            >
                              {isConnecting ? 'Connecting...' : getNetworkDisplayName(network)}
                            </button>
                            {!installed && (
                                <a
                                    href={getWalletInstallUrl(network)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={getInstallLinkStyle(hoveredLink === network)}
                                    onMouseEnter={() => setHoveredLink(network)}
                                    onMouseLeave={() => setHoveredLink(null)}
                                >
                                  Install Wallet
                                </a>
                            )}
                          </div>
                      );
                    })}
                  </div>
              )}

              {error && <p style={getErrorStyle()}>{error}</p>}

              <p style={getHintStyle()}>
                To switch accounts, please change it in your wallet extension
              </p>
            </div>
        ) : (
            <div style={getSectionStyle()}>
              <div style={walletAddressStyle}>
            <span style={getLabelStyle()}>
              Connected {networkType && `(${getNetworkDisplayName(networkType)})`}
            </span>
                <span style={getAddressStyle()}>{formatAddress(address)}</span>
              </div>
              <div style={walletActionsStyle}>
                <button
                    style={getDisconnectButtonStyle(hoveredButton === 'disconnect')}
                    onClick={handleDisconnect}
                    onMouseEnter={() => setHoveredButton('disconnect')}
                    onMouseLeave={() => setHoveredButton(null)}
                >
                  Disconnect
                </button>
              </div>
              <p style={getHintStyle()}>
                Switch account in your wallet to change address
              </p>
            </div>
        )}
      </div>
  );
}


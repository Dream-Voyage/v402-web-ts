/**
 * usePageNetwork Hook
 *
 * 页面级网络管理 Hook
 * 自动确保当前页面连接到正确的网络
 */

import {useEffect} from 'react';
import {NetworkType} from '../../types';
import {useWallet} from './useWalletStore';

export interface UsePageNetworkOptions {
  /** 是否自动切换网络（默认 true） */
  autoSwitch?: boolean;
  /** 是否在组件挂载时立即切换（默认 true） */
  switchOnMount?: boolean;
}

/**
 * 页面级网络管理 Hook
 * 
 * 用于确保页面始终连接到期望的网络
 * 自动处理网络切换，保持其他网络的缓存不受影响
 * 
 * @param expectedNetwork - 页面期望的网络类型
 * @param options - 配置选项
 * 
 * @example
 * ```tsx
 * // A 页面 - 期望 EVM 网络
 * function PageA() {
 *   const { address, isConnecting } = usePageNetwork(NetworkType.EVM);
 *   
 *   return (
 *     <div>
 *       {isConnecting ? '切换中...' : `EVM 地址: ${address}`}
 *     </div>
 *   );
 * }
 * 
 * // B 页面 - 期望 Solana 网络
 * function PageB() {
 *   const { address, isConnecting } = usePageNetwork(NetworkType.SOLANA);
 *   
 *   return (
 *     <div>
 *       {isConnecting ? '切换中...' : `Solana 地址: ${address}`}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // 禁用自动切换，手动控制
 * function PageC() {
 *   const wallet = usePageNetwork(NetworkType.EVM, { autoSwitch: false });
 *   
 *   return (
 *     <div>
 *       {wallet.networkType !== NetworkType.EVM && (
 *         <button onClick={() => wallet.ensureNetwork(NetworkType.EVM)}>
 *           切换到 EVM
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePageNetwork(
  expectedNetwork: NetworkType,
  options: UsePageNetworkOptions = {}
) {
  const {
    autoSwitch = true,
    switchOnMount = true,
  } = options;

  const wallet = useWallet();

  useEffect(() => {
    if (autoSwitch && switchOnMount) {
      // 只在当前网络与期望不匹配时才切换
      if (wallet.networkType !== expectedNetwork) {
        console.log('🎯 usePageNetwork: Auto-switching to', expectedNetwork);
        wallet.ensureNetwork(expectedNetwork).catch(err => {
          console.error('Failed to ensure network:', err);
        });
      }
    }
  }, [expectedNetwork, autoSwitch, switchOnMount]);

  return wallet;
}


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
 * @param expectedNetwork - 页面期望的网络类型（NetworkType，如 EVM、SVM）
 * @param options - 配置选项
 * 
 * @example
 * ```tsx
 * // EVM 页面
 * function EvmPage() {
 *   const { address, isConnecting } = usePageNetwork(NetworkType.EVM);
 *   return <div>{isConnecting ? 'Connecting...' : address}</div>;
 * }
 * 
 * // SVM 页面
 * function SvmPage() {
 *   const { address, isConnecting } = usePageNetwork(NetworkType.SVM);
 *   return <div>{isConnecting ? 'Connecting...' : address}</div>;
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
    if (!autoSwitch || !switchOnMount) return;
    
    // ensureNetwork 内部会检查是否手动断开，如果是则不会重连
    wallet.ensureNetwork(expectedNetwork).catch(err => {
      console.error('Failed to ensure network:', err);
    });
    // 只在 expectedNetwork 改变时执行，避免无限循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedNetwork]);

  return wallet;
}


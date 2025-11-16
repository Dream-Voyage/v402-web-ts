/**
 * Inline styles for x402 React Components
 *
 * Modern, minimal, and flat design without gradients or fancy borders.
 * All styles are defined as JavaScript objects to ensure they're always bundled
 * with the components. This eliminates the need for users to import CSS files.
 */

import {CSSProperties} from 'react';

// 检测是否支持暗色模式
export const isDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

// 现代简约配色 - 扁平化设计
const colors = {
  // Light mode
  light: {
    background: '#fafafa',
    cardBg: '#ffffff',
    text: '#0a0a0a',
    textSecondary: '#737373',
    primary: '#000000',
    primaryHover: '#262626',
    danger: '#ef4444',
    dangerHover: '#dc2626',
    success: '#10b981',
    successHover: '#059669',
    disabled: '#e5e5e5',
    disabledText: '#a3a3a3',
    errorBg: '#fef2f2',
    errorText: '#dc2626',
  },
  // Dark mode
  dark: {
    background: '#0a0a0a',
    cardBg: '#171717',
    text: '#fafafa',
    textSecondary: '#a3a3a3',
    primary: '#ffffff',
    primaryHover: '#e5e5e5',
    danger: '#f87171',
    dangerHover: '#ef4444',
    success: '#34d399',
    successHover: '#10b981',
    disabled: '#262626',
    disabledText: '#525252',
    errorBg: '#1c1917',
    errorText: '#f87171',
  },
};

// 获取当前主题颜色
export const getColors = () => {
  return isDarkMode() ? colors.dark : colors.light;
};

// 容器样式
export const containerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  margin: '0 auto',
};

// 钱包区块样式 - 极简无边框
export const getSectionStyle = (): CSSProperties => {
  const c = getColors();
  return {
    padding: '1.5rem',
    background: c.cardBg,
    borderRadius: '12px',
  };
};

// 标题样式 - 简洁
export const getTitleStyle = (): CSSProperties => {
  const c = getColors();
  return {
    margin: '0 0 1.25rem 0',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: c.text,
    letterSpacing: '-0.01em',
  };
};

// 按钮容器样式
export const buttonsContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

// 钱包选项样式
export const walletOptionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

// 基础按钮样式 - 扁平化
const baseButtonStyle: CSSProperties = {
  padding: '0.875rem 1.25rem',
  fontSize: '0.9375rem',
  fontWeight: 500,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease, opacity 0.15s ease',
  outline: 'none',
  letterSpacing: '-0.01em',
};

// 连接按钮样式 - 纯黑/纯白
export const getConnectButtonStyle = (isDisabled: boolean, isHovered: boolean): CSSProperties => {
  const c = getColors();
  const darkMode = isDarkMode();
  
  if (isDisabled) {
    return {
      ...baseButtonStyle,
      background: c.disabled,
      color: c.disabledText,
      cursor: 'not-allowed',
      border: darkMode ? '1px solid #404040' : '1px solid #d4d4d4',
    };
  }
  
  return {
    ...baseButtonStyle,
    background: isHovered ? c.primaryHover : c.primary,
    color: darkMode ? '#000000' : '#ffffff',
    cursor: 'pointer',
  };
};

// 断开连接按钮样式
export const getDisconnectButtonStyle = (isHovered: boolean): CSSProperties => {
  const c = getColors();
  return {
    ...baseButtonStyle,
    background: isHovered ? c.dangerHover : c.danger,
    color: '#ffffff',
  };
};

// 支付按钮样式
export const getPayButtonStyle = (isDisabled: boolean, isHovered: boolean): CSSProperties => {
  const c = getColors();
  return {
    ...baseButtonStyle,
    background: isDisabled ? c.disabled : (isHovered ? c.successHover : c.success),
    color: '#ffffff',
    width: '100%',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
  };
};

// 安装链接样式 - 简洁
export const getInstallLinkStyle = (isHovered: boolean): CSSProperties => {
  const c = getColors();
  return {
    display: 'inline-block',
    padding: '0.5rem',
    fontSize: '0.8125rem',
    color: c.textSecondary,
    textDecoration: isHovered ? 'underline' : 'none',
    textAlign: 'center',
    fontWeight: 500,
  };
};

// 钱包地址容器样式
export const walletAddressStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '1rem',
};

// 钱包标签样式
export const getLabelStyle = (): CSSProperties => {
  const c = getColors();
  return {
    fontSize: '0.8125rem',
    color: c.textSecondary,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };
};

// 地址样式
export const getAddressStyle = (): CSSProperties => {
  const c = getColors();
  return {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: c.text,
    letterSpacing: '-0.01em',
  };
};

// 钱包操作区域样式
export const walletActionsStyle: CSSProperties = {
  margin: '1rem 0',
};

// 提示文字样式
export const getHintStyle = (): CSSProperties => {
  const c = getColors();
  return {
    marginTop: '1rem',
    fontSize: '0.8125rem',
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: '1.5',
  };
};

// 错误信息样式 - 扁平化
export const getErrorStyle = (): CSSProperties => {
  const c = getColors();
  return {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    background: c.errorBg,
    color: c.errorText,
    borderRadius: '8px',
    fontSize: '0.8125rem',
    fontWeight: 500,
  };
};


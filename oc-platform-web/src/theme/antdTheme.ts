import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

const lightToken = {
  colorPrimary: '#1a1a2e',
  colorSuccess: '#1a8a6a',
  colorWarning: '#d4a017',
  colorError: '#c0392b',
  colorInfo: '#2f4f6f',
  colorBgContainer: '#faf9f7',
  colorBgLayout: '#faf9f7',
  colorBgElevated: '#f5f1eb',
  colorText: '#1a1a2e',
  colorTextSecondary: '#2c3e50',
  colorTextTertiary: '#4a5568',
  colorTextQuaternary: '#718096',
  colorBorder: 'rgba(26, 26, 46, 0.08)',
  colorBorderSecondary: 'rgba(26, 26, 46, 0.04)',
  borderRadius: 0,
  borderRadiusLG: 0,
  borderRadiusSM: 0,
  fontFamily: "'Noto Serif SC', 'Source Han Serif CN', 'STSong', 'SimSun', serif",
  fontSize: 15,
  fontSizeHeading1: 40,
  fontSizeHeading2: 32,
  fontSizeHeading3: 24,
  fontSizeHeading4: 18,
  fontSizeHeading5: 15,
  marginLG: 40,
  marginMD: 28,
  marginSM: 16,
  paddingLG: 40,
  paddingMD: 28,
  paddingSM: 16,
  boxShadow: '0 2px 20px rgba(26, 26, 46, 0.06)',
  boxShadowSecondary: '0 8px 40px rgba(26, 26, 46, 0.08)',
  lineHeight: 1.8,
  lineHeightHeading1: 1.4,
  lineHeightHeading2: 1.5,
};

const darkToken = {
  colorPrimary: '#60a5fa',
  colorSuccess: '#34d399',
  colorWarning: '#fbbf24',
  colorError: '#f87171',
  colorInfo: '#60a5fa',
  colorBgContainer: '#1e293b',
  colorBgLayout: '#0f172a',
  colorBgElevated: '#334155',
  colorText: '#f1f5f9',
  colorTextSecondary: '#cbd5e1',
  colorTextTertiary: '#94a3b8',
  colorTextQuaternary: '#64748b',
  colorBorder: 'rgba(255, 255, 255, 0.1)',
  colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',
  borderRadius: 0,
  borderRadiusLG: 0,
  borderRadiusSM: 0,
  fontFamily: "'Noto Serif SC', 'Source Han Serif CN', 'STSong', 'SimSun', serif",
  fontSize: 15,
  fontSizeHeading1: 40,
  fontSizeHeading2: 32,
  fontSizeHeading3: 24,
  fontSizeHeading4: 18,
  fontSizeHeading5: 15,
  marginLG: 40,
  marginMD: 28,
  marginSM: 16,
  paddingLG: 40,
  paddingMD: 28,
  paddingSM: 16,
  boxShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
  boxShadowSecondary: '0 8px 40px rgba(0, 0, 0, 0.4)',
  lineHeight: 1.8,
  lineHeightHeading1: 1.4,
  lineHeightHeading2: 1.5,
};

const lightComponents: ThemeConfig['components'] = {
  Button: {
    borderRadius: 0,
    controlHeight: 44,
    paddingInline: 28,
    primaryShadow: 'none',
    defaultBorderColor: 'rgba(26, 26, 46, 0.15)',
    defaultColor: '#1a1a2e',
    primaryColor: '#faf9f7',
    colorPrimaryHover: '#2c3e50',
    fontWeight: 500,
  },
  Card: {
    borderRadiusLG: 0,
    boxShadowTertiary: '0 4px 24px rgba(26, 26, 46, 0.06)',
    headerBg: 'transparent',
    colorBorderSecondary: 'transparent',
  },
  Menu: {
    itemBg: 'transparent',
    itemSelectedBg: 'rgba(192, 57, 43, 0.06)',
    itemSelectedColor: '#c0392b',
    itemHoverBg: 'rgba(26, 26, 46, 0.03)',
    itemHoverColor: '#1a1a2e',
    activeBarBorderWidth: 0,
  },
  Input: {
    borderRadius: 0,
    activeBorderColor: '#1a1a2e',
    hoverBorderColor: '#4a5568',
    activeShadow: '0 0 0 3px rgba(26, 26, 46, 0.06)',
    paddingBlock: 12,
    paddingInline: 16,
  },
  Select: {
    borderRadius: 0,
    activeBorderColor: '#1a1a2e',
    hoverBorderColor: '#4a5568',
  },
  Tabs: {
    inkBarColor: '#c0392b',
    itemSelectedColor: '#c0392b',
    itemHoverColor: '#1a1a2e',
    itemColor: '#4a5568',
  },
  Table: {
    borderRadius: 0,
    headerBg: 'transparent',
    headerColor: '#1a1a2e',
    rowHoverBg: 'rgba(26, 26, 46, 0.02)',
    borderColor: 'rgba(26, 26, 46, 0.06)',
    headerSplitColor: 'transparent',
    cellPaddingBlock: 16,
  },
  Tag: {
    borderRadiusSM: 0,
  },
  Rate: {
    starColor: '#d4a017',
  },
  Divider: {
    colorSplit: 'rgba(26, 26, 46, 0.08)',
  },
  Modal: {
    borderRadiusLG: 0,
    contentBg: '#faf9f7',
    headerBg: 'transparent',
  },
  Drawer: {
    colorBgElevated: '#faf9f7',
  },
  Message: {
    borderRadiusLG: 0,
  },
  Form: {
    labelColor: '#2c3e50',
    labelFontSize: 14,
  },
};

const darkComponents: ThemeConfig['components'] = {
  Button: {
    borderRadius: 0,
    controlHeight: 44,
    paddingInline: 28,
    primaryShadow: 'none',
    defaultBorderColor: 'rgba(255, 255, 255, 0.2)',
    defaultColor: '#f1f5f9',
    primaryColor: '#1e293b',
    colorPrimaryHover: '#3b82f6',
    fontWeight: 500,
  },
  Card: {
    borderRadiusLG: 0,
    boxShadowTertiary: '0 4px 24px rgba(0, 0, 0, 0.3)',
    headerBg: 'transparent',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
    colorText: '#f1f5f9',
  },
  Menu: {
    itemBg: 'transparent',
    itemSelectedBg: 'rgba(96, 165, 250, 0.15)',
    itemSelectedColor: '#60a5fa',
    itemHoverBg: 'rgba(255, 255, 255, 0.05)',
    itemHoverColor: '#f1f5f9',
    activeBarBorderWidth: 0,
  },
  Input: {
    borderRadius: 0,
    activeBorderColor: '#60a5fa',
    hoverBorderColor: '#94a3b8',
    activeShadow: '0 0 0 3px rgba(96, 165, 250, 0.15)',
    paddingBlock: 12,
    paddingInline: 16,
    colorBgContainer: '#1e293b',
    colorText: '#f1f5f9',
    colorTextPlaceholder: '#64748b',
  },
  Select: {
    borderRadius: 0,
    activeBorderColor: '#60a5fa',
    hoverBorderColor: '#94a3b8',
    colorBgContainer: '#1e293b',
    colorText: '#f1f5f9',
    optionSelectedBg: 'rgba(96, 165, 250, 0.15)',
    optionActiveBg: 'rgba(255, 255, 255, 0.05)',
  },
  Tabs: {
    inkBarColor: '#60a5fa',
    itemSelectedColor: '#60a5fa',
    itemHoverColor: '#f1f5f9',
    itemColor: '#94a3b8',
  },
  Table: {
    borderRadius: 0,
    headerBg: 'transparent',
    headerColor: '#f1f5f9',
    rowHoverBg: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    headerSplitColor: 'transparent',
    cellPaddingBlock: 16,
  },
  Tag: {
    borderRadiusSM: 0,
  },
  Rate: {
    starColor: '#fbbf24',
  },
  Divider: {
    colorSplit: 'rgba(255, 255, 255, 0.1)',
  },
  Modal: {
    borderRadiusLG: 0,
    contentBg: '#1e293b',
    headerBg: 'transparent',
  },
  Drawer: {
    colorBgElevated: '#1e293b',
  },
  Message: {
    borderRadiusLG: 0,
  },
  Form: {
    labelColor: '#cbd5e1',
    labelFontSize: 14,
  },
  Dropdown: {
    colorBgElevated: '#334155',
    colorText: '#f1f5f9',
    controlItemBgHover: 'rgba(255, 255, 255, 0.05)',
    controlItemBgActive: 'rgba(96, 165, 250, 0.15)',
  },
  Tooltip: {
    colorBgSpotlight: '#334155',
    colorText: '#f1f5f9',
  },
  Popover: {
    colorBgElevated: '#334155',
    colorText: '#f1f5f9',
  },
};

export const lightTheme: ThemeConfig = {
  token: lightToken,
  components: lightComponents,
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: darkToken,
  components: darkComponents,
};

const theme: ThemeConfig = lightTheme;

export default theme;

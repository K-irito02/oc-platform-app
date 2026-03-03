import type { ThemeConfig } from 'antd';

/**
 * 水墨画主题配置 - InkThemeEngine
 * 按设计文档要求：去掉所有直角边框、去掉纯色背景、书法字体
 */
const theme: ThemeConfig = {
  token: {
    // ===== 墨色五阶 =====
    colorPrimary: '#1a1a2e',      // 浓墨
    colorSuccess: '#1a8a6a',      // 青绿
    colorWarning: '#d4a017',      // 藤黄
    colorError: '#c0392b',        // 朱砂
    colorInfo: '#2f4f6f',         // 靛蓝

    // ===== 宣纸色 =====
    colorBgContainer: '#faf9f7',  // 宣纸白
    colorBgLayout: '#faf9f7',
    colorBgElevated: '#f5f1eb',   // 宣纸暖

    // ===== 墨色文字 =====
    colorText: '#1a1a2e',         // 浓墨
    colorTextSecondary: '#2c3e50', // 重墨
    colorTextTertiary: '#4a5568',  // 中墨
    colorTextQuaternary: '#718096', // 淡墨

    // ===== 边框 - 极淡或无 =====
    colorBorder: 'rgba(26, 26, 46, 0.08)',
    colorBorderSecondary: 'rgba(26, 26, 46, 0.04)',

    // ===== 圆角 - 去掉所有直角边框 =====
    borderRadius: 0,
    borderRadiusLG: 0,
    borderRadiusSM: 0,

    // ===== 书法字体家族 =====
    fontFamily: "'Noto Serif SC', 'Source Han Serif CN', 'STSong', 'SimSun', serif",
    fontSize: 15,
    fontSizeHeading1: 40,  // 榜书
    fontSizeHeading2: 32,  // 大字
    fontSizeHeading3: 24,  // 中字
    fontSizeHeading4: 18,  // 题跋
    fontSizeHeading5: 15,  // 小楷

    // ===== 留白系数 =====
    marginLG: 40,
    marginMD: 28,
    marginSM: 16,
    paddingLG: 40,
    paddingMD: 28,
    paddingSM: 16,

    // ===== 墨晕阴影 =====
    boxShadow: '0 2px 20px rgba(26, 26, 46, 0.06)',
    boxShadowSecondary: '0 8px 40px rgba(26, 26, 46, 0.08)',

    // ===== 线高 - 舒朗 =====
    lineHeight: 1.8,
    lineHeightHeading1: 1.4,
    lineHeightHeading2: 1.5,
  },
  components: {
    // ===== 按钮 - 印章形态 =====
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
    // ===== 卡片 - 无边框、墨晕阴影 =====
    Card: {
      borderRadiusLG: 0,
      boxShadowTertiary: '0 4px 24px rgba(26, 26, 46, 0.06)',
      headerBg: 'transparent',
      colorBorderSecondary: 'transparent',
    },
    // ===== 菜单 =====
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(192, 57, 43, 0.06)',
      itemSelectedColor: '#c0392b',
      itemHoverBg: 'rgba(26, 26, 46, 0.03)',
      itemHoverColor: '#1a1a2e',
      activeBarBorderWidth: 0,
    },
    // ===== 输入框 - 砚台/墨池效果 =====
    Input: {
      borderRadius: 0,
      activeBorderColor: '#1a1a2e',
      hoverBorderColor: '#4a5568',
      activeShadow: '0 0 0 3px rgba(26, 26, 46, 0.06)',
      paddingBlock: 12,
      paddingInline: 16,
    },
    // ===== 选择器 =====
    Select: {
      borderRadius: 0,
      activeBorderColor: '#1a1a2e',
      hoverBorderColor: '#4a5568',
    },
    // ===== 标签页 - 朱砂色 =====
    Tabs: {
      inkBarColor: '#c0392b',
      itemSelectedColor: '#c0392b',
      itemHoverColor: '#1a1a2e',
      itemColor: '#4a5568',
    },
    // ===== 表格 - 朱丝栏册页 =====
    Table: {
      borderRadius: 0,
      headerBg: 'transparent',
      headerColor: '#1a1a2e',
      rowHoverBg: 'rgba(26, 26, 46, 0.02)',
      borderColor: 'rgba(26, 26, 46, 0.06)',
      headerSplitColor: 'transparent',
      cellPaddingBlock: 16,
    },
    // ===== 标签 =====
    Tag: {
      borderRadiusSM: 0,
    },
    // ===== 评分 - 藤黄 =====
    Rate: {
      starColor: '#d4a017',
    },
    // ===== 分割线 =====
    Divider: {
      colorSplit: 'rgba(26, 26, 46, 0.08)',
    },
    // ===== 模态框 =====
    Modal: {
      borderRadiusLG: 0,
      contentBg: '#faf9f7',
      headerBg: 'transparent',
    },
    // ===== 抽屉 =====
    Drawer: {
      colorBgElevated: '#faf9f7',
    },
    // ===== 消息提示 =====
    Message: {
      borderRadiusLG: 0,
    },
    // ===== 表单 =====
    Form: {
      labelColor: '#2c3e50',
      labelFontSize: 14,
    },
  },
};

export default theme;

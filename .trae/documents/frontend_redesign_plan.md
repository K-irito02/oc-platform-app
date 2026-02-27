# 前端重构计划：现代化极简多产品官网

## 1. 目标
将现有 "水墨风" 前端重构为现代化、极简、大气的产品官网集合平台。
- **风格**：极简、实用、黑白灰/中性色调、无花哨装饰。
- **功能**：响应式设计、中英切换、亮/暗/跟随系统主题。
- **结构**：主站作为产品入口（Hub），每个产品页独立呈现（类似 Cursor/Trae 官网风格）。
- **技术栈**：React + TypeScript + Tailwind CSS + Ant Design + Framer Motion。

## 2. 清理工作 (Cleanup)
移除所有与 "水墨风" 相关的资源和代码，为新设计腾出空间。
- [ ] 删除 `src/assets/ink` 目录及所有 SVG 资源。
- [ ] 删除 `public/test-assets` 目录（视频/大图）。
- [ ] 删除 `src/components/Ink` 目录。
- [ ] 删除 `src/components/DynamicBackground` 目录。
- [ ] 清理 `MainLayout` 和 `App.tsx` 中对上述组件的引用。
- [ ] 清理 `index.css` 中可能的全局水墨样式。

## 3. 架构设计 (Architecture)

### 3.1 布局系统
- **RootLayout**: 处理全局 Context (Theme, i18n, Auth)。
- **MainLayout**: 官网主布局，包含统一的顶部导航栏 (Navbar) 和底部 (Footer)。
- **ProductLayout** (可选): 如果特定产品需要完全不同的导航结构，可扩展此布局。

### 3.2 路由结构
保持现有 `react-router-dom` v7 结构，但更新组件内容。
- `/`: 官网首页 (Products Hub)。展示所有产品卡片/列表。
- `/products/:slug`: 产品详情页。设计为 Landing Page 风格（Hero -> Features -> Pricing -> Download）。
- `/login`, `/register`: 保持独立布局，但更新 UI 风格以匹配新设计。

### 3.3 主题与样式
- **Tailwind CSS**: 启用 `darkMode: 'class'`。
- **Color Palette**:
  - Primary: 黑色/白色 (根据主题反转)。
  - Secondary: Slate/Zinc 灰色系。
  - Accent: 蓝色/紫色 (用于少量的行动点用色，如按钮)。
- **Ant Design**: 配置 ConfigProvider 以适配 Tailwind 的 Dark Mode 变量。

### 3.4 国际化 (i18n)
- 确保 `Navbar` 包含语言切换器。
- 确保所有新页面文本通过 `t()` 获取。

## 4. 实施步骤 (Implementation Steps)

### Phase 1: 基础清理与配置
1. 执行清理工作，删除旧文件。
2. 配置 Tailwind `tailwind.config.js`，确保颜色和暗黑模式配置正确。
3. 更新 `src/index.css`，引入基础的 Tailwind 指令，重置样式。

### Phase 2: 核心组件开发
1. **Navbar**:
   - 响应式（移动端汉堡菜单）。
   - Logo (左)。
   - 导航链接 (产品, 定价, 文档)。
   - 功能区 (语言切换, 主题切换, 登录/用户头像)。
   - 使用 `Glassmorphism` (毛玻璃) 效果但保持克制。
2. **Footer**:
   - 简洁的多列布局 (产品, 资源, 公司, 法律)。
3. **ThemeToggle**:
   - 支持 Light / Dark / System 三种模式。

### Phase 3: 页面重构
1. **Home Page (首页)**:
   - **Hero Section**: 简洁大标题，副标题，CTA 按钮。
   - **Product Grid**: 展示产品列表，每个产品包含图标、名称、简短描述。
2. **Product Detail Page (产品页)**:
   - 重构 `/products/:slug`。
   - 实现模块化 Sections: Hero, Feature List (左右交替布局), Bento Grid (特性展示), CTA。
3. **Auth Pages**:
   - 更新登录/注册页面的 UI，使其符合极简风格。

### Phase 4: 验证与优化
1. 检查响应式表现 (Mobile/Tablet/Desktop)。
2. 验证所有页面的亮/暗模式切换。
3. 验证中英文切换。

## 5. 待办事项 (Todo)
- [ ] 确认产品数据结构是否支持 Landing Page 所需的富文本/图片字段。如果不支持，暂时在前端 Mock 或硬编码部分展示内容以达到设计效果。

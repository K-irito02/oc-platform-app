# 前端个性化与水墨画风格实施计划

## 1. 概述

本计划旨在实现Web项目的深度个性化功能，具体包括：
1.  **自定义背景**：支持用户级和超级管理员级上传视频（MP4/WebM）或图片（JPG/PNG/WebP/SVG）作为页面背景。
2.  **水墨画风格引擎**：实现“水墨画”设计规范，并将其作为默认风格。同时构建一套可配置的主题系统，使边框、按钮、交互效果等元素支持未来的自定义配置。

## 2. 架构设计

### 2.1 配置层级 (Configuration Hierarchy)

系统将采用三层配置优先级策略，由高到低：
1.  **用户级 (User Level)**: 用户在个人设置中定义的个性化配置（如自定义背景）。
2.  **管理员级 (Admin Level)**: 超级管理员在系统设置中定义的全局默认配置（如节日限定背景、默认水墨素材）。
3.  **系统默认 (System Default)**: 代码中硬编码的“水墨画”风格基准配置。

### 2.2 数据模型

#### 后端 (Backend)
-   **用户表 (`users`)**: 新增 `theme_config` (JSON) 字段，存储用户的个性化设置。
-   **系统配置表 (`system_configs`)**: 使用特定的 key (如 `theme.global.config`) 存储管理员设定的全局默认配置。

**Config JSON 结构示例**:
```json
{
  "background": {
    "type": "video", // or "image"
    "url": "https://...", 
    "opacity": 0.8,
    "overlay": "paper-texture.png" // 宣纸纹理叠加
  },
  "ink": {
    "primaryColor": "#8B0000", // 朱砂红
    "strokeWidth": "2px",
    "fontFamily": "Ma Shan Zheng, cursive"
  }
}
```

#### 前端 (Frontend)
-   **State Management**: 使用 Redux Toolkit (`themeSlice`) 管理合并后的最终配置。
-   **Theme Engine**: 基于 CSS Variables 实现动态样式切换。

## 3. 前端实施方案

### 3.1 主题引擎 (Theme Engine)

创建一个 `ThemeProvider` 组件，负责：
1.  从后端获取 User Config 和 System Config。
2.  合并配置（User > System > Default）。
3.  将配置转换为 CSS Variables 并挂载到 `:root`，例如：
    -   `--ink-bg-media`: `url(...)`
    -   `--ink-primary-color`: `#8B0000`
    -   `--ink-border-image`: `url(...)`

### 3.2 核心组件开发

#### A. 动态背景组件 (`DynamicBackground`)
-   支持渲染 `<video>` (autoplay, loop, muted) 或 `<img>`。
-   支持叠加层（Overlay）用于实现“宣纸纹理”效果，确保文字可读性。
-   实现“淡墨山水”底纹的动态定位（根据设计文档的“边角构图”）。

#### B. 水墨风格组件库 (Ink Component Library)
根据设计文档《水墨画设计.md》实现以下组件的**默认样式**（同时支持通过配置替换素材）：

1.  **InkLayout (布局)**:
    -   实现 手卷 (Scroll)、立轴 (Vertical)、册页 (Card) 三种布局骨架。
    -   控制全局留白（Padding）和“天地头”。
2.  **InkButton (交互)**:
    -   无边框设计。
    -   点击效果：Canvas 绘制“朱砂印迹”动画。
    -   悬停效果：CSS Box-shadow 模拟“墨晕扩散”。
3.  **InkCard (容器)**:
    -   背景：宣纸纹理。
    -   边缘：微锯齿处理（模拟撕纸效果）。
4.  **InkLoader (加载)**:
    -   Canvas 实现“墨滴入水”动画。

### 3.3 设置界面 (Settings UI)

-   **用户设置页**: 添加“外观设置”面板，提供背景上传（调用文件服务）、预览功能。
-   **管理员仪表盘**: 添加“主题管理”面板，允许上传默认背景和替换全局水墨素材。

## 4. 后端实施方案

### 4.1 数据库变更
-   修改 `users` 表，添加 `theme_config` 字段 (类型: JSON/Text)。

### 4.2 API 接口
-   `GET /api/v1/users/me/theme`: 获取当前用户的合并主题配置。
-   `PUT /api/v1/users/me/theme`: 更新用户的个性化配置。
-   `PUT /api/v1/admin/system/theme`: 更新系统级默认配置（仅限管理员）。

## 5. 实施步骤 (Phased Plan)

### 第一阶段：基础设施与数据打通
1.  **Backend**: 在 `User` 实体和数据库中添加 `theme_config` 字段。
2.  **Backend**: 实现主题配置的 CRUD 接口。
3.  **Frontend**: 创建 `themeSlice` 和 `useTheme` Hook，实现配置拉取与合并逻辑。

### 第二阶段：自定义背景与布局
1.  **Frontend**: 开发 `DynamicBackground` 组件，支持视频/图片切换。
2.  **Frontend**: 实现 `InkLayout`，应用宣纸纹理和基础构图（手卷/立轴）。
3.  **Frontend**: 在用户设置页实现背景上传功能。

### 第三阶段：水墨组件与交互细节
1.  **Frontend**: 实现 `InkButton` (印章交互) 和 `InkCard` (墨晕效果)。
2.  **Frontend**: 实现 `InkLoader` (墨滴动画)。
3.  **Frontend**: 全局应用自定义字体和排版规则。
4.  **Frontend**: 替换系统默认图标为水墨风格 SVG。

### 第四阶段：管理员控制台
1.  **Frontend**: 在 Admin Console 中增加全局主题配置入口。

## 6. 验证计划
-   **功能验证**: 用户上传视频后，刷新页面背景是否生效且持久化。
-   **样式验证**: 检查“点击钤印”、“悬停墨晕”是否符合设计文档的物理质感。
-   **权限验证**: 确保普通用户无法修改系统级默认配置。

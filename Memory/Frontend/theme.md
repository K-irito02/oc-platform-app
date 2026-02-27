# Glassmorphism 主题系统记忆

> 最后更新: 2026-02-27

## 主题架构

```
三层主题体系:
1. Tailwind CSS (tailwind.config.js) → 实用类、自定义颜色、动画
2. CSS 变量 (index.css)              → 动态背景、玻璃拟态参数
3. Redux themeSlice                  → 运行时动态主题（用户/系统配置合并）
```

## 设计核心原则

1.  **玻璃拟态 (Glassmorphism)**: 半透明背景、背景模糊、细微边框，创造深度感。
2.  **极简主义 (Minimalism)**: 干净的布局、充足的留白、内容为王。
3.  **高度定制 (Customization)**: 用户可定义背景（图片/视频）、模糊度、透明度、主色调。

## CSS 变量 (`src/index.css`)

### 玻璃拟态参数
| 变量 | 说明 | 默认值 |
|------|------|--------|
| `--glass-opacity` | 玻璃层不透明度 | `0.7` |
| `--glass-blur` | 背景模糊度 | `12px` |
| `--glass-border-opacity` | 边框不透明度 | `0.2` |

### 动态主题变量 (由 ThemeProvider 设置)
| 变量 | 说明 |
|------|------|
| `--primary-color` | 主色调 (RGB格式，如 `59 130 246`) |
| `--font-family` | 全局字体 |
| `--bg-image` | 背景图片/视频 URL |
| `--bg-type` | 背景类型 (`image` / `video`) |

## Tailwind 配置 (`tailwind.config.js`)

### 扩展颜色
| 类名 | 值 | 用途 |
|------|------|------|
| `primary` | `rgb(var(--primary-color) / <alpha-value>)` | 主色调 |
| `glass` | `rgba(255, 255, 255, var(--glass-opacity))` | 玻璃背景 |

### 核心组件类
| 组件 | 类名组合 |
|------|----------|
| **Glass Card** | `bg-white/var(--glass-opacity) backdrop-blur-[var(--glass-blur)] border border-white/var(--glass-border-opacity) shadow-xl` |
| **Glass Button** | `bg-primary/90 hover:bg-primary text-white shadow-lg backdrop-blur-sm` |
| **Glass Input** | `bg-white/50 border-white/30 focus:ring-2 focus:ring-primary/50` |

## 组件系统

### 基础组件 (`src/components/ui/`)
- **GlassCard**: 封装了玻璃拟态样式的容器组件，支持 `className` 扩展。
- **GlassButton**: 支持 `variant` (default, ghost, outline) 和 `size` 的按钮组件。
- **DynamicBackground**: 负责渲染背景媒体（支持 `<video>` 和 `<img>`），处理加载状态。
- **AvatarUpload**: 头像上传组件，支持多格式(JPG/PNG/WebP/GIF/BMP/SVG)、圆形裁剪、5MB大小限制、缩放滑块。
- **AuthPageToolbar**: 认证页面工具栏，包含语言切换和主题切换（亮/暗/系统）。

### 布局组件 (`src/components/layout/`)
- **Sidebar**: 玻璃拟态侧边栏，包含导航菜单，支持收缩展开。
- **Navbar**: 前台导航条，包含主题设置入口，支持管理后台入口。
- **AdminSidebar**: 后台管理侧边栏，深色玻璃拟态风格。
- **Footer**: 页脚组件。
- **ThemeSettings**: 抽屉式主题配置面板，支持背景上传、透明度调节、主色调选择、字体切换。

## 动态主题 (`src/store/slices/themeSlice.ts`)

### State 结构
```typescript
interface ThemeState {
  currentTheme: {
    background: {
      type: 'image' | 'video';
      url: string;
      blur: number;      // px
      opacity: number;   // 0-1
    };
    appearance: {
      primaryColor: string; // hex
      fontFamily: string;
      mode: 'light' | 'dark';
    };
  };
  // ... systemConfig, userConfig
}
```

### 配置合并逻辑
1.  **System Config**: 默认配置（抽象几何背景、标准模糊度）。
2.  **User Config**: 用户个性化设置（保存在 LocalStorage/后端）。
3.  **最终应用**: User Config 覆盖 System Config。

## 主题管理功能

### 用户端 (`/profile` & 全局设置)
- **背景设置**:
    - 切换图片/视频背景
    - 上传自定义文件 (支持预览)
    - 调节模糊度 (Blur Slider)
    - 调节透明度 (Opacity Slider)
- **外观设置**:
    - 选择主色调 (Color Picker)
    - 切换字体

### 管理员端 (`/admin/theme`)
- 配置系统默认主题
- 预设背景库管理

## 资源路径
- 设计规范: `src/design-system/MASTER.md`
- 字体文件: Google Fonts (Inter, Roboto 等)

# Glassmorphism Design System (QT Platform)

## Core Principles
1.  **Glassmorphism**: Translucent backgrounds, blur effects, and subtle borders to create depth.
2.  **Minimalism**: Clean layouts, ample whitespace, and focus on content.
3.  **Customization**: User-defined backgrounds (video/image) and theme colors.

## Color Palette
-   **Primary**: Blue-500 (`#3b82f6`) - Action buttons, links, active states.
-   **Secondary**: Emerald-500 (`#10b981`) - Success states, positive trends.
-   **Accent**: Rose-500 (`#f43f5e`) - Errors, alerts, highlights.
-   **Background**: Dynamic (User uploaded). Default: Abstract geometric shapes or soft gradients.
-   **Surface**: White with opacity (`bg-white/70`, `bg-white/50`, etc.).
-   **Text**: Slate-800 (`#1e293b`) for primary, Slate-500 (`#64748b`) for secondary.

## Typography
-   **Font Family**: System UI (San Francisco, Inter, Segoe UI).
-   **Headings**: Bold, Slate-900.
-   **Body**: Regular, Slate-700.

## Component Styles

### 1. Glass Card (`.glass-panel`)
-   Background: `bg-white/70` (Light mode), `bg-slate-900/60` (Dark mode).
-   Backdrop Blur: `backdrop-blur-md` (12px).
-   Border: `border border-white/20`.
-   Shadow: `shadow-xl`.
-   Radius: `rounded-xl` or `rounded-2xl`.

### 2. Glass Button (`.glass-button`)
-   Background: Primary color with 90% opacity.
-   Hover: 100% opacity, slightly larger shadow.
-   Active: Scale down (95%).
-   Text: White.

### 3. Glass Input (`.glass-input`)
-   Background: `bg-white/50`.
-   Border: `border-white/30`.
-   Focus: `ring-2 ring-primary/50`.

## Layout Structure
-   **Sidebar**: Glass panel on the left (fixed or collapsible).
-   **Header**: Glass strip at the top (sticky).
-   **Content**: Scrollable area with cards and widgets.

## Customization Options (User/Admin)
1.  **Background Media**: URL to Image or Video (MP4/WebM).
2.  **Glass Opacity**: Slider (0.1 - 1.0).
3.  **Glass Blur**: Slider (0px - 20px).
4.  **Theme Color**: Color picker for Primary Color.
5.  **Font Family**: Select from presets (Inter, Roboto, System).

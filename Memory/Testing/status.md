# 测试状态记忆

> 最后更新: 2026-02-27

## 当前测试状态

### 前端

| 检查项 | 状态 | 说明 |
|--------|------|------|
| TypeScript 编译 | ✅ 通过 | `tsc --noEmit` 零错误 |
| Vite 构建 | ✅ 通过 | `npm run build` 成功（~20-25s） |
| ESLint | ⚠️ 有 warnings | CSS inline style warnings（设计选择，非错误） |
| 视觉测试 | ✅ 通过 | 全部前台页面 + 英文切换验证通过 |
| Mock 开关 | ✅ 完成 | VITE_ENABLE_MOCK=false 可禁用 Mock，使用真实后端 |
| 单元测试 | ❌ 待实现 | Jest + React Testing Library 尚未配置 |
| E2E 测试 | ✅ 通过 | Playwright Python 脚本 - 基础页面+管理员主题+用户主题全测通过 (2026-02-16) |

### 后端

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Maven 编译 | ✅ 通过 | `mvn clean package -DskipTests` |
| 单元测试 | ❌ 待实现 | JUnit 5 + Mockito 尚未编写 |
| 集成测试 | ❌ 待实现 | @SpringBootTest 尚未编写 |
| API 测试 | ✅ 通过 | 全面 curl 测试通过（见下方详细记录）|

## 测试素材

- **前端测试素材目录**: `Front-end testing/Background material/`
  - 背景图片 (jpeg)
  - 风格视频素材 (mp4) × 6+

## E2E 测试记录（Playwright）

### 全页面功能测试 ✅ (2026-02-16)

**测试范围：**
1. ✅ 首页 `/` - 英雄区、特性卡片、精选产品
2. ✅ 产品列表 `/products` - 搜索、分类筛选、排序、产品卡片
3. ✅ 产品详情 `/products/:slug` - 概述/版本/评论 tabs、下载侧栏
4. ✅ 登录页 `/login` - 表单、测试账号填入、登录成功跳转
5. ✅ 注册页 `/register` - 表单完整
6. ✅ 个人中心 `/profile` - 个人资料/账号信息/修改密码/外观设置 tabs
7. ✅ 管理后台 `/admin` - 仪表盘统计、下载趋势图
8. ✅ 管理后台侧边栏导航 - 用户/产品/评论/分类/主题/系统配置

**测试截图：**
- `home-page-test.png` - 主页
- `products-page-test.png` - 产品列表
- `product-detail-test.png` - 产品详情
- `login-page-test.png` - 登录页
- `register-page-test.png` - 注册页
- `profile-page-test.png` - 个人中心
- `admin-dashboard-test.png` - 管理后台仪表盘

**测试结果：**
- UI渲染正常 ✅
- 组件交互正常 ✅
- 表单元素完整 ✅
- 风格一致 ✅
- 登录/权限流程正常 ✅
- Mock数据拦截正常 ✅

### 主题管理功能测试 ✅ (2026-02-16)

**用户级主题设置（个人中心-外观设置）：**
- ✅ 背景类型切换（图片/视频）
- ✅ 背景文件URL输入 + 上传按钮
- ✅ 背景透明度滑块（0%-100%）
- ✅ 保存设置/重置按钮

**超级管理员主题管理（/admin/theme）：**
- ✅ 背景设置区域
  - 背景类型切换（图片/视频）
  - 背景文件URL输入 + 上传按钮
  - 背景透明度滑块
- ✅ 风格设置区域
  - 主色调输入（颜色值如 #1a1a2e）
  - 笔画宽度输入（如 2px、3px）
  - 字体输入（如 "Ma Shan Zheng", cursive）
- ✅ 保存配置按钮 - 显示"全局主题配置已保存"
- ✅ 重置按钮 - 恢复默认值

**测试截图：**
- `user-theme-settings.png` - 用户外观设置
- `admin-theme-settings.png` - 管理员主题管理
- `admin-theme-saved.png` - 保存配置成功
- `home-before-theme-change.png` - 修改前首页（红色主题）
- `home-blue-theme.png` - 修改后首页（蓝色主题，即时生效）
- `home-green-theme-final.png` - 页面刷新后首页（绿色主题，持久化生效）

**验证结果：**
- ✅ 主色调修改后即时生效（无需刷新）
- ✅ 主题配置持久化到 localStorage（页面刷新后保持）
- ✅ 印章、导航链接、按钮等元素颜色随主题变化
- ✅ 笔画宽度修改后卡片边框变化生效
- ✅ 字体选择器支持预设选项和自定义
- ✅ 背景透明度 CSS 变量正确应用

### 主题管理深度修复 (2026-02-16 01:45)

**根本原因分析与修复：**
1. ✅ 文件上传URL假：Mock返回`/mock/uploaded-file.png`不存在 → 改用`URL.createObjectURL()`生成真实blob URL
2. ✅ 背景透明度不生效：背景URL假所以看不到 → 添加表单内实时预览区域，透明度实时反映
3. ✅ 主色调色条灰色：没有可视化预览 → 添加动态颜色预览条+发光效果
4. ✅ 笔画宽度不生效：`--ink-stroke-width`只用在极少元素 → 扩展到card/seal/footer/focus/paper-card/brush-underline
5. ✅ 字体不生效：字体未加载 → 添加Google Fonts导入(Ma Shan Zheng/ZCOOL XiaoWei/Liu Jian Mao Cao/Zhi Mang Xing/Long Cang) + LXGW WenKai CDN
6. ✅ 缺少行书/草书字体 → 添加行书(Zhi Mang Xing)、草书(Liu Jian Mao Cao)、龙藏体(Long Cang)
7. ✅ 用户外观设置缺少风格设置 → 添加主色调/笔画宽度/字体设置

**管理员主题管理 `/admin/theme` 功能完整清单：**
- ✅ 背景上传：使用 createObjectURL 生成真实预览URL + 表单内实时预览
- ✅ 背景透明度：Slider + 预览区域实时反映透明度变化
- ✅ 主色调：ColorPicker + 动态颜色预览条 + 发光效果
- ✅ 笔画宽度：Select预设选项 + 自定义 + 预览条
- ✅ 字体：Select预设8种字体(含行书/草书) + 自定义 + 实时预览区

**用户外观设置 `/profile` > 外观设置：**
- ✅ 背景上传/透明度/预览 — 与管理员版相同
- ✅ 主色调/笔画宽度/字体 — 与管理员版相同

**测试验证结果：**
- ✅ 草书字体保存后首页标题即时变为草书体
- ✅ 页面刷新后草书字体仍然保持（持久化）
- CSS变量验证: `--font-serif`="Liu Jian Mao Cao", `--ink-stroke-width`=3px, `--cinnabar`=#228b22, `--ink-bg-opacity`=0.8

## 待实现测试计划

### 前端测试（阶段一 MVP 后）
1. 配置 Jest + React Testing Library
2. 关键组件单元测试
3. 路由导航测试
4. API 调用 Mock 测试
5. 国际化切换测试
6. 扩展 Playwright E2E 测试覆盖

### 后端测试（阶段一 MVP 后）
1. Service 层单元测试（Mockito）
2. Controller 层单元测试（MockMvc）
3. Repository 层集成测试（@DataJpaTest / TestContainers）
4. 安全认证集成测试
5. API 端到端测试

## 已知问题与 Bug

> 全部已知问题均已修复

| ID | 模块 | 描述 | 严重性 | 状态 |
|----|------|------|--------|------|
| 1 | DB | seed.sql 表名错误 (product_categories → categories) | 高 | ✅ 已修复 |
| 2 | DB | seed.sql SHA256哈希超过varchar(64)限制 | 高 | ✅ 已修复 |
| 3 | DB | seed.sql 缺少 product_versions.file_path (NOT NULL) | 高 | ✅ 已修复 |
| 4 | DB | init.sql + seed.sql BCrypt密码哈希不匹配实际密码 | 高 | ✅ 已修复 |
| 5 | Docker | 本地PG占用5432端口，Docker PG无法被后端连接 | 高 | ✅ 改用5433 |
| 6 | 后端 | AuthService.updateById 对 inet 类型列写入失败 | 高 | ✅ 改用自定义SQL |
| 7 | 后端 | SecurityConfig admin端点未允许SUPER_ADMIN角色 | 高 | ✅ hasAnyRole |
| 8 | 前端 | AdminLayout 渲染时调用 navigate() 导致 React 警告 | 中 | ✅ 改用 useEffect |
| 9 | 前端 | 页面刷新后 user=null 导致权限检查失败重定向登录 | 高 | ✅ 添加加载状态等待 |
| 10 | 前端 | Mock 缺少 /admin/system/theme 和 /users/me/theme 路由 | 中 | ✅ 已添加 |
| 11 | 前端 | Ant Design App 组件未包装导致 message 静态函数警告 | 低 | ✅ 已添加 AntdApp |
| 12 | 前端 | ThemeProvider 只在管理员登录后加载系统主题 | 高 | ✅ 改为所有用户加载 |
| 13 | 前端 | ThemeProvider 未更新 --cinnabar CSS 变量 | 高 | ✅ 同时更新 --cinnabar |
| 14 | 前端 | Mock 主题配置未持久化到 localStorage | 中 | ✅ 使用 localStorage 保存 |
| 15 | 前端 | ThemeProvider 解析多层 JSON 字符串失败 | 中 | ✅ 添加多层解析逻辑 |
| 16 | 前端 | 管理员主题管理 Input.Group 已废弃 | 低 | ✅ 改用 Space.Compact |
| 17 | 前端 | 管理员主题管理背景文件URL输入框未绑定Form.Item | 中 | ✅ 正确绑定 noStyle |
| 18 | 前端 | 管理员主题管理主色调使用 Input type=color 显示不佳 | 中 | ✅ 改用 ColorPicker |
| 19 | 前端 | 管理员主题管理笔画宽度/字体只能手动输入 | 中 | ✅ 改用 Select 预设选项 |
| 20 | 前端 | 用户外观设置 Input.Group 已废弃 | 低 | ✅ 改用 Space.Compact |
| 21 | 前端 | 用户外观设置背景文件URL输入框未绑定Form.Item | 中 | ✅ 正确绑定 noStyle |
| 22 | 前端 | Mock文件上传返回假URL(/mock/uploaded-file.png) | 高 | ✅ 改用createObjectURL |
| 23 | 前端 | 字体未通过Google Fonts加载，切换无效果 | 高 | ✅ 添加字体导入 |
| 24 | 前端 | 缺少行书/草书字体选项 | 中 | ✅ 添加行书/草书/龙藏体 |
| 25 | 前端 | 主色调无可视化预览条 | 中 | ✅ 添加动态色条 |
| 26 | 前端 | 笔画宽度变量仅用在极少元素 | 中 | ✅ 扩展到更多CSS元素 |
| 27 | 前端 | 用户外观设置缺少主色调/笔画宽度/字体设置 | 中 | ✅ 添加完整功能 |
| 28 | 前端 | 背景透明度不生效：DynamicBackground未使用CSS变量 | 高 | ✅ 改用CSS变量控制 |
| 29 | 前端 | Mock API键名不一致：mock_system_theme vs systemThemeConfig | 中 | ✅ 统一使用systemThemeConfig |
| 30 | 前端 | AdminLayout 直接访问/admin/*时用户未加载导致重定向首页 | 高 | ✅ 添加 checking 状态等待用户加载 |
| 31 | 前端 | Navbar用户菜单缺少管理后台入口 | 高 | ✅ 添加 isAdmin 检查和管理后台菜单项 |
| 32 | 前端 | i18n翻译键缺失：nav.*, theme.light/dark/system, auth.loginSuccess/welcomeBack | 高 | ✅ 补充完整翻译键 |
| 33 | 后端 | UserController 缺少 /users/me/avatar 头像上传接口 | 高 | ✅ 添加接口和 UserService.uploadAvatar 方法 |
| 34 | 后端 | UserService.uploadAvatar 使用 updateById 导致 inet 类型转换错误 | 高 | ✅ 改用 LambdaUpdateWrapper 只更新 avatarUrl |
| 35 | 后端 | 缺少静态资源服务配置，头像URL无法访问 | 中 | ✅ 添加 WebMvcConfig 配置 /uploads/** 映射 |

## 测试覆盖率目标

- 前端: ≥ 80%（Jest + React Testing Library）
- 后端: ≥ 80%（JaCoCo）

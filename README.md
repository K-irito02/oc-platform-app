# OC 产品发布平台

> OC 软件产品发布与分发平台 — 现代玻璃拟态风格 (Glassmorphism) + 极简主义设计 + 中英文双语支持

---

## 技术栈

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | ~5.6.2 | 类型安全 |
| Vite | 5.4.x | 构建工具 + HMR |
| Tailwind CSS | 3.4.1 | 实用优先 CSS 框架 |
| Ant Design | 6.3.x | UI 组件库（配合 Glassmorphism） |
| Redux Toolkit | 2.11.x | 状态管理 |
| React Router DOM | 7.13.x | 路由（懒加载） |
| react-i18next | 16.5.x | 国际化（中/英） |
| Axios | 1.13.x | HTTP 请求 |

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.2.12 | 后端框架 |
| Spring Security | 6.2.x | JWT + RBAC 认证授权 |
| MyBatis-Plus | 3.5.x | ORM（复杂 SQL） |
| Spring Data JPA | 3.2.x | ORM（简单 CRUD） |
| PostgreSQL | 15.x | 主数据库（JSONB + 全文检索 + 表分区） |
| Redis | 7.x | 缓存 + 限流（单机模式） |
| MinIO | Latest | 对象存储（图片/视频上传） |
| SpringDoc OpenAPI | 2.x | API 文档（Swagger UI） |

### 基础设施

| 技术 | 说明 |
|------|------|
| Docker + Docker Compose | 容器化开发 + 生产部署 |
| Nginx | 反向代理 + SSL 终止 + 静态资源 |
| GitHub Actions | CI/CD 自动构建/测试/部署 |
| Spring Boot Actuator + Prometheus | 基础监控 |

---

## 快速开始（本地运行）

### 1. 环境要求

| 软件 | 版本 | 安装方式 |
|------|------|---------|
| JDK | OpenJDK 17.0.15 (Temurin) | [adoptium.net](https://adoptium.net) |
| Node.js | 22.x LTS | nvm-windows |
| Maven | 3.9.x | 官网安装 |
| Docker Desktop | Latest | 官网安装，启用 WSL2 |
| Git | Latest | 官网安装 |

### 2. 克隆项目

```bash
git clone https://github.com/K-irito02/oc-platform-app.git
cd oc-platform
```

### 3. 启动 Docker 依赖服务

```bash
# 确保 Docker Desktop 已启动
docker compose -f docker-compose.dev.yml up -d
```

这会启动以下服务：

| 服务 | 容器名 | 宿主机端口 | 容器端口 | 用户名 | 密码 |
|------|---------|------------|----------|--------|------|
| PostgreSQL 15 | oc-dev-postgres | **5433** | 5432 | oc_user | 3143285505 |
| Redis 7 | oc-dev-redis | **6380** | 6379 | 无 | 3143285505 |
| MinIO | oc-dev-minio | **9000** | 9000 | minioadmin | minioadmin |

> **重要**: PostgreSQL 端口为 **5433**（非默认 5432），Redis 端口为 **6380**（非默认 6379），MinIO 端口为 **9000**，避免与本地已安装的服务冲突。

验证服务是否正常启动：

```bash
docker compose -f docker-compose.dev.yml ps
# 应看到三个服务状态为 healthy
```

PostgreSQL 启动时会自动执行 `sql/init.sql` 建表和初始化管理员账号。

### 4. 导入种子数据（可选，推荐）

```powershell
# Windows PowerShell:
Get-Content sql/seed.sql | docker exec -i oc-dev-postgres psql -U oc_user -d oc_platform
```

```bash
# Linux / macOS:
docker exec -i oc-dev-postgres psql -U oc_user -d oc_platform < sql/seed.sql
```

导入内容：5 个测试用户 + 6 个分类 + 8 个产品 + 版本 + 评论。

### 5. 启动后端

```powershell
# 方式一：Maven 直接运行（开发时推荐，支持热重载）
mvn spring-boot:run -pl oc-platform-app "-Dspring-boot.run.profiles=dev"

# 方式二：打包后运行
mvn clean package -DskipTests
java -jar oc-platform-app/target/oc-platform-app-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev
```

启动成功后可访问：
- **API 地址**: http://localhost:8081
- **Swagger UI**: http://localhost:8081/swagger-ui.html
- **MinIO Console**: http://localhost:9001

> **注**: 后端端口为 **8081**（非默认 8080），因本机 Apache httpd 占用 8080。

### 6. 启动前端

```powershell
cd oc-platform-web
npm install   # 首次运行时执行
npm run dev
```

启动成功后可访问：
- **前端地址**: http://localhost:5173（如果端口被占用会自动切换到5174）
- Vite 已配置代理 `/api` → `http://localhost:8081`

### 7. 禁用 Mock 数据（可选）

前端默认启用 Mock 拦截器（后端未启动时提供模拟数据）。后端运行时，可创建 `.env.local` 禁用 Mock 以使用真实 API：

```bash
# oc-platform-web/.env.local
VITE_ENABLE_MOCK=false
```

---

## 项目结构

```
oc-platform/
├── oc-platform-common/            # 公共模块（异常、响应格式、工具类、通用配置）
├── oc-platform-user/              # 用户模块（认证、OAuth、用户管理、Spring Security、邮件服务）
├── oc-platform-product/           # 产品模块（产品、版本、分类、下载、更新检查）
├── oc-platform-comment/           # 评论与留言模块（评论 CRUD、评分、点赞）
├── oc-platform-file/              # 文件模块（本地/MinIO 存储、上传、校验）
├── oc-platform-admin/             # 后台管理模块（仪表盘、审核、系统配置、社交链接管理）
├── oc-platform-app/               # 主应用启动模块
│   ├── Dockerfile                 # 后端多阶段构建
│   └── src/main/resources/
│       ├── application.yml        # 主配置
│       └── logback-spring.xml     # 日志配置
├── oc-platform-web/               # 前端项目（React SPA）
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── components/            # 共享组件
│       │   ├── home/              # 首页组件（留言板、信息卡片）
│       │   ├── layout/            # 导航与页脚（含管理后台侧栏）
│       │   ├── AvatarUpload/      # 头像上传
│       │   ├── ThemeProvider/     # 主题上下文
│       │   └── ui/                # Glass 组件
│       ├── layouts/               # 页面布局（MainLayout、AdminLayout）
│       ├── pages/                 # 页面（前台 11 个 + 后台 8 个）
│       │   ├── Admin/             # 后台页面
│       │   │   ├── Categories/
│       │   │   ├── Comments/
│       │   │   ├── Dashboard/
│       │   │   ├── Feedbacks/
│       │   │   ├── Products/
│       │   │   ├── System/
│       │   │   ├── Theme/
│       │   │   └── Users/
│       │   ├── ComingSoon/
│       │   ├── ForgotPassword/
│       │   ├── Home/
│       │   ├── InfoPage/
│       │   ├── Login/
│       │   ├── NotFound/
│       │   ├── OAuthCallback/
│       │   ├── ProductDetail/
│       │   ├── Products/
│       │   ├── Profile/
│       │   └── Register/
│       ├── router/                # 路由配置
│       ├── store/                 # Redux（authSlice + themeSlice + siteConfigSlice）
│       ├── locales/               # 国际化（zh-CN + en-US，支持邮件模板和系统配置）
│       ├── theme/                 # Ant Design 主题
│       └── utils/                 # API 封装 + Axios 实例 + Mock
├── scripts/
│   └── init-minio.ps1             # MinIO 初始化脚本
├── sql/
│   ├── migrations/                # 数据库迁移脚本
│   │   ├── V2__add_minio_fields.sql
│   │   ├── add_site_feedbacks.sql
│   │   ├── add_site_logo.sql
│   │   ├── add_footer_configs.sql
│   │   ├── add_email_and_social_configs.sql
│   │   └── upgrade_site_feedbacks.sql
│   ├── V1.0.3__remove_nickname_column.sql
│   ├── init.sql
│   ├── pg_hba.conf
│   ├── reset-products.sql
│   ├── seed-products.sql
│   └── seed.sql
├── docker-compose.dev.yml         # 开发环境依赖（PostgreSQL + Redis + MinIO）
├── docker-compose.yml             # 生产环境（全栈部署）
├── .env.example                   # 环境变量模板
├── .github/workflows/ci.yml       # CI/CD 流水线
└── pom.xml                        # 父 POM
```

---

## 端口配置

| 服务 | 宿主机端口 | 说明 |
|------|------------|------|
| 后端 API | **8081** | Spring Boot（非默认 8080，因本机 httpd 占用）|
| 前端开发 | **5173** | Vite 开发服务器（可能自动切换到5174）|
| PostgreSQL | **5433** | Docker 容器（映射 5433→5432，避免本地 PG 冲突）|
| Redis | **6380** | Docker 容器（映射 6380→6379，避免本地 Redis 冲突）|
| MinIO | **9000** | 对象存储服务（API）|
| MinIO Console | **9001** | 对象存储管理界面|

---

## 服务密码一览

| 服务 | 用户名 | 密码 | 数据库 |
|------|--------|------|--------|
| PostgreSQL | oc_user | **3143285505** | oc_platform |
| Redis | 无 | **3143285505** | — |
| MinIO | minioadmin | minioadmin | — |

---

## 平台登录账号

| 角色 | 邮箱 | 密码 | 来源 |
|------|------|------|------|
| 超级管理员 | admin@OcPlatform.com | Admin@123456 | init.sql 自动创建 |
| 测试用户 | zhangsan@example.com | Test@123456 | seed.sql 手动导入 |
| 测试用户 | lisi@example.com | Test@123456 | seed.sql 手动导入 |
| 测试用户 | wangwu@example.com | Test@123456 | seed.sql 手动导入 |
| 测试开发者 | chen@example.com | Test@123456 | seed.sql 手动导入 |
| 封禁用户 | banned@example.com | Test@123456 | seed.sql（状态: BANNED）|

---

## 常见问题

### 端口冲突

本项目的 Docker 服务端口故意避开默认端口，以避免与本地已安装的 PostgreSQL、Redis、Apache httpd 冲突：
- PostgreSQL: 5432 → **5433**
- Redis: 6379 → **6380**
- 后端: 8080 → **8081**

如果你的本地没有这些服务冲突，可以在 `docker-compose.dev.yml` 和 `application.yml` 中改回默认端口。

### 重置数据库

```powershell
# 停止并删除数据卷，然后重新创建
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
# 等待 PostgreSQL healthy 后重新导入种子数据
Get-Content sql/seed.sql | docker exec -i oc-dev-postgres psql -U oc_user -d oc_platform
```

---

## 阶段一已完成功能（MVP）

### 后端（Step 1-7）

- [x] **公共模块**: 统一响应 `ApiResponse<T>` / `PageResponse<T>`、全局异常处理、JWT 工具、Redis/Jackson/MyBatis-Plus 配置
- [x] **用户模块**: 邮箱注册/登录、GitHub OAuth、JWT 认证、邮箱验证码、密码找回/重置、个人信息管理、语言偏好、极简工业风邮件模板
- [x] **产品模块**: 产品 CRUD、分类管理、产品列表（分页/筛选/排序）、产品详情、语义化版本管理、多平台支持、灰度发布、**状态过滤（产品中心仅显示PUBLISHED状态）**
- [x] **文件模块**: 文件上传/下载、断点续传、SHA256 校验、MinIO 对象存储
- [x] **评论模块**: 评论 CRUD、评分（1-5 星）、评论点赞、树形回复、回复计数、限流
- [x] **留言模块**: 留言 CRUD、点赞、回复、排序（时间/点赞/回复数）、频率限制、管理后台
- [x] **通知/审计**: 站内通知、审计日志
- [x] **管理后台**: 仪表盘统计、用户管理（封禁/角色）、产品审核、评论管理、分类管理、系统配置、社交链接管理、邮件配置管理、**UI优化（推出按钮、双语支持）**
- [x] **安全体系**: Spring Security + JWT + RBAC（5 角色 17 权限）、登录限流、CORS

### 前端（Step 8-9）

- [x] **基础架构**: Vite + React + TypeScript + Redux Toolkit + React Router (懒加载) + i18n
- [x] **玻璃拟态主题**: Tailwind CSS + CSS 变量实现的高级玻璃拟态效果（背景模糊、半透明、光影）、动态背景支持（图片/视频）
- [x] **前台页面（11 个）**: Home、Products、ProductDetail、Login、Register、ForgotPassword、Profile、OAuthCallback、NotFound、ComingSoon、InfoPage
- [x] **后台页面（8 个）**: Dashboard、Users、Products、Comments、Categories、System、Feedbacks、Theme
- [x] **API 层**: Axios 封装（token 注入 + 401 刷新）、9 个 API 模块、Mock 数据拦截器
- [x] **国际化**: 中文 / 英文完整翻译（支持邮件模板和系统配置）
- [x] **代码质量**: ESLint + TypeScript 严格模式、代码风格统一、类型安全

### 部署（Step 10）

- [x] **Docker**: 后端多阶段 Dockerfile、前端 Dockerfile + Nginx、docker-compose.yml（生产全栈）
- [x] **CI/CD**: GitHub Actions 流水线（构建 + 测试 + Docker + 部署）
- [x] **配置**: .env.example、.dockerignore、docker-compose.dev.yml

### 数据库

- [x] **28 张表**: 用户、角色、权限、OAuth 绑定、邮箱验证、产品、版本、增量更新、分类、评论、点赞、留言、留言点赞、订单（占位）、订阅（占位）、通知、下载记录（分区）、访问日志（分区）、系统配置、文件记录、审计日志、多语言、邮件配置、社交链接配置
- [x] **索引**: GIN (tags)、部分索引 (is_latest)、复合索引
- [x] **触发器**: updated_at 自动更新
- [x] **种子数据**: 5 用户 + 6 分类 + 8 产品 + 版本 + 评论

---

## 阶段一待完成内容

- [x] 前后端联调（Mock → 真实 API 对接，可通过 VITE_ENABLE_MOCK=false 切换）
- [x] 邮件服务配置（QQ邮箱SMTP真实发送、专业HTML邮件模板、系统配置集成）
- [x] 文件上传功能（支持多格式、圆形裁剪）
- [x] 修改邮箱功能（验证码发送到新邮箱）
- [x] 产品截图上传和显示功能
- [x] 文件下载功能（支持LOCAL和MINIO存储类型）
- [x] 评论回复功能（带回复按钮和@用户功能）
- [x] 评论排序功能（时间/点赞数/回复数）
- [x] 评论限流功能（60秒内只能发布一条）
- [x] 管理后台UI统一（搜索框高度、国际化）
- [x] 留言板功能（首页留言、回复、点赞、排序、频率限制）
- [x] 留言管理后台（分页、状态管理、搜索、删除）
- [x] 站点Logo配置功能（上传、裁剪、显示）
- [x] 验证码邮件模板升级（专业HTML设计、双语支持、系统配置同步）
- [x] 社交链接配置管理（GitHub、Twitter、LinkedIn、微博、微信、邮箱）
- [x] 系统配置扩展（官网URL、邮件发件人、版权信息、备案信息）
- [ ] 文件上传/下载端到端测试
- [ ] 单元测试编写（前端 Jest + 后端 JUnit 5）
- [ ] 响应式设计优化（移动端适配）
- [ ] SEO 优化（react-helmet-async Meta 标签）
- [ ] 性能优化（代码分割、图片压缩、Bundle 分析）
- [ ] 腾讯云 CVM 部署上线

---

## 未来阶段规划

### 阶段二：微服务架构

- 微信/QQ OAuth 登录
- 微信/支付宝支付 + 订单系统
- VIP 会员订阅
- Spring Cloud 微服务拆分（文件服务 → 用户服务 → 支付服务 → 产品服务 → 通知服务 → 统计服务）
- Spring Cloud Gateway API 网关
- Nacos 注册中心
- Elasticsearch 全文搜索
- 腾讯云 COS 文件存储 + CDN
- RabbitMQ 消息队列
- Redis 哨兵模式
- ELK 日志系统
- SkyWalking 链路追踪

### 阶段三：规模化

- Kubernetes 容器编排
- 多地域部署
- 数据库读写分离
- 分布式缓存集群
- 全链路压测

---

## 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 架构文档 | `Planning Document/Architecture Document.md` | 完整技术架构设计 |
| 阶段一设计 | `Planning Document/Phase One.md` | MVP 详细设计文档 |
| 设计系统 | `src/design-system/MASTER.md` | Glassmorphism 设计规范 |
| 项目记忆 | `../Memory/` | AI 辅助开发记忆系统（位于上级目录）|
| AI技能 | `../.windsurf/skills/` | Windsurf AI 技能文件 |
| AI工作流 | `../.windsurf/workflows/` | Windsurf AI 工作流 |
| 代码规范 | `.windsurf/rules/` | 前后端代码规范 |
| 前端测试素材 | `Front-end testing/` | 背景图片/视频 |

---

## License

Private

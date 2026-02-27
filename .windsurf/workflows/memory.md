---
description: 项目记忆系统 — 在需要定位项目相关内容或在开发/修改后更新项目记忆时触发
---

# 项目记忆技能 (Project Memory Skill)

## 概述

本工作流管理两类持久化信息：
1. **项目记忆 (Memory/)** — 项目架构、API、数据库等静态知识
2. **AI 工作日志 (Memory/WorkLogs/)** — 每次对话的操作记录

---

## 一、项目记忆

### 1.1 读取记忆（开发前/定位时）

当需要定位或了解以下项目内容时，**先查阅 `Memory/` 目录下的对应文件**：

- **前端相关** → 读取 `Memory/Frontend/` 下的文件
  - `architecture.md` — 技术栈、目录结构、路由、状态管理
  - `pages.md` — 页面清单与功能描述
  - `theme.md` — 主题系统（CSS 变量、Ant Design Token、动态主题）

- **后端相关** → 读取 `Memory/Backend/` 下的文件
  - `architecture.md` — 模块划分、包结构、配置
  - `api.md` — API 接口清单与状态
  - `security.md` — 安全体系（JWT、RBAC、Spring Security）

- **数据库相关** → 读取 `Memory/Database/` 下的文件
  - `schema.md` — 表结构、索引、初始数据

- **测试相关** → 读取 `Memory/Testing/` 下的文件
  - `status.md` — 测试状态、覆盖率、已知问题/Bug

- **部署/运维相关** → 读取 `Memory/DevOps/` 下的文件
  - `deployment.md` — Docker、CI/CD、环境配置

- **总览/索引** → 读取 `Memory/README.md`

### 1.2 更新记忆（开发后/修改后）

在对项目进行以下操作后，**必须同步更新 `Memory/` 目录下的对应文件**：

1. **新增/修改前端页面或组件** → 更新 `Memory/Frontend/pages.md` 和/或 `architecture.md`
2. **修改主题/样式** → 更新 `Memory/Frontend/theme.md`
3. **新增/修改后端 API** → 更新 `Memory/Backend/api.md`
4. **修改后端架构/模块** → 更新 `Memory/Backend/architecture.md`
5. **修改安全配置** → 更新 `Memory/Backend/security.md`
6. **修改数据库表结构** → 更新 `Memory/Database/schema.md`
7. **修复 Bug** → 在 `Memory/Testing/status.md` 的"已知问题与 Bug"表格中更新状态
8. **新增/修改测试** → 更新 `Memory/Testing/status.md`
9. **修改部署配置** → 更新 `Memory/DevOps/deployment.md`

### 1.3 执行步骤

#### 读取流程

1. 确认需要查阅的领域（前端/后端/数据库/测试/部署）
2. 使用 `read_file` 工具读取 `Memory/` 下对应的 `.md` 文件
3. 如需更详细信息，参考关联文档：
   - `Planning Document/Architecture Document.md` — 完整架构文档
   - `Planning Document/Phase One.md` — 阶段一设计文档
   - `Planning Document/主题设计.md` — 主题设计规范

#### 更新流程

1. 完成开发/修改工作后，确认影响的领域
2. 使用 `read_file` 读取对应的记忆文件当前内容
3. 使用 `edit` 或 `multi_edit` 更新受影响的部分
4. 更新文件顶部的 `最后更新` 日期
5. 如果新增了全新的技术领域或模块，在 `Memory/README.md` 中更新目录结构

#### Memory 目录不存在时

如果 `Memory/` 目录或其子目录/文件不存在，按以下结构创建：

```
Memory/
├── README.md
├── Frontend/
│   ├── architecture.md
│   ├── pages.md
│   └── theme.md
├── Backend/
│   ├── architecture.md
│   ├── api.md
│   └── security.md
├── Database/
│   └── schema.md
├── Testing/
│   └── status.md
└── DevOps/
    └── deployment.md
```

然后根据项目当前状态填充内容。

---

## 二、AI 工作日志

### 2.1 目的

记录每次 AI 对话中执行的所有操作，便于：
- 追溯历史变更
- 复盘问题排查
- 团队协作了解改动

### 2.2 存放位置

```
Memory/
└── WorkLogs/
    ├── 2026-02-21_2010_功能描述.md
    ├── 2026-02-20_1430_修复登录Bug.md
    └── ...
```

### 2.3 文件命名规范

```
YYYY-MM-DD_HHmm_<简短描述>.md
```

| 组成部分 | 格式 | 示例 |
|---------|------|------|
| 日期 | `YYYY-MM-DD` | `2026-02-21` |
| 时间 | `HHmm` (24小时制) | `2010` |
| 描述 | 中文/英文，2-6个字 | `添加用户头像`、`FixLoginBug` |

**示例文件名：**
- `2026-02-21_2010_完善记忆工作流.md`
- `2026-02-20_0930_修复产品列表分页.md`

### 2.4 文件内容模板

```markdown
# AI 工作日志

- **日期**: YYYY-MM-DD HH:mm
- **任务摘要**: 一句话描述本次对话的主要任务
- **触发方式**: 用户请求 / 自动触发

---

## 执行操作

### 终端命令

| 序号 | 命令 | 工作目录 | 结果 |
|------|------|----------|------|
| 1 | `npm install xxx` | `qt-platform-web/` | ✅ 成功 |
| 2 | `mvn clean compile` | `qt-platform/` | ❌ 失败 (原因) |

### 文件修改

| 序号 | 操作 | 文件路径 | 说明 |
|------|------|----------|------|
| 1 | 修改 | `src/pages/Home.tsx` | 添加产品展示区块 |
| 2 | 创建 | `src/components/Avatar/index.tsx` | 新建头像组件 |
| 3 | 删除 | `src/utils/deprecated.ts` | 移除废弃工具函数 |

### 代码变更摘要

> 对关键代码变更的简要说明（可选）

- `Home.tsx`: 新增 `ProductShowcase` 组件引用，添加 useEffect 获取精选产品
- `Avatar/index.tsx`: 实现圆形裁剪、多格式支持、5MB 大小限制

---

## 结果与状态

- **完成状态**: ✅ 全部完成 / ⚠️ 部分完成 / ❌ 未完成
- **构建验证**: `npm run build` ✅ / `mvn package` ✅
- **遗留问题**: 无 / 列出待处理事项

---

## 关联记忆更新

- [x] `Memory/Frontend/pages.md` — 更新页面清单
- [ ] `Memory/Backend/api.md` — 无需更新
```

### 2.5 触发时机

**在以下情况下创建工作日志：**

1. **对话开始时** — 如果预计会执行多个操作（代码修改、命令执行等）
2. **对话结束前** — 汇总本次对话的所有操作

**不需要创建工作日志的情况：**

- 仅回答问题，无实际操作
- 仅读取文件查看内容
- 简单的单次小修改（如修复一个 typo）

### 2.6 执行流程

```
// turbo
1. 检查 `Memory/WorkLogs/` 目录是否存在，不存在则创建
2. 清理超过30天的旧日志文件
```

3. 根据当前时间和任务生成文件名
4. 使用 `write_to_file` 创建日志文件
5. 在对话过程中持续记录操作
6. 对话结束前更新"结果与状态"部分
7. 更新相关的项目记忆文件

### 2.7 日志清理策略

- 保留最近 **30 天** 的日志文件
- 超过 30 天的日志自动清理（使用 `Get-ChildItem | Where-Object | Remove-Item`）
- 重要日志可移动到 `Memory/WorkLogs/Archive/` 长期保留
- 每次对话开始时检查并清理过期日志

---

## 三、注意事项

### 项目记忆

- 记忆文件使用 Markdown 格式，保持简洁清晰
- 每次更新必须修改文件顶部的 `最后更新` 日期
- 表格形式优先，便于快速查阅
- 不要在记忆文件中存储敏感信息（密码、密钥等仅记录占位符）
- Bug 记录使用递增 ID，修复后标记状态为"已修复"而非删除

### AI 工作日志

- 日志文件一旦创建不要删除（保留历史追溯能力）
- 操作记录应**实时更新**，不要等到对话结束才补充
- 文件路径使用相对于项目根目录的路径
- 命令结果只记录成功/失败和关键错误信息，不记录完整输出
- 代码变更摘要关注"做了什么"而非"怎么做的"

---

## 四、目录结构总览

```
Memory/
├── README.md                 # 项目记忆索引
├── Frontend/
│   ├── architecture.md       # 前端架构（React + Vite + TypeScript）
│   ├── pages.md              # 页面清单与功能描述
│   └── theme.md              # Glassmorphism 主题系统
├── Backend/
│   ├── architecture.md       # 后端架构（Spring Boot 多模块）
│   ├── api.md                # API 接口清单与状态
│   └── security.md           # 安全体系（JWT + RBAC）
├── Database/
│   └── schema.md             # 数据库结构（PostgreSQL 28张表）
├── Testing/
│   └── status.md             # 测试状态与已知问题
├── DevOps/
│   └── deployment.md         # 部署配置（Docker + CI/CD）
└── WorkLogs/                 # AI 工作日志
    ├── Archive/              # 归档日志（重要日志长期保存）
    └── YYYY-MM-DD_HMMM_描述.md # 30天内日志自动清理
```

## 五、项目当前状态（2026-02-27）

### 已完成的核心功能
- ✅ **用户认证系统**: JWT + RBAC + OAuth2
- ✅ **邮箱验证**: QQ SMTP 真实发送
- ✅ **头像上传**: 多格式支持、圆形裁剪
- ✅ **修改邮箱**: 验证码发送到新邮箱
- ✅ **主题系统**: Glassmorphism + 动态主题
- ✅ **国际化**: 中英双语支持
- ✅ **管理后台**: 完整的 CRUD 操作
- ✅ **响应式布局**: 移动端适配

### 技术栈版本
- **前端**: React 18 + Vite 5 + TypeScript + Ant Design 5
- **后端**: Spring Boot 3.2.12 + Java 17 + MyBatis-Plus
- **数据库**: PostgreSQL 15 + Redis 7
- **容器化**: Docker + Docker Compose

### 端口配置
- **前端**: 5173（可能自动切换到5174）
- **后端**: 8081（避免与Apache httpd冲突）
- **PostgreSQL**: 5433（Docker映射 5433→5432）
- **Redis**: 6380（Docker映射 6380→6379）

### 数据库状态
- **表数量**: 28张（用户、产品、评论、通知等）
- **索引优化**: GIN索引、部分索引、复合索引
- **触发器**: updated_at 自动更新
- **种子数据**: 完整的测试数据集

---
description: Git 分支策略
scope: project
trigger: always_on
---

# Git 分支策略规则

## 分支结构

```
main            ← 生产环境，仅接受 release 和 hotfix 合并
  │
  ├── develop   ← 开发主分支，接受 feature 合并
  │     │
  │     ├── feature/user-auth
  │     ├── feature/product-list
  │     └── feature/admin-panel
  │
  ├── release/1.0.0
  │
  ├── hotfix/fix-login-bug
  │
  └── workspace-config ← 开发环境配置分支，保存根目录配置文件
```

## 分支命名规范

- **main**: 生产环境分支，保护分支，禁止直接推送
- **develop**: 开发主分支，集成所有功能分支
- **feature/***: 功能分支，命名格式 `feature/功能描述`
- **release/***: 发布分支，命名格式 `release/版本号`
- **hotfix/***: 热修复分支，命名格式 `hotfix/问题描述`
- **workspace-config**: 开发环境配置分支，保存根目录配置和开发过程状态

## 分支合并规则

1. **feature** → **develop**: 功能完成后合并到开发分支
2. **develop** → **release**: 准备发布时创建发布分支
3. **release** → **main**: 测试通过后合并到生产分支
4. **hotfix** → **main**: 紧急修复直接合并到生产分支
5. **hotfix** → **develop**: 热修复也需要同步到开发分支
6. **workspace-config** → **main**: 配置更新可定期同步到生产分支

## workspace-config 分支说明

### 分支用途
`workspace-config` 分支专门用于保存和管理开发环境的完整配置状态，包括：

#### 📁 保存的文件类型
`workspace-config` 分支仅保存以下核心配置目录：

- **.trae/**: Trae AI 配置和技能文件
- **.windsurf/**: Windsurf AI 配置、规则、技能和工作流文件
- **Memory/**: 项目记忆系统（后端、前端、数据库、运维、测试记忆）
- **Planning Document/**: 计划文档（架构文档、阶段设计、主题设计）

#### 🚫 文件限制策略
为保持分支轻量和高效，以下文件类型将被排除：

- **视频文件**: `*.mp4`, `*.avi`, `*.mov`, `*.mkv`, `*.flv`
- **大文件**: 超过 10MB 的文件
- **临时文件**: `*.tmp`, `*.log`, `*.cache`
- **依赖文件**: `node_modules/`, `.git/`, `target/`, `dist/`
- **IDE缓存**: `.vscode/`, `.idea/` 的缓存文件
- **系统文件**: `*.DS_Store`, `Thumbs.db`

#### 🔄 更新策略
- **定期同步**: 每次重要配置变更后推送到此分支
- **版本标记**: 使用标签标记重要的配置版本
- **独立管理**: 不参与常规的功能开发流程
- **备份保护**: 作为开发环境状态的完整备份
- **增量更新**: 仅同步变更的配置文件，避免重复推送
- **大小监控**: 定期检查分支大小，保持在合理范围内

#### 🚀 使用场景
- **环境恢复**: 快速恢复完整的开发环境配置
- **配置共享**: 在不同设备间同步开发环境
- **团队协作**: 统一团队的开发规则和工具配置
- **历史追踪**: 追踪开发环境的演进过程

#### 📋 维护命令
```bash
# 创建 workspace-config 分支
git checkout -b workspace-config

# 添加核心配置目录（自动排除大文件）
git add .trae/ .windsurf/ Memory/ "Planning Document/"

# 检查文件大小（可选）
find .trae/ .windsurf/ Memory/ "Planning Document/" -type f -size +10M -ls

# 提交配置更新
git commit -m "chore(config): 更新开发环境配置"

# 推送到远程
git push origin workspace-config

# 创建配置版本标签
git tag -a v-config-2026.02.27 -m "开发环境配置版本 2026.02.27"
git push origin v-config-2026.02.27
```

#### 🔧 可维护性设计

##### 配置文件清单
创建 `.workspace-config` 文件来管理需要同步的目录：
```yaml
# workspace-config 配置清单
directories:
  - .trae/
  - .windsurf/
  - Memory/
  - "Planning Document/"

exclude_patterns:
  - "*.mp4"
  - "*.avi"
  - "*.mov"
  - "*.mkv"
  - "*.flv"
  - "node_modules/"
  - ".git/"
  - "target/"
  - "dist/"
  - "*.tmp"
  - "*.log"
  - "*.cache"

max_file_size: 10MB
```

##### 自动化脚本
创建 `sync-workspace-config.sh` 脚本：
```bash
#!/bin/bash
# 同步 workspace-config 分支脚本

# 读取配置清单
if [ -f ".workspace-config" ]; then
  echo "使用配置清单同步"
  # 根据配置文件同步
else
  echo "使用默认配置同步"
  git add .trae/ .windsurf/ Memory/ "Planning Document/"
fi

# 检查大文件
echo "检查大文件..."
find .trae/ .windsurf/ Memory/ "Planning Document/" -type f -size +10M -exec echo "发现大文件: {}" \;

# 提交和推送
git commit -m "chore(config): 自动同步开发环境配置"
git push origin workspace-config
```

## 分支保护

- main 分支启用分支保护
- require pull request reviews
- require status checks to pass before merging
- include administrators

## 提交规范

使用 Conventional Commits 规范：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建或辅助工具变动

## 项目结构

### Qt Platform 项目结构
```
qt-platform/
├── qt-platform-web/          # 前端项目（React + Vite）
├── qt-platform-user/         # 用户模块
├── qt-platform-product/      # 产品模块
├── qt-platform-comment/      # 评论模块
├── qt-platform-file/         # 文件模块
├── qt-platform-notification/ # 通知模块
├── qt-platform-admin/        # 管理后台模块
├── qt-platform-app/           # 应用启动模块
├── qt-platform-common/        # 公共模块
├── sql/                       # 数据库脚本
└── docker-compose.dev.yml    # 开发环境配置
```

### 开发环境根目录结构 (E:\oc)
```
E:/oc/
├── .trae/                     # Trae AI 配置
│   ├── documents/            # 文档文件
│   ├── rules/                 # 规则文件
│   └── skills/                # 技能文件
├── .windsurf/                 # Windsurf AI 配置
│   ├── rules/                 # 开发规则文件
│   ├── skills/                # AI 技能文件
│   └── workflows/             # 工作流文件
├── Memory/                    # 项目记忆系统
│   ├── Backend/               # 后端记忆
│   ├── Frontend/              # 前端记忆
│   ├── Database/              # 数据库记忆
│   ├── DevOps/                # 运维记忆
│   ├── Testing/               # 测试记忆
│   └── WorkLogs/              # 工作日志
├── Planning Document/         # 计划文档
│   ├── Architecture Document.md
│   ├── Phase One.md
│   └── 主题设计.md
├── Front-end testing/         # 前端测试素材（不同步）
│   ├── Background material/
│   └── PFP/
├── qt-platform/              # 主项目目录
├── node_modules/             # Node.js 依赖（不同步）
├── package.json              # 根包配置
└── package-lock.json         # 依赖锁定文件
```

#### 📊 workspace-config 分支覆盖范围
| 目录 | 说明 | 同步状态 | 备注 |
|------|------|----------|------|
| `.trae/` | Trae AI 配置 | ✅ 同步 | 包含技能和规则 |
| `.windsurf/` | Windsurf AI 配置 | ✅ 同步 | 包含规则、技能、工作流 |
| `Memory/` | 项目记忆系统 | ✅ 同步 | 排除大文件和临时文件 |
| `Planning Document/` | 计划文档 | ✅ 同步 | 架构和设计文档 |
| `Front-end testing/` | 测试素材 | ❌ 不同步 | 包含大文件 |
| `node_modules/` | 依赖文件 | ❌ 不同步 | 可重新安装 |
| `qt-platform/` | 项目代码 | ❌ 不同步 | 独立管理 |

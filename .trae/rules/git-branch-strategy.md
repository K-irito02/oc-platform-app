---
alwaysApply: true
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
  └── hotfix/fix-login-bug
```

## 分支命名规范

- **main**: 生产环境分支，保护分支，禁止直接推送
- **develop**: 开发主分支，集成所有功能分支
- **feature/***: 功能分支，命名格式 `feature/功能描述`
- **release/***: 发布分支，命名格式 `release/版本号`
- **hotfix/***: 热修复分支，命名格式 `hotfix/问题描述`

## 分支合并规则

1. **feature** → **develop**: 功能完成后合并到开发分支
2. **develop** → **release**: 准备发布时创建发布分支
3. **release** → **main**: 测试通过后合并到生产分支
4. **hotfix** → **main**: 紧急修复直接合并到生产分支
5. **hotfix** → **develop**: 热修复也需要同步到开发分支

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

---
description: 前端代码规范
scope: project
trigger: always_on
---

# 前端代码规范

## 代码规范

- **ESLint**: 使用 Airbnb 规则集
  - 扩展配置：@typescript-eslint/recommended
  - React Hooks 规则：react-hooks/rules-of-hooks
  - 无障碍检查：jsx-a11y/recommended
  - 自定义规则：项目特定规范

## 代码格式化

- **Prettier**: 统一代码格式
  - 单行长度：100 字符
  - 使用单引号
  - 尾部分号：不添加
  - 对象尾随逗号：ES5 兼容
  - JSX 括号：多行时添加

## 类型检查

- **TypeScript**: strict mode 严格模式
  - 启用所有严格检查
  - 禁止隐式 any
  - 禁止未使用的变量
  - 严格的 null 检查
  - 函数返回类型必须声明

## 提交检查

- **Husky + lint-staged**: 提交前检查
  - ESLint 自动修复
  - Prettier 格式化
  - TypeScript 类型检查
  - 测试通过检查
  - 提交信息规范检查

## 提交规范

- **Conventional Commits**: 标准化提交信息
  ```
  <type>[optional scope]: <description>
  
  [optional body]
  
  [optional footer(s)]
  ```
  
  **类型说明：**
  - `feat`: 新功能
  - `fix`: 修复 bug
  - `docs`: 文档更新
  - `style`: 代码格式调整
  - `refactor`: 重构
  - `test`: 测试相关
  - `chore`: 构建或辅助工具变动
  - `perf`: 性能优化
  - `ci`: CI/CD 相关

## 组件规范

1. **命名规范**
   - 组件文件：PascalCase.tsx
   - 组件名：PascalCase
   - Props 接口：ComponentNameProps
   - 常量：UPPER_SNAKE_CASE
   - 变量/函数：camelCase

2. **文件结构**
   ```
   ComponentName/
   ├── index.tsx          // 组件主文件
   ├── ComponentName.tsx  // 组件实现
   ├── ComponentName.styles.ts // 样式文件
   ├── ComponentName.test.tsx  // 测试文件
   └── types.ts           // 类型定义
   ```

3. **React Hooks 规范**
   - Hook 名以 use 开头
   - 自定义 Hook 放在 hooks/ 目录
   - 遵循 Hooks 使用规则
   - 合理使用依赖数组

4. **状态管理**
   - Redux Toolkit 标准模式
   - 异步操作使用 createAsyncThunk
   - 正常化数据结构
   - 避免直接修改 state

## 性能优化

- 使用 React.memo 防止不必要重渲染
- 合理使用 useMemo 和 useCallback
- 代码分割和懒加载
- 图片优化和压缩
- Bundle 分析和优化

## 样式规范

- CSS Modules 避免样式冲突
- Ant Design Token 统一主题变量
- 响应式设计原则
- 移动端优先适配
- 避免内联样式

## 测试规范

- Jest + React Testing Library
- 单元测试覆盖率 ≥ 80%
- 集成测试关键用户流程
- 快照测试 UI 组件
- 可访问性测试

## 环境配置

- **开发端口**: 5173（可能自动切换到5174）
- **后端API**: http://localhost:8081/api/v1
- **构建工具**: Vite 5.x
- **代理配置**: Vite代理 /api → http://localhost:8081

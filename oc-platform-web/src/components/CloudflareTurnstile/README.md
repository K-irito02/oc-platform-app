# CloudflareTurnstile 组件使用指南

## 概述

CloudflareTurnstile 是 Cloudflare 提供的智能验证码解决方案，用于替代腾讯验证码。它提供了更好的用户体验和隐私保护。

## 组件特性

- ✅ 自动加载 Cloudflare Turnstile SDK
- ✅ 支持主题切换（light/dark/auto）
- ✅ 支持多语言（zh-CN/en-US）
- ✅ 支持多种尺寸（normal/compact）
- ✅ 完整的 TypeScript 类型支持
- ✅ 自动重置和管理 widget 生命周期

## 基本用法

### 1. 在表单中使用

```tsx
import { useState } from 'react';
import { CloudflareTurnstile } from '@/components/CloudflareTurnstile';
import { useCaptcha } from '@/hooks/useCaptcha';

export function LoginForm() {
  const [formData, setFormData] = useState({
    account: '',
    password: ''
  });
  const { token, reset, loading, error } = useCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      message.error('请先完成验证');
      return;
    }

    try {
      await authApi.login({
        account: formData.account,
        password: formData.password,
        captchaToken: token
      });
      message.success('登录成功');
    } catch (error) {
      reset(); // 重置验证码
      message.error('登录失败');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.account}
        onChange={(e) => setFormData({...formData, account: e.target.value})}
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />
      
      {/* Cloudflare Turnstile 验证码 */}
      <CloudflareTurnstile
        siteKey="0x4AAAAAACnWLahpCdkdO4qv"
        onVerify={(token) => {
          console.log('验证成功:', token);
        }}
        onError={(error) => {
          console.error('验证失败:', error);
        }}
        theme="auto"
        lang="zh-CN"
      />
      
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

### 2. 配合 useCaptcha Hook 使用

```tsx
import { useRef } from 'react';
import { CloudflareTurnstile } from '@/components/CloudflareTurnstile';
import { useCaptcha } from '@/hooks/useCaptcha';

export function RegisterForm() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { token, verify, reset, loading, error, setContainerRef } = useCaptcha();

  const handleSubmit = async () => {
    try {
      // 等待用户完成验证
      const captchaToken = await verify();
      
      // 提交表单
      await authApi.register({
        ...formData,
        captchaToken
      });
    } catch (error) {
      reset();
    }
  };

  return (
    <div>
      {/* 表单字段 */}
      
      <div ref={(ref) => setContainerRef(ref)}>
        <CloudflareTurnstile
          siteKey="0x4AAAAAACnWLahpCdkdO4qv"
          onVerify={(token) => {
            // 自动调用全局回调
            if ((window as any).__turnstileVerifyCallback) {
              (window as any).__turnstileVerifyCallback(token);
            }
          }}
          onError={(error) => {
            if ((window as any).__turnstileErrorCallback) {
              (window as any).__turnstileErrorCallback(error);
            }
          }}
          onExpire={() => {
            console.log('验证码已过期');
          }}
          theme="auto"
          lang="zh-CN"
        />
      </div>
      
      <button onClick={handleSubmit} disabled={loading}>
        注册
      </button>
    </div>
  );
}
```

### 3. 在暗色主题中使用

```tsx
<CloudflareTurnstile
  siteKey="0x4AAAAAACnWLahpCdkdO4qv"
  onVerify={handleVerify}
  theme="dark"  // 强制使用暗色主题
  lang="en-US"  // 英文界面
  size="compact"  // 紧凑尺寸
/>
```

## API 文档

### CloudflareTurnstile Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| siteKey | string | 是 | - | Cloudflare Turnstile Site Key |
| onVerify | (token: string) => void | 是 | - | 验证成功回调，返回 token |
| onError | (error: string) => void | 否 | - | 验证失败回调 |
| onExpire | () => void | 否 | - | 验证码过期回调 |
| theme | 'light' \| 'dark' \| 'auto' | 否 | 'auto' | 主题模式 |
| size | 'normal' \| 'compact' | 否 | 'normal' | 组件尺寸 |
| lang | 'zh-CN' \| 'en-US' | 否 | 'zh-CN' | 语言设置 |
| className | string | 否 | '' | 自定义样式类名 |

### useCaptcha Hook

```typescript
interface UseCaptchaReturn {
  token: string | null;           // 当前验证 token
  verify: () => Promise<string>;  // 执行验证并返回 token
  reset: () => void;              // 重置验证码
  loading: boolean;               // 加载状态
  error: string | null;           // 错误信息
  verifyToken: (scene: string) => Promise<boolean>;  // 验证 token 到后端
  setContainerRef: (ref: HTMLDivElement | null) => void;  // 设置容器引用
}
```

## 迁移指南

### 从 TencentCaptcha 迁移

#### 1. 更新导入

```tsx
// 旧代码
import { TencentCaptcha } from '@/components/TencentCaptcha';

// 新代码
import { CloudflareTurnstile } from '@/components/CloudflareTurnstile';
```

#### 2. 更新组件使用

```tsx
// 旧代码
<TencentCaptcha
  appId={appId}
  visible={captchaVisible}
  onVerify={(ticket, randstr) => {
    // 处理验证结果
  }}
  onClose={() => setCaptchaVisible(false)}
/>

// 新代码
<CloudflareTurnstile
  siteKey="0x4AAAAAACnWLahpCdkdO4qv"
  onVerify={(token) => {
    // 处理验证结果
  }}
  onError={(error) => {
    // 处理错误
  }}
  theme="auto"
  lang="zh-CN"
/>
```

#### 3. 更新 API 调用

```tsx
// 旧代码
await authApi.login({
  account,
  password,
  captchaTicket: ticket,
  captchaRandstr: randstr
});

// 新代码
await authApi.login({
  account,
  password,
  captchaToken: token  // 只需要一个 token
});
```

#### 4. 更新后端接口

后端需要更新验证接口：

```typescript
// 旧接口
POST /api/v1/captcha/verify
{
  "ticket": "string",
  "randstr": "string",
  "scene": "string"
}

// 新接口
POST /api/v1/captcha/verify
{
  "token": "string",  // Cloudflare Turnstile token
  "scene": "string"
}
```

## 注意事项

1. **Site Key**: 当前使用的 Site Key 是 `0x4AAAAAACnWLahpCdkdO4qv`
2. **自动主题**: 使用 `theme="auto"` 可以自动跟随系统主题
3. **验证流程**: Cloudflare Turnstile 会在用户交互时自动验证，无需额外触发
4. **Token 有效期**: Token 有效期约为 5 分钟，过期后会自动触发 `onExpire` 回调
5. **安全性**: Token 应该在后端进行二次验证，不要仅依赖前端验证

## 故障排查

### SDK 加载失败

如果 SDK 加载失败，检查：
- 网络连接是否正常
- 是否被防火墙或广告拦截器阻止
- 域名是否在 Cloudflare 白名单中

### 验证失败

如果验证失败，检查：
- Site Key 是否正确
- 后端 Secret Key 是否配置正确
- 是否在正确的域名下使用

### 主题不匹配

如果主题不匹配，尝试：
- 使用 `theme="light"` 或 `theme="dark"` 强制指定主题
- 检查 CSS 是否覆盖了组件样式

## 相关链接

- [Cloudflare Turnstile 官方文档](https://developers.cloudflare.com/turnstile/)
- [Cloudflare Turnstile Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)

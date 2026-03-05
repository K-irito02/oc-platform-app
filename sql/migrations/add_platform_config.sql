-- 插入平台配置
INSERT INTO system_configs (config_key, config_value, description, updated_at)
VALUES (
  'platform_config',
  '{
    "platforms": [
      {
        "value": "WINDOWS",
        "label": "Windows",
        "labelEn": "Windows",
        "icon": "🪟",
        "architectures": ["x86", "x64", "arm64"],
        "enabled": true,
        "sortOrder": 1
      },
      {
        "value": "MACOS",
        "label": "macOS",
        "labelEn": "macOS",
        "icon": "🍎",
        "architectures": ["x64", "arm64", "universal"],
        "enabled": true,
        "sortOrder": 2
      },
      {
        "value": "LINUX",
        "label": "Linux",
        "labelEn": "Linux",
        "icon": "🐧",
        "architectures": ["x86", "x64", "arm64"],
        "enabled": true,
        "sortOrder": 3
      },
      {
        "value": "ANDROID",
        "label": "Android",
        "labelEn": "Android",
        "icon": "🤖",
        "architectures": ["arm64", "x86", "x64"],
        "enabled": true,
        "sortOrder": 4
      },
      {
        "value": "IOS",
        "label": "iOS",
        "labelEn": "iOS",
        "icon": "📱",
        "architectures": ["arm64", "x64"],
        "enabled": true,
        "sortOrder": 5
      },
      {
        "value": "WEB",
        "label": "Web",
        "labelEn": "Web",
        "icon": "🌐",
        "architectures": ["universal"],
        "enabled": true,
        "sortOrder": 6
      },
      {
        "value": "CROSS_PLATFORM",
        "label": "跨平台",
        "labelEn": "Cross Platform",
        "icon": "🔄",
        "architectures": ["universal"],
        "enabled": true,
        "sortOrder": 7
      }
    ],
    "architectures": [
      {"value": "x86", "label": "x86 (32位)", "labelEn": "x86 (32-bit)"},
      {"value": "x64", "label": "x64 (64位)", "labelEn": "x64 (64-bit)"},
      {"value": "arm64", "label": "ARM64", "labelEn": "ARM64"},
      {"value": "universal", "label": "通用", "labelEn": "Universal"}
    ],
    "allowCustomPlatform": true,
    "allowCustomArchitecture": true
  }',
  '平台和架构配置',
  NOW()
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

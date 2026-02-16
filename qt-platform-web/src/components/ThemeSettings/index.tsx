import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Image, Video, Palette, Save, RotateCcw } from 'lucide-react';
import { Drawer, Slider, Input, Button, ColorPicker, Upload as AntUpload, Select, Space, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUserConfig, setSystemConfig, resetTheme, ThemeConfig } from '@/store/slices/themeSlice';
import { adminApi, userApi } from '@/utils/api';
import { GlassButton } from '@/components/ui/GlassButton';
import type { Color } from 'antd/es/color-picker';

const FONT_OPTIONS = [
  { label: '马善政楷书', value: '"Ma Shan Zheng", cursive' },
  { label: '思源宋体', value: '"Noto Serif SC", serif' },
  { label: '霞鹜文楷', value: '"LXGW WenKai", cursive' },
  { label: '站酷仓耳渔阳体', value: '"ZCOOL XiaoWei", serif' },
  { label: '行书', value: '"Zhi Mang Xing", cursive' },
  { label: '草书', value: '"Liu Jian Mao Cao", cursive' },
  { label: '龙藏体', value: '"Long Cang", cursive' },
  { label: '系统默认', value: 'system-ui, sans-serif' },
];

interface ThemeSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { currentTheme, userConfig } = useAppSelector((state) => state.theme);
  const { user } = useAppSelector((state) => state.auth);
  
  const isAdmin = user?.roles?.some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r));
  const [activeTab, setActiveTab] = useState<'background' | 'appearance'>('background');
  const [saving, setSaving] = useState(false);

  const handleBackgroundChange = (key: keyof ThemeConfig['background'], value: any) => {
    const newConfig = {
      ...userConfig,
      background: {
        ...currentTheme.background,
        ...userConfig?.background,
        [key]: value
      }
    };
    dispatch(setUserConfig(newConfig));
  };

  const handleAppearanceChange = (key: keyof ThemeConfig['appearance'], value: any) => {
    const newConfig = {
      ...userConfig,
      appearance: {
        ...currentTheme.appearance,
        ...userConfig?.appearance,
        [key]: value
      }
    };
    dispatch(setUserConfig(newConfig));
  };

  const handleFileUpload = (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    handleBackgroundChange('url', blobUrl);
    message.success(`${file.name} ${t('theme.bgUpload')}`);
    return false;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const themeConfig = {
        background: currentTheme.background,
        ink: {
          primaryColor: currentTheme.appearance.primaryColor,
          strokeWidth: '2px',
          fontFamily: currentTheme.appearance.fontFamily,
        },
      };
      await userApi.updateTheme(JSON.stringify(themeConfig));
      message.success(t('theme.saveSuccess'));
    } catch {
      message.error(t('theme.saveFail'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const themeConfig = {
        background: currentTheme.background,
        ink: {
          primaryColor: currentTheme.appearance.primaryColor,
          strokeWidth: '2px',
          fontFamily: currentTheme.appearance.fontFamily,
        },
      };
      await adminApi.updateGlobalTheme(JSON.stringify(themeConfig));
      dispatch(setSystemConfig({ background: currentTheme.background, appearance: currentTheme.appearance }));
      message.success(t('theme.saveSuccess'));
    } catch {
      message.error(t('theme.saveFail'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <Settings size={20} />
          <span className="font-bold">{t('theme.customization')}</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      className="glass-drawer"
      styles={{
        body: { padding: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' },
        header: { background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.3)' }
      }}
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex p-4 gap-2 border-b border-white/20 bg-white/40">
            <GlassButton 
                variant={activeTab === 'background' ? 'primary' : 'ghost'} 
                onClick={() => setActiveTab('background')}
                className="flex-1"
            >
                <Image size={16} className="mr-2" /> {t('theme.backgroundTab')}
            </GlassButton>
            <GlassButton 
                variant={activeTab === 'appearance' ? 'primary' : 'ghost'} 
                onClick={() => setActiveTab('appearance')}
                className="flex-1"
            >
                <Palette size={16} className="mr-2" /> {t('theme.appearanceTab')}
            </GlassButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {activeTab === 'background' && (
                <div className="space-y-6">
                    {/* Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">{t('theme.bgType')}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleBackgroundChange('type', 'image')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${currentTheme.background.type === 'image' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300 text-slate-500'}`}
                            >
                                <Image size={24} />
                                <span className="text-sm font-medium">{t('theme.bgImage')}</span>
                            </button>
                            <button 
                                onClick={() => handleBackgroundChange('type', 'video')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${currentTheme.background.type === 'video' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300 text-slate-500'}`}
                            >
                                <Video size={24} />
                                <span className="text-sm font-medium">{t('theme.bgVideo')}</span>
                            </button>
                        </div>
                    </div>

                    {/* URL Input + Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">{t('theme.bgFile')}</label>
                        <Space.Compact style={{ width: '100%' }}>
                            <Input 
                                placeholder={t('theme.bgUrlPlaceholder')}
                                value={currentTheme.background.url} 
                                onChange={(e) => handleBackgroundChange('url', e.target.value)}
                                style={{ width: 'calc(100% - 90px)' }}
                            />
                            <AntUpload
                                showUploadList={false}
                                beforeUpload={handleFileUpload}
                                accept="image/*,video/*"
                            >
                                <Button icon={<UploadOutlined />}>{t('theme.bgUpload')}</Button>
                            </AntUpload>
                        </Space.Compact>
                        {/* Preview */}
                        {currentTheme.background.url && (
                          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', maxHeight: 140 }}>
                            {currentTheme.background.type === 'video' ? (
                              <video src={currentTheme.background.url} autoPlay loop muted playsInline style={{ width: '100%', maxHeight: 140, objectFit: 'cover', opacity: currentTheme.background.opacity }} />
                            ) : (
                              <div style={{ width: '100%', height: 100, backgroundImage: `url(${currentTheme.background.url})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: currentTheme.background.opacity }} />
                            )}
                          </div>
                        )}
                    </div>

                    {/* Opacity Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium text-slate-700">{t('theme.glassOpacity')}</label>
                            <span className="text-xs text-slate-500">{Math.round(currentTheme.background.opacity * 100)}%</span>
                        </div>
                        <Slider 
                            min={0} max={1} step={0.05} 
                            value={currentTheme.background.opacity}
                            onChange={(val) => handleBackgroundChange('opacity', val)}
                        />
                    </div>

                    {/* Blur Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium text-slate-700">{t('theme.backdropBlur')}</label>
                            <span className="text-xs text-slate-500">{currentTheme.background.blur}px</span>
                        </div>
                        <Slider 
                            min={0} max={40} 
                            value={currentTheme.background.blur}
                            onChange={(val) => handleBackgroundChange('blur', val)}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'appearance' && (
                <div className="space-y-6">
                    {/* Primary Color */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">{t('theme.primaryColor')}</label>
                        <ColorPicker 
                            showText
                            format="hex"
                            value={currentTheme.appearance.primaryColor}
                            onChange={(color: Color) => handleAppearanceChange('primaryColor', typeof color === 'string' ? color : color.toHexString())}
                        />
                        <div style={{ height: 6, borderRadius: 3, background: currentTheme.appearance.primaryColor, boxShadow: `0 0 8px ${currentTheme.appearance.primaryColor}44` }} />
                    </div>

                    {/* Font Family */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700">{t('theme.fontFamily')}</label>
                        <Select
                            style={{ width: '100%' }}
                            value={currentTheme.appearance.fontFamily}
                            onChange={(val) => handleAppearanceChange('fontFamily', val)}
                            options={FONT_OPTIONS}
                        />
                        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.5)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ fontFamily: currentTheme.appearance.fontFamily, fontSize: 18, color: '#333' }}>墨韵悠然·水墨丹青</div>
                          <div style={{ fontFamily: currentTheme.appearance.fontFamily, fontSize: 13, color: '#888', marginTop: 2 }}>Qt Platform (Preview)</div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 bg-white/60 backdrop-blur-md flex flex-col gap-3">
            <div className="flex gap-3">
                <GlassButton variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
                    <Save size={16} className="mr-2" /> {t('theme.saveChanges')}
                </GlassButton>
                <GlassButton variant="ghost" onClick={() => dispatch(resetTheme())}>
                    <RotateCcw size={16} />
                </GlassButton>
            </div>
            
            {isAdmin && (
                <Button type="dashed" block onClick={handleSaveSystem} loading={saving} className="text-xs text-slate-500 hover:text-blue-500 border-slate-300">
                    {t('theme.setAsDefault')}
                </Button>
            )}
        </div>
      </div>
    </Drawer>
  );
};

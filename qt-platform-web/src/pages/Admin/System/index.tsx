import { useState, useEffect } from 'react';
import { Table, Button, Input, Card, Space } from 'antd';
import { message } from '@/utils/antdUtils';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { Save, X, Edit, Image, FileText, Quote, Calendar, Shield, Globe, Link, Mail, Github, Twitter } from 'lucide-react';
import { LogoCropUploader } from '@/components/LogoCropUploader';
import { useAppDispatch } from '@/store/hooks';
import { fetchSiteConfig } from '@/store/slices/siteConfigSlice';

interface SystemConfig {
  configKey: string;
  configValue: string;
  description?: string;
}

interface ApiResponse<T> {
  data: T;
}

export default function AdminSystem() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [data, setData] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [footerConfig, setFooterConfig] = useState({
    beian: '',
    beianEn: '',
    icp: '',
    icpEn: '',
    holiday: '',
    holidayEn: '',
    quote: '',
    quoteEn: '',
    quoteAuthor: '',
    quoteAuthorEn: '',
  });
  const [footerSaving, setFooterSaving] = useState(false);
  
  // 官网URL和社交链接配置
  const [siteUrlConfig, setSiteUrlConfig] = useState({
    siteUrl: '',
  });
  const [socialConfig, setSocialConfig] = useState({
    github: '',
    twitter: '',
    linkedin: '',
    weibo: '',
    wechat: '',
    email: '',
  });
  const [socialSaving, setSocialSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSystemConfigs() as ApiResponse<SystemConfig[]>;
      setData(res.data);
      // 获取当前 Logo URL
      const logoConfig = res.data?.find((c) => c.configKey === 'site.logo');
      if (logoConfig) {
        setLogoUrl(logoConfig.configValue || '');
      }
      // 获取 Footer 配置
      const footerConfigs = res.data?.filter((c: SystemConfig) => c.configKey.startsWith('footer.'));
      if (footerConfigs) {
        const newFooterConfig = { ...footerConfig };
        footerConfigs.forEach((c: SystemConfig) => {
          switch (c.configKey) {
            case 'footer.beian': newFooterConfig.beian = c.configValue || ''; break;
            case 'footer.beian_en': newFooterConfig.beianEn = c.configValue || ''; break;
            case 'footer.icp': newFooterConfig.icp = c.configValue || ''; break;
            case 'footer.icp_en': newFooterConfig.icpEn = c.configValue || ''; break;
            case 'footer.holiday': newFooterConfig.holiday = c.configValue || ''; break;
            case 'footer.holiday_en': newFooterConfig.holidayEn = c.configValue || ''; break;
            case 'footer.quote': newFooterConfig.quote = c.configValue || ''; break;
            case 'footer.quote_en': newFooterConfig.quoteEn = c.configValue || ''; break;
            case 'footer.quote_author': newFooterConfig.quoteAuthor = c.configValue || ''; break;
            case 'footer.quote_author_en': newFooterConfig.quoteAuthorEn = c.configValue || ''; break;
          }
        });
        setFooterConfig(newFooterConfig);
      }
      // 获取官网URL配置
      const siteUrlConfigData = res.data?.find((c: SystemConfig) => c.configKey === 'site.url');
      if (siteUrlConfigData) {
        setSiteUrlConfig({ siteUrl: siteUrlConfigData.configValue || '' });
      }
      // 获取社交链接配置
      const socialConfigs = res.data?.filter((c: SystemConfig) => c.configKey.startsWith('social.'));
      if (socialConfigs) {
        const newSocialConfig = { ...socialConfig };
        socialConfigs.forEach((c: SystemConfig) => {
          switch (c.configKey) {
            case 'social.github': newSocialConfig.github = c.configValue || ''; break;
            case 'social.twitter': newSocialConfig.twitter = c.configValue || ''; break;
            case 'social.linkedin': newSocialConfig.linkedin = c.configValue || ''; break;
            case 'social.weibo': newSocialConfig.weibo = c.configValue || ''; break;
            case 'social.wechat': newSocialConfig.wechat = c.configValue || ''; break;
            case 'social.email': newSocialConfig.email = c.configValue || ''; break;
          }
        });
        setSocialConfig(newSocialConfig);
      }
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const handleLogoSave = async (url: string) => {
    await adminApi.updateSystemConfig('site.logo', url);
    message.success(t('admin.saveSuccess'));
    loadData();
    // 刷新全局站点配置
    dispatch(fetchSiteConfig());
  };

  const handleSave = async (key: string) => {
    try {
      await adminApi.updateSystemConfig(key, editingValue);
      message.success(t('admin.saveSuccess'));
      setEditingKey(null);
      loadData();
      // 如果是站点配置或Footer配置，刷新全局站点配置
      if (key.startsWith('site.') || key.startsWith('footer.')) {
        dispatch(fetchSiteConfig());
      }
    } catch { /* handled */ }
  };

  const handleFooterSave = async () => {
    setFooterSaving(true);
    try {
      await Promise.all([
        adminApi.updateSystemConfig('footer.beian', footerConfig.beian),
        adminApi.updateSystemConfig('footer.beian_en', footerConfig.beianEn),
        adminApi.updateSystemConfig('footer.icp', footerConfig.icp),
        adminApi.updateSystemConfig('footer.icp_en', footerConfig.icpEn),
        adminApi.updateSystemConfig('footer.holiday', footerConfig.holiday),
        adminApi.updateSystemConfig('footer.holiday_en', footerConfig.holidayEn),
        adminApi.updateSystemConfig('footer.quote', footerConfig.quote),
        adminApi.updateSystemConfig('footer.quote_en', footerConfig.quoteEn),
        adminApi.updateSystemConfig('footer.quote_author', footerConfig.quoteAuthor),
        adminApi.updateSystemConfig('footer.quote_author_en', footerConfig.quoteAuthorEn),
      ]);
      message.success(t('admin.saveSuccess'));
      dispatch(fetchSiteConfig());
      loadData();
    } catch { /* handled */ } finally {
      setFooterSaving(false);
    }
  };

  const handleSocialSave = async () => {
    setSocialSaving(true);
    try {
      await Promise.all([
        adminApi.updateSystemConfig('site.url', siteUrlConfig.siteUrl),
        adminApi.updateSystemConfig('social.github', socialConfig.github),
        adminApi.updateSystemConfig('social.twitter', socialConfig.twitter),
        adminApi.updateSystemConfig('social.linkedin', socialConfig.linkedin),
        adminApi.updateSystemConfig('social.weibo', socialConfig.weibo),
        adminApi.updateSystemConfig('social.wechat', socialConfig.wechat),
        adminApi.updateSystemConfig('social.email', socialConfig.email),
      ]);
      message.success(t('admin.saveSuccess'));
      dispatch(fetchSiteConfig());
      loadData();
    } catch { /* handled */ } finally {
      setSocialSaving(false);
    }
  };

  const columns: ColumnsType<SystemConfig> = [
    { title: t('admin.configKey'), dataIndex: 'configKey', width: 220, className: 'font-mono text-sm' },
    {
      title: t('admin.value'), dataIndex: 'configValue',
      render: (v: string, record) => {
        if (editingKey === record.configKey) {
          return (
            <Input.TextArea 
              value={editingValue} 
              onChange={(e) => setEditingValue(e.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }} 
            />
          );
        }
        return <span className="break-all">{v}</span>;
      },
    },
    { title: t('admin.description'), dataIndex: 'description', width: 200 },
    {
      title: t('admin.action'), width: 140, fixed: 'right',
      render: (_, record) => {
        if (editingKey === record.configKey) {
          return (
            <Space size="small">
              <Button size="small" type="primary" icon={<Save size={14} />} onClick={() => handleSave(record.configKey)} />
              <Button size="small" icon={<X size={14} />} onClick={() => setEditingKey(null)} />
            </Space>
          );
        }
        return (
          <Button size="small" icon={<Edit size={14} />} onClick={() => { setEditingKey(record.configKey); setEditingValue(record.configValue); }}>
            {t('admin.edit')}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.system')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.configureSystem')}</p>
        </div>
      </div>

      {/* Logo 编辑卡片 */}
      <Card 
        title={
          <div className="flex items-center gap-2">
            <Image size={18} className="text-blue-600" />
            <span>{t('logo.editLogo')}</span>
          </div>
        }
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <LogoCropUploader
          value={logoUrl}
          onChange={setLogoUrl}
          onSave={handleLogoSave}
        />
      </Card>

      {/* Footer 配置编辑卡片 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            <span>{t('adminSystem.footerConfig')}</span>
          </div>
        }
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <div className="space-y-6">
          {/* 备案信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Shield size={14} className="text-blue-500" />
                {t('adminSystem.beian')}
              </label>
              <Input
                value={footerConfig.beian}
                onChange={(e) => setFooterConfig({ ...footerConfig, beian: e.target.value })}
                placeholder={t('adminSystem.beianPlaceholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Shield size={14} className="text-blue-500" />
                {t('adminSystem.beianEn')}
              </label>
              <Input
                value={footerConfig.beianEn}
                onChange={(e) => setFooterConfig({ ...footerConfig, beianEn: e.target.value })}
                placeholder={t('adminSystem.beianEnPlaceholder')}
                className="h-10"
              />
            </div>
          </div>

          {/* ICP 信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Shield size={14} className="text-indigo-500" />
                {t('adminSystem.icp')}
              </label>
              <Input
                value={footerConfig.icp}
                onChange={(e) => setFooterConfig({ ...footerConfig, icp: e.target.value })}
                placeholder={t('adminSystem.icpPlaceholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Shield size={14} className="text-indigo-500" />
                {t('adminSystem.icpEn')}
              </label>
              <Input
                value={footerConfig.icpEn}
                onChange={(e) => setFooterConfig({ ...footerConfig, icpEn: e.target.value })}
                placeholder={t('adminSystem.icpEnPlaceholder')}
                className="h-10"
              />
            </div>
          </div>

          {/* 节假日定制信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calendar size={14} className="text-rose-500" />
                {t('adminSystem.holiday')}
              </label>
              <Input.TextArea
                value={footerConfig.holiday}
                onChange={(e) => setFooterConfig({ ...footerConfig, holiday: e.target.value })}
                placeholder={t('adminSystem.holidayPlaceholder')}
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calendar size={14} className="text-rose-500" />
                {t('adminSystem.holidayEn')}
              </label>
              <Input.TextArea
                value={footerConfig.holidayEn}
                onChange={(e) => setFooterConfig({ ...footerConfig, holidayEn: e.target.value })}
                placeholder={t('adminSystem.holidayEnPlaceholder')}
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>
          </div>

          {/* 名人名言 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Quote size={14} className="text-amber-500" />
                {t('adminSystem.quote')}
              </label>
              <Input.TextArea
                value={footerConfig.quote}
                onChange={(e) => setFooterConfig({ ...footerConfig, quote: e.target.value })}
                placeholder={t('adminSystem.quotePlaceholder')}
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Quote size={14} className="text-amber-500" />
                {t('adminSystem.quoteEn')}
              </label>
              <Input.TextArea
                value={footerConfig.quoteEn}
                onChange={(e) => setFooterConfig({ ...footerConfig, quoteEn: e.target.value })}
                placeholder={t('adminSystem.quoteEnPlaceholder')}
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>
          </div>

          {/* 名言作者 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Quote size={14} className="text-amber-600" />
                {t('adminSystem.quoteAuthor')}
              </label>
              <Input
                value={footerConfig.quoteAuthor}
                onChange={(e) => setFooterConfig({ ...footerConfig, quoteAuthor: e.target.value })}
                placeholder={t('adminSystem.quoteAuthorPlaceholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Quote size={14} className="text-amber-600" />
                {t('adminSystem.quoteAuthorEn')}
              </label>
              <Input
                value={footerConfig.quoteAuthorEn}
                onChange={(e) => setFooterConfig({ ...footerConfig, quoteAuthorEn: e.target.value })}
                placeholder={t('adminSystem.quoteAuthorEnPlaceholder')}
                className="h-10"
              />
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="primary"
              icon={<Save size={14} />}
              loading={footerSaving}
              onClick={handleFooterSave}
              className="flex items-center gap-2"
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 官网URL和社交链接配置卡片 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-600" />
            <span>{t('adminSystem.socialConfig')}</span>
          </div>
        }
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <div className="space-y-6">
          {/* 官网URL */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Link size={14} className="text-blue-500" />
              {t('adminSystem.siteUrl')}
            </label>
            <Input
              value={siteUrlConfig.siteUrl}
              onChange={(e) => setSiteUrlConfig({ ...siteUrlConfig, siteUrl: e.target.value })}
              placeholder={t('adminSystem.siteUrlPlaceholder')}
              className="h-10"
            />
            <p className="text-xs text-slate-400">{t('adminSystem.siteUrlHint')}</p>
          </div>

          {/* 社交链接 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Github size={14} className="text-slate-800 dark:text-slate-200" />
                GitHub
              </label>
              <Input
                value={socialConfig.github}
                onChange={(e) => setSocialConfig({ ...socialConfig, github: e.target.value })}
                placeholder="https://github.com/..."
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Twitter size={14} className="text-sky-500" />
                Twitter / X
              </label>
              <Input
                value={socialConfig.twitter}
                onChange={(e) => setSocialConfig({ ...socialConfig, twitter: e.target.value })}
                placeholder="https://twitter.com/..."
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Link size={14} className="text-blue-700" />
                LinkedIn
              </label>
              <Input
                value={socialConfig.linkedin}
                onChange={(e) => setSocialConfig({ ...socialConfig, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Globe size={14} className="text-red-500" />
                {t('adminSystem.weibo')}
              </label>
              <Input
                value={socialConfig.weibo}
                onChange={(e) => setSocialConfig({ ...socialConfig, weibo: e.target.value })}
                placeholder="https://weibo.com/..."
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Globe size={14} className="text-green-500" />
                {t('adminSystem.wechat')}
              </label>
              <Input
                value={socialConfig.wechat}
                onChange={(e) => setSocialConfig({ ...socialConfig, wechat: e.target.value })}
                placeholder={t('adminSystem.wechatPlaceholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Mail size={14} className="text-amber-500" />
                {t('adminSystem.contactEmail')}
              </label>
              <Input
                value={socialConfig.email}
                onChange={(e) => setSocialConfig({ ...socialConfig, email: e.target.value })}
                placeholder="contact@example.com"
                className="h-10"
              />
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="primary"
              icon={<Save size={14} />}
              loading={socialSaving}
              onClick={handleSocialSave}
              className="flex items-center gap-2"
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 系统配置表格 */}
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={data.filter(d => d.configKey !== 'site.logo' && !d.configKey.startsWith('footer.') && !d.configKey.startsWith('social.') && d.configKey !== 'site.url')} 
          rowKey="configKey" 
          loading={loading} 
          pagination={false}
          scroll={{ x: 800 }} 
        />
      </Card>
    </div>
  );
}

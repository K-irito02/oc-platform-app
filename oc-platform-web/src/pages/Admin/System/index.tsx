import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Card, Space, Switch, DatePicker, Alert, Modal } from 'antd';
import { message } from '@/utils/antdUtils';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { Save, X, Edit, Image, FileText, Quote, Calendar, Shield, Globe, Link, Mail, Github, Twitter, Wrench, AlertTriangle, MailCheck } from 'lucide-react';
import { LogoCropUploader } from '@/components/LogoCropUploader';
import { useAppDispatch } from '@/store/hooks';
import { fetchSiteConfig } from '@/store/slices/siteConfigSlice';
import dayjs from 'dayjs';

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
  const [faviconUrl, setFaviconUrl] = useState('');
  const [footerConfig, setFooterConfig] = useState({
    policeBeian: '',
    policeIconUrl: '',
    icp: '',
    holiday: '',
    holidayEn: '',
    quote: '',
    quoteEn: '',
    quoteAuthor: '',
    quoteAuthorEn: '',
  });
  const [footerSaving, setFooterSaving] = useState(false);
  
  const [filingModalVisible, setFilingModalVisible] = useState(false);
  const [filingVerificationCode, setFilingVerificationCode] = useState('');
  const [filingCodeSending, setFilingCodeSending] = useState(false);
  const [filingCountdown, setFilingCountdown] = useState(0);
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  
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

  // 维护模式配置
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    enabled: false,
    title: '',
    titleEn: '',
    message: '',
    messageEn: '',
    estimatedTime: null as string | null,
  });
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSystemConfigs() as ApiResponse<SystemConfig[]>;
      setData(res.data);
      // 获取当前 Logo URL
      const logoConfig = res.data?.find((c) => c.configKey === 'site.logo');
      if (logoConfig) {
        setLogoUrl(logoConfig.configValue || '');
      }
      // 获取当前 Favicon URL
      const faviconConfig = res.data?.find((c) => c.configKey === 'site.favicon');
      if (faviconConfig) {
        setFaviconUrl(faviconConfig.configValue || '');
      }
      // 获取 Footer 配置
      const footerConfigs = res.data?.filter((c: SystemConfig) => c.configKey.startsWith('footer.'));
      if (footerConfigs) {
        const newFooterConfig = { ...footerConfig };
        footerConfigs.forEach((c: SystemConfig) => {
          switch (c.configKey) {
            case 'footer.beian': newFooterConfig.policeBeian = c.configValue || ''; break;
            case 'footer.police_icon_url': newFooterConfig.policeIconUrl = c.configValue || ''; break;
            case 'footer.icp': newFooterConfig.icp = c.configValue || ''; break;
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
      
      try {
        const filingRes = await adminApi.getFilingConfig() as ApiResponse<{ superAdminEmail: string }>;
        if (filingRes.data?.superAdminEmail) {
          setSuperAdminEmail(filingRes.data.superAdminEmail);
        }
      } catch { /* ignore */ }
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
      // 获取维护模式配置
      const maintenanceConfigs = res.data?.filter((c: SystemConfig) => c.configKey.startsWith('system.maintenance.'));
      if (maintenanceConfigs) {
        const newMaintenanceConfig = { ...maintenanceConfig };
        maintenanceConfigs.forEach((c: SystemConfig) => {
          switch (c.configKey) {
            case 'system.maintenance.enabled': 
              newMaintenanceConfig.enabled = c.configValue === 'true'; 
              break;
            case 'system.maintenance.title': 
              newMaintenanceConfig.title = c.configValue || ''; 
              break;
            case 'system.maintenance.title_en': 
              newMaintenanceConfig.titleEn = c.configValue || ''; 
              break;
            case 'system.maintenance.message': 
              newMaintenanceConfig.message = c.configValue || ''; 
              break;
            case 'system.maintenance.message_en': 
              newMaintenanceConfig.messageEn = c.configValue || ''; 
              break;
            case 'system.maintenance.estimated_time': 
              newMaintenanceConfig.estimatedTime = c.configValue || null; 
              break;
          }
        });
        setMaintenanceConfig(newMaintenanceConfig);
      }
    } catch { /* handled */ } finally { setLoading(false); }
  }, [dispatch, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogoSave = async (url: string) => {
    await adminApi.updateSystemConfig('site.logo', url);
    message.success(t('admin.saveSuccess'));
    loadData();
    // 刷新全局站点配置
    dispatch(fetchSiteConfig());
  };

  const handleFaviconSave = async (url: string) => {
    await adminApi.updateSystemConfig('site.favicon', url);
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

  const handleFilingSaveClick = () => {
    setFilingModalVisible(true);
    setFilingVerificationCode('');
  };

  const handleSendFilingCode = async () => {
    setFilingCodeSending(true);
    try {
      await adminApi.sendFilingCode();
      message.success(t('adminSystem.filingCodeSent'));
      setFilingCountdown(60);
      const timer = setInterval(() => {
        setFilingCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch { /* handled */ } finally {
      setFilingCodeSending(false);
    }
  };

  const handleFilingConfirm = async () => {
    if (!filingVerificationCode) {
      message.error(t('adminSystem.filingCodeRequired'));
      return;
    }
    setFooterSaving(true);
    try {
      await adminApi.updateFilingConfig({
        verificationCode: filingVerificationCode,
        icp: footerConfig.icp,
        policeBeian: footerConfig.policeBeian,
        policeIconUrl: footerConfig.policeIconUrl,
      });
      message.success(t('admin.saveSuccess'));
      setFilingModalVisible(false);
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

  const handleMaintenanceSave = async () => {
    setMaintenanceSaving(true);
    try {
      await adminApi.updateMaintenanceConfig({
        enabled: maintenanceConfig.enabled,
        title: maintenanceConfig.title,
        titleEn: maintenanceConfig.titleEn,
        message: maintenanceConfig.message,
        messageEn: maintenanceConfig.messageEn,
        estimatedTime: maintenanceConfig.estimatedTime,
      });
      message.success(t('admin.saveSuccess'));
      loadData();
    } catch { /* handled */ } finally {
      setMaintenanceSaving(false);
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
            <span className="text-slate-900 dark:text-white">{t('logo.editLogo')}</span>
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

      {/* Favicon 编辑卡片 */}
      <Card 
        title={
          <div className="flex items-center gap-2">
            <Image size={18} className="text-purple-600" />
            <span className="text-slate-900 dark:text-white">{t('logo.faviconTitle')}</span>
          </div>
        }
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <LogoCropUploader
          value={faviconUrl}
          onChange={setFaviconUrl}
          onSave={handleFaviconSave}
          title={t('logo.faviconCropTitle')}
        />
      </Card>

      {/* Footer 配置编辑卡片 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            <span className="text-slate-900 dark:text-white">{t('adminSystem.footerConfig')}</span>
          </div>
        }
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <div className="space-y-6">
          <Alert
            type="info"
            message={t('adminSystem.filingNote')}
            showIcon
            className="mb-4"
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Shield size={14} className="text-red-500" />
                {t('adminSystem.policeBeian')}
              </label>
              <Input
                value={footerConfig.policeBeian}
                onChange={(e) => setFooterConfig({ ...footerConfig, policeBeian: e.target.value })}
                placeholder={t('adminSystem.policeBeianPlaceholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Image size={14} className="text-orange-500" />
                {t('adminSystem.policeIconUrl')}
              </label>
              <Input
                value={footerConfig.policeIconUrl}
                onChange={(e) => setFooterConfig({ ...footerConfig, policeIconUrl: e.target.value })}
                placeholder={t('adminSystem.policeIconUrlPlaceholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Shield size={14} className="text-blue-500" />
                {t('adminSystem.icp')}
              </label>
              <Input
                value={footerConfig.icp}
                onChange={(e) => setFooterConfig({ ...footerConfig, icp: e.target.value })}
                placeholder={t('adminSystem.icpPlaceholder')}
                className="h-10"
              />
            </div>
          </div>

          {/* 备案信息保存按钮 */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="primary"
              icon={<Save size={14} />}
              loading={footerSaving}
              onClick={handleFilingSaveClick}
              className="flex items-center gap-2"
            >
              {t('adminSystem.saveFiling')}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <MailCheck size={18} className="text-blue-500" />
            <span>{t('adminSystem.filingVerifyTitle')}</span>
          </div>
        }
        open={filingModalVisible}
        onCancel={() => setFilingModalVisible(false)}
        footer={null}
        className="filing-verify-modal"
      >
        <div className="space-y-4 py-4">
          <p className="text-slate-600 dark:text-slate-300">
            {t('adminSystem.filingVerifyDesc')} <span className="font-medium text-blue-600">{superAdminEmail}</span>
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSendFilingCode}
              loading={filingCodeSending}
              disabled={filingCountdown > 0}
            >
              {filingCountdown > 0 
                ? `${filingCountdown}s ${t('adminSystem.resendAfter')}` 
                : t('adminSystem.sendCode')}
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('adminSystem.verificationCode')}
            </label>
            <Input
              value={filingVerificationCode}
              onChange={(e) => setFilingVerificationCode(e.target.value)}
              placeholder={t('adminSystem.verificationCodePlaceholder')}
              className="h-10"
              maxLength={6}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setFilingModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              loading={footerSaving}
              onClick={handleFilingConfirm}
              icon={<Save size={14} />}
            >
              {t('adminSystem.confirmSave')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 节假日和名人名言配置卡片 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            <span className="text-slate-900 dark:text-white">{t('adminSystem.holidayQuoteConfig')}</span>
          </div>
        }
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <div className="space-y-6">
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

          {/* 节假日和名人名言保存按钮 */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="default"
              icon={<Save size={14} />}
              loading={footerSaving}
              onClick={handleFooterSave}
              className="flex items-center gap-2"
            >
              {t('adminSystem.saveHolidayQuote')}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <MailCheck size={18} className="text-blue-500" />
            <span>{t('adminSystem.filingVerifyTitle')}</span>
          </div>
        }
        open={filingModalVisible}
        onCancel={() => setFilingModalVisible(false)}
        footer={null}
        className="filing-verify-modal"
      >
        <div className="space-y-4 py-4">
          <p className="text-slate-600 dark:text-slate-300">
            {t('adminSystem.filingVerifyDesc')} <span className="font-medium text-blue-600">{superAdminEmail}</span>
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSendFilingCode}
              loading={filingCodeSending}
              disabled={filingCountdown > 0}
            >
              {filingCountdown > 0 
                ? `${filingCountdown}s ${t('adminSystem.resendAfter')}` 
                : t('adminSystem.sendCode')}
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('adminSystem.verificationCode')}
            </label>
            <Input
              value={filingVerificationCode}
              onChange={(e) => setFilingVerificationCode(e.target.value)}
              placeholder={t('adminSystem.verificationCodePlaceholder')}
              className="h-10"
              maxLength={6}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setFilingModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              loading={footerSaving}
              onClick={handleFilingConfirm}
              icon={<Save size={14} />}
            >
              {t('adminSystem.confirmSave')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 节假日和名人名言配置卡片 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" />
            <span className="text-slate-900 dark:text-white">{t('adminSystem.holidayQuoteConfig')}</span>
          </div>
        }
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <div className="space-y-6">
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

          {/* 节假日和名人名言保存按钮 */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="default"
              icon={<Save size={14} />}
              loading={footerSaving}
              onClick={handleFooterSave}
              className="flex items-center gap-2"
            >
              {t('adminSystem.saveHolidayQuote')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 官网URL和社交链接配置卡片 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-600" />
            <span className="text-slate-900 dark:text-white">{t('adminSystem.socialConfig')}</span>
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

      {/* 维护模式配置卡片 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Wrench size={18} className="text-purple-600" />
            <span className="text-slate-900 dark:text-white">{t('adminSystem.maintenanceConfig')}</span>
          </div>
        }
        className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <div className="space-y-4">
          {/* 维护模式开关 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className={maintenanceConfig.enabled ? 'text-orange-500' : 'text-slate-400'} />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{t('adminSystem.maintenanceEnabled')}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{t('adminSystem.maintenanceEnabledWarning')}</div>
              </div>
            </div>
            <Switch
              checked={maintenanceConfig.enabled}
              onChange={(checked) => setMaintenanceConfig({ ...maintenanceConfig, enabled: checked })}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>

          {maintenanceConfig.enabled && (
            <Alert
              type="warning"
              message={t('adminSystem.maintenanceEnabledWarning')}
              showIcon
              className="mb-4"
            />
          )}

          {/* 维护标题 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('adminSystem.maintenanceTitle')}
              </label>
              <Input
                value={maintenanceConfig.title}
                onChange={(e) => setMaintenanceConfig({ ...maintenanceConfig, title: e.target.value })}
                placeholder={t('adminSystem.maintenanceTitlePlaceholder')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('adminSystem.maintenanceTitleEn')}
              </label>
              <Input
                value={maintenanceConfig.titleEn}
                onChange={(e) => setMaintenanceConfig({ ...maintenanceConfig, titleEn: e.target.value })}
                placeholder={t('adminSystem.maintenanceTitleEnPlaceholder')}
                className="h-10"
              />
            </div>
          </div>

          {/* 维护说明 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('adminSystem.maintenanceMessage')}
              </label>
              <Input.TextArea
                value={maintenanceConfig.message}
                onChange={(e) => setMaintenanceConfig({ ...maintenanceConfig, message: e.target.value })}
                placeholder={t('adminSystem.maintenanceMessagePlaceholder')}
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('adminSystem.maintenanceMessageEn')}
              </label>
              <Input.TextArea
                value={maintenanceConfig.messageEn}
                onChange={(e) => setMaintenanceConfig({ ...maintenanceConfig, messageEn: e.target.value })}
                placeholder={t('adminSystem.maintenanceMessageEnPlaceholder')}
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </div>
          </div>

          {/* 预计恢复时间 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Calendar size={14} className="text-blue-500" />
              {t('adminSystem.maintenanceEstimatedTime')}
            </label>
            <DatePicker
              showTime
              value={maintenanceConfig.estimatedTime ? dayjs(maintenanceConfig.estimatedTime) : null}
              onChange={(date) => setMaintenanceConfig({ ...maintenanceConfig, estimatedTime: date ? date.toISOString() : null })}
              placeholder={t('adminSystem.maintenanceEstimatedTime')}
              className="w-full"
              format="YYYY-MM-DD HH:mm:ss"
            />
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="primary"
              icon={<Save size={14} />}
              loading={maintenanceSaving}
              onClick={handleMaintenanceSave}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
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
          dataSource={data.filter(d => d.configKey !== 'site.logo' && !d.configKey.startsWith('footer.') && !d.configKey.startsWith('social.') && d.configKey !== 'site.url' && !d.configKey.startsWith('system.maintenance.'))} 
          rowKey="configKey" 
          loading={loading} 
          pagination={false}
          scroll={{ x: 800 }} 
        />
      </Card>
    </div>
  );
}

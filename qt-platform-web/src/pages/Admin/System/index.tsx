import { useState, useEffect } from 'react';
import { Table, Button, Input, Card, Space } from 'antd';
import { message } from '@/utils/antdUtils';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { Save, X, Edit, Image } from 'lucide-react';
import { LogoCropUploader } from '@/components/LogoCropUploader';
import { useAppDispatch } from '@/store/hooks';
import { fetchSiteConfig } from '@/store/slices/siteConfigSlice';

export default function AdminSystem() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getSystemConfigs();
      setData(res.data);
      // 获取当前 Logo URL
      const logoConfig = res.data?.find((c: any) => c.configKey === 'site.logo');
      if (logoConfig) {
        setLogoUrl(logoConfig.configValue || '');
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
      // 如果是站点配置，刷新全局站点配置
      if (key.startsWith('site.')) {
        dispatch(fetchSiteConfig());
      }
    } catch { /* handled */ }
  };

  const columns: ColumnsType<any> = [
    { title: t('admin.configKey'), dataIndex: 'configKey', width: 220, className: 'font-mono text-sm' },
    {
      title: t('admin.value'), dataIndex: 'configValue',
      render: (v: string, record: any) => {
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
      render: (_: any, record: any) => {
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

      {/* 系统配置表格 */}
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={data.filter(d => d.configKey !== 'site.logo')} 
          rowKey="configKey" 
          loading={loading} 
          pagination={false}
          scroll={{ x: 800 }} 
        />
      </Card>
    </div>
  );
}

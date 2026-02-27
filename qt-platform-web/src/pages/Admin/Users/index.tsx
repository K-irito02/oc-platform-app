import { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Tag, Button, message, Modal, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { Search } from 'lucide-react';

export default function AdminUsers() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => { loadData(); }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.listUsers({ page, size: 20, keyword: keyword || undefined, status: statusFilter });
      setData(res.data.records);
      setTotal(res.data.total);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const handleStatusChange = (userId: number, status: string) => {
    Modal.confirm({
      title: status === 'BANNED' ? t('admin.confirmBan') : t('admin.confirmActivate'),
      content: status === 'BANNED' ? t('admin.banConfirmContent') : t('admin.activateConfirmContent'),
      onOk: async () => {
        try {
          await adminApi.updateUserStatus(userId, status);
          message.success(t('admin.operationSuccess'));
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const columns: ColumnsType<any> = [
    { title: t('admin.id'), dataIndex: 'id', width: 80 },
    { title: t('admin.username'), dataIndex: 'username', width: 150 },
    { title: t('admin.email'), dataIndex: 'email', width: 200 },
    { title: t('admin.nickname'), dataIndex: 'nickname', width: 150 },
    {
      title: t('admin.status'), dataIndex: 'status', width: 100,
      render: (s: string) => (
        <Tag color={s === 'ACTIVE' ? 'green' : s === 'BANNED' ? 'red' : 'orange'}>
          {s === 'ACTIVE' ? t('admin.active') : s === 'BANNED' ? t('admin.banned') : t('admin.locked')}
        </Tag>
      ),
    },
    {
      title: t('admin.roles'), dataIndex: 'roles',
      render: (roles: string[]) => roles?.map((r) => <Tag key={r} color="blue">{r}</Tag>),
    },
    { title: t('admin.joinedAt'), dataIndex: 'createdAt', width: 180, render: (v: string) => v?.substring(0, 19).replace('T', ' ') },
    {
      title: t('admin.action'), width: 100, fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'ACTIVE' ? (
            <Button size="small" danger onClick={() => handleStatusChange(record.id, 'BANNED')}>{t('admin.ban')}</Button>
          ) : (
            <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'ACTIVE')}>{t('admin.activate')}</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.users')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.usersDesc')}</p>
        </div>
        <Space className="flex items-center">
          <Input 
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder={t('admin.searchUser')} 
            allowClear 
            style={{ width: 200, height: 32 }}
            onPressEnter={(e) => { setKeyword(e.currentTarget.value); setPage(1); loadData(); }} 
          />
          <Select 
            placeholder={t('admin.status')} 
            allowClear 
            style={{ width: 120, height: 32 }}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'ACTIVE', label: t('admin.active') },
              { value: 'BANNED', label: t('admin.banned') },
              { value: 'LOCKED', label: t('admin.locked') },
            ]} 
          />
        </Space>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (total) => `${t('admin.total')} ${total} ${t('admin.items')}` }}
          className="dark:bg-slate-900"
        />
      </Card>
    </div>
  );
}

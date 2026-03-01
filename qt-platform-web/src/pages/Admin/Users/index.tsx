import { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Tag, Button, Modal, Card } from 'antd';
import { message } from '@/utils/antdUtils';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { Search } from 'lucide-react';

interface UserRecord {
  id: number;
  username: string;
  email: string;
  status: string;
  roles?: string[];
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  records: T[];
  total: number;
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const [data, setData] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => { loadData(); }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({ page, size: 20, keyword: keyword || undefined, status: statusFilter }) as ApiResponse<PaginatedResponse<UserRecord>>;
      setData(res.data.records);
      setTotal(res.data.total);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const handleStatusChange = (userId: number, status: string) => {
    let title = '';
    let content = '';
    
    switch (status) {
      case 'BANNED':
        title = t('admin.confirmBan');
        content = t('admin.banConfirmContent');
        break;
      case 'ACTIVE':
        title = t('admin.confirmActivate');
        content = t('admin.activateConfirmContent');
        break;
      case 'LOCKED':
        title = t('admin.confirmLock');
        content = t('admin.lockConfirmContent');
        break;
      default:
        title = t('admin.confirmActivate');
        content = t('admin.activateConfirmContent');
    }
    
    Modal.confirm({
      title,
      content,
      onOk: async () => {
        try {
          await adminApi.updateUserStatus(userId, status);
          message.success(t('admin.operationSuccess'));
          loadData();
        } catch (error: any) {
          // 显示具体的错误信息
          const errorMessage = error?.response?.data?.message || error?.message || '操作失败';
          message.error(errorMessage);
        }
      },
    });
  };

  const columns: ColumnsType<UserRecord> = [
    { title: t('admin.id'), dataIndex: 'id', width: 80 },
    { title: t('admin.username'), dataIndex: 'username', width: 150 },
    { title: t('admin.email'), dataIndex: 'email', width: 200 },
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
      title: t('admin.action'), width: 180, fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'ACTIVE' && (
            <>
              <Button size="small" onClick={() => handleStatusChange(record.id, 'LOCKED')}>{t('admin.lock')}</Button>
              <Button size="small" danger onClick={() => handleStatusChange(record.id, 'BANNED')}>{t('admin.ban')}</Button>
            </>
          )}
          {record.status === 'LOCKED' && (
            <>
              <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'ACTIVE')}>{t('admin.unlock')}</Button>
              <Button size="small" danger onClick={() => handleStatusChange(record.id, 'BANNED')}>{t('admin.ban')}</Button>
            </>
          )}
          {record.status === 'BANNED' && (
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
        <div className="flex items-center gap-3">
          <Input 
            prefix={<Search size={14} className="text-slate-400 shrink-0" />}
            placeholder={t('admin.searchUserIdEmail')} 
            allowClear 
            className="w-96 md:w-[28rem] h-10"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={(e) => { 
              const value = e.currentTarget.value;
              setKeyword(value);
              setPage(1); 
              loadData(); 
            }} 
          />
          <Select 
            placeholder={t('admin.status')} 
            allowClear 
            className="w-36 h-9"
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'ACTIVE', label: t('admin.active') },
              { value: 'BANNED', label: t('admin.banned') },
              { value: 'LOCKED', label: t('admin.locked') },
            ]} 
          />
        </div>
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

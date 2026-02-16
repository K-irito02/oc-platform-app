import { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Tag, Button, message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';

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
      title: `确认${status === 'BANNED' ? '封禁' : '激活'}该用户？`,
      onOk: async () => {
        try {
          await adminApi.updateUserStatus(userId, status);
          message.success('操作成功');
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const columns: ColumnsType<any> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '昵称', dataIndex: 'nickname' },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: string) => (
        <Tag color={s === 'ACTIVE' ? 'green' : s === 'BANNED' ? 'red' : 'orange'}>{s}</Tag>
      ),
    },
    {
      title: '角色', dataIndex: 'roles',
      render: (roles: string[]) => roles?.map((r) => <Tag key={r}>{r}</Tag>),
    },
    { title: '注册时间', dataIndex: 'createdAt', width: 170, render: (v: string) => v?.substring(0, 19).replace('T', ' ') },
    {
      title: '操作', width: 120, fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'ACTIVE' ? (
            <Button size="small" danger onClick={() => handleStatusChange(record.id, 'BANNED')}>封禁</Button>
          ) : (
            <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'ACTIVE')}>激活</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--ink-darkest)', marginBottom: 4 }}>{t('admin.users')}</h2>
        <p style={{ color: 'var(--ink-light)', fontSize: 13, margin: 0 }}>{t('admin.overviewDesc')}</p>
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder={t('admin.searchUser')} allowClear style={{ width: 280 }}
          onSearch={(v) => { setKeyword(v); setPage(1); loadData(); }} />
        <Select placeholder="状态" allowClear style={{ width: 120 }}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          options={[
            { value: 'ACTIVE', label: '正常' },
            { value: 'BANNED', label: '封禁' },
            { value: 'LOCKED', label: '锁定' },
          ]} />
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        scroll={{ x: 900 }}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }} />
    </div>
  );
}

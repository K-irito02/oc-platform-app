import { useState, useEffect } from 'react';
import { Table, Space, Tag, Button, message, Modal, Select, Input, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { Search } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'default', PENDING: 'orange', PUBLISHED: 'green', REJECTED: 'red', ARCHIVED: 'gray',
};

export default function AdminProducts() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  useEffect(() => { loadData(); }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.listProducts({ page, size: 20, status: statusFilter, keyword: keyword || undefined });
      setData(res.data.records);
      setTotal(res.data.total);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const handleAudit = (id: number, status: string) => {
    Modal.confirm({
      title: `Confirm ${status}?`,
      content: `Are you sure you want to mark this product as ${status}?`,
      onOk: async () => {
        try {
          await adminApi.auditProduct(id, status);
          message.success('Operation successful');
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Delete Product?',
      content: 'This action cannot be undone.',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteProduct(id);
          message.success('Deleted successfully');
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const columns: ColumnsType<any> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Name', dataIndex: 'name', ellipsis: true },
    { title: 'Slug', dataIndex: 'slug', ellipsis: true, width: 140 },
    { title: 'Category', dataIndex: 'categoryName', width: 120 },
    {
      title: 'Status', dataIndex: 'status', width: 100,
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    { title: 'Downloads', dataIndex: 'downloadCount', width: 110, sorter: (a: any, b: any) => a.downloadCount - b.downloadCount },
    { title: 'Rating', dataIndex: 'ratingAverage', width: 80, render: (v: number) => v?.toFixed(1) || '-' },
    { title: 'Created', dataIndex: 'createdAt', width: 170, render: (v: string) => v?.substring(0, 19).replace('T', ' ') },
    {
      title: 'Action', width: 200, fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>Approve</Button>
              <Button size="small" danger onClick={() => handleAudit(record.id, 'REJECTED')}>Reject</Button>
            </>
          )}
          {record.status === 'DRAFT' && (
            <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>Publish</Button>
          )}
          <Button size="small" danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.products')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage software products and review submissions.</p>
        </div>
        <Space>
          <Input 
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder={t('admin.searchProduct') || "Search products..."}
            allowClear 
            className="w-64"
            onPressEnter={(e) => { setKeyword(e.currentTarget.value); setPage(1); loadData(); }} 
          />
          <Select 
            placeholder="Status" 
            allowClear 
            className="w-32"
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'ARCHIVED', label: 'Archived' },
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
          scroll={{ x: 1200 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `Total ${t}` }}
        />
      </Card>
    </div>
  );
}

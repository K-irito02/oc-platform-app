import { useState, useEffect } from 'react';
import { Table, Space, Tag, Button, message, Modal, Select, Card } from 'antd';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { Check, X, Trash2 } from 'lucide-react';

export default function AdminComments() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => { loadData(); }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.listComments({ page, size: 20, status: statusFilter });
      setData(res.data.records);
      setTotal(res.data.total);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const handleAudit = (id: number, status: string) => {
    Modal.confirm({
      title: `Confirm ${status === 'PUBLISHED' ? 'Approve' : 'Reject'}?`,
      onOk: async () => {
        try {
          await adminApi.auditComment(id, status);
          message.success('Operation successful');
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Delete Comment?',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteComment(id);
          message.success('Deleted successfully');
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const columns: ColumnsType<any> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Content', dataIndex: 'content', ellipsis: true },
    { title: 'Rating', dataIndex: 'rating', width: 80, render: (v: number) => v ? <span className="text-amber-500 font-bold">{v} ★</span> : '-' },
    { title: 'Product ID', dataIndex: 'productId', width: 100 },
    { title: 'User ID', dataIndex: 'userId', width: 100 },
    {
      title: 'Status', dataIndex: 'status', width: 120,
      render: (s: string) => (
        <Tag color={s === 'PUBLISHED' ? 'green' : s === 'PENDING' ? 'orange' : 'red'}>{s}</Tag>
      ),
    },
    { title: 'Created At', dataIndex: 'createdAt', width: 180, render: (v: string) => v?.substring(0, 19).replace('T', ' ') },
    {
      title: 'Action', width: 180, fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" icon={<Check size={14} />} onClick={() => handleAudit(record.id, 'PUBLISHED')} />
              <Button size="small" danger icon={<X size={14} />} onClick={() => handleAudit(record.id, 'REJECTED')} />
            </>
          )}
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.comments')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Moderate user reviews and comments.</p>
        </div>
        <Space>
          <Select 
            placeholder="Status" 
            allowClear 
            className="w-32"
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'REJECTED', label: 'Rejected' },
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
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `Total ${t}` }} 
        />
      </Card>
    </div>
  );
}

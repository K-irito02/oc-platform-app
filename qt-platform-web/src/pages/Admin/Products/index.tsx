import { useState, useEffect } from 'react';
import { Table, Space, Tag, Button, message, Modal, Select, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';

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
      title: `确认将产品状态改为 ${status}？`,
      onOk: async () => {
        try {
          await adminApi.auditProduct(id, status);
          message.success('操作成功');
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除该产品？',
      content: '此操作不可恢复',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteProduct(id);
          message.success('已删除');
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const columns: ColumnsType<any> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: 'Slug', dataIndex: 'slug', ellipsis: true, width: 140 },
    { title: '分类', dataIndex: 'categoryName', width: 100 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    { title: '下载量', dataIndex: 'downloadCount', width: 90, sorter: (a: any, b: any) => a.downloadCount - b.downloadCount },
    { title: '评分', dataIndex: 'ratingAverage', width: 80, render: (v: number) => v?.toFixed(1) || '-' },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (v: string) => v?.substring(0, 19).replace('T', ' ') },
    {
      title: '操作', width: 200, fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>通过</Button>
              <Button size="small" danger onClick={() => handleAudit(record.id, 'REJECTED')}>拒绝</Button>
            </>
          )}
          {record.status === 'DRAFT' && (
            <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>发布</Button>
          )}
          <Button size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--ink-darkest)', marginBottom: 4 }}>{t('admin.products')}</h2>
        <p style={{ color: 'var(--ink-light)', fontSize: 13, margin: 0 }}>{t('admin.overviewDesc')}</p>
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder={t('admin.searchProduct')} allowClear style={{ width: 280 }}
          onSearch={(v) => { setKeyword(v); setPage(1); loadData(); }} />
        <Select placeholder="状态" allowClear style={{ width: 130 }}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          options={[
            { value: 'DRAFT', label: '草稿' },
            { value: 'PENDING', label: '待审核' },
            { value: 'PUBLISHED', label: '已发布' },
            { value: 'REJECTED', label: '已拒绝' },
            { value: 'ARCHIVED', label: '已归档' },
          ]} />
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        scroll={{ x: 1100 }}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }} />
    </div>
  );
}

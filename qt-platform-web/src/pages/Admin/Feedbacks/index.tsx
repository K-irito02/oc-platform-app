import { useState, useEffect } from 'react';
import { Table, Space, Tag, Button, Modal, Select, Card, Input } from 'antd';
import { message } from '@/utils/antdUtils';
import { adminApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { Check, X, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import dayjs from 'dayjs';

export default function AdminFeedbacks() {
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
      const res: any = await adminApi.listFeedbacks({ page, size: 20, status: statusFilter, keyword: keyword || undefined });
      setData(res.data?.records || []);
      setTotal(res.data?.total || 0);
    } catch (error: any) {
      console.error('Failed to load feedbacks:', error);
      message.error(error?.response?.data?.message || t('admin.operationFailed'));
    } finally { 
      setLoading(false); 
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await adminApi.updateFeedbackStatus(id, status);
      message.success(t('admin.operationSuccess'));
      loadData();
    } catch {
      message.error(t('admin.operationFailed'));
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('admin.confirmDelete'),
      content: t('admin.cannotUndo'),
      onOk: async () => {
        try {
          await adminApi.deleteFeedback(id);
          message.success(t('admin.deleteSuccess'));
          loadData();
        } catch {
          message.error(t('admin.deleteFailed'));
        }
      }
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: t('admin.pending') },
      PUBLISHED: { color: 'green', text: t('admin.published') },
      REJECTED: { color: 'red', text: t('admin.rejected') },
      HIDDEN: { color: 'default', text: t('admin.hidden') },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns: ColumnsType<any> = [
    { title: t('admin.id'), dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: t('admin.username'), 
      dataIndex: 'username', 
      key: 'username',
      width: 120,
      render: (_, r) => r.username || r.nickname || t('feedback.anonymous')
    },
    { 
      title: t('adminFeedback.email'), 
      dataIndex: 'email', 
      key: 'email',
      width: 180,
      ellipsis: true,
      render: (email: string) => email || '-'
    },
    { 
      title: t('admin.content'), 
      dataIndex: 'content', 
      key: 'content',
      ellipsis: true,
      render: (text: string) => (
        <span className="text-slate-600 dark:text-slate-300" title={text}>
          {text?.length > 50 ? text.substring(0, 50) + '...' : text}
        </span>
      )
    },
    { 
      title: t('admin.parentId'), 
      dataIndex: 'parentId', 
      key: 'parentId',
      width: 100,
      render: (val) => val || '-'
    },
    { 
      title: t('admin.likeCount'), 
      dataIndex: 'likeCount', 
      key: 'likeCount',
      width: 80,
      sorter: (a, b) => (a.likeCount || 0) - (b.likeCount || 0)
    },
    { 
      title: t('admin.replyCount'), 
      dataIndex: 'replyCount', 
      key: 'replyCount',
      width: 80,
      sorter: (a, b) => (a.replyCount || 0) - (b.replyCount || 0)
    },
    {
      title: t('adminFeedback.isPublic'),
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 80,
      render: (val) => val ? <Eye size={16} className="text-green-500" /> : <EyeOff size={16} className="text-slate-400" />
    },
    { 
      title: t('admin.status'), 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    { 
      title: t('admin.createdAt'), 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: t('admin.action'),
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'PUBLISHED' && (
            <Button 
              type="text" 
              size="small" 
              icon={<Check size={14} />}
              className="text-green-600 hover:text-green-700"
              onClick={() => handleStatusChange(record.id, 'PUBLISHED')}
              title={t('admin.approve')}
            />
          )}
          {record.status !== 'HIDDEN' && (
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOff size={14} />}
              className="text-orange-600 hover:text-orange-700"
              onClick={() => handleStatusChange(record.id, 'HIDDEN')}
              title={t('admin.hide')}
            />
          )}
          {record.status !== 'REJECTED' && (
            <Button 
              type="text" 
              size="small" 
              icon={<X size={14} />}
              className="text-red-600 hover:text-red-700"
              onClick={() => handleStatusChange(record.id, 'REJECTED')}
              title={t('admin.reject')}
            />
          )}
          <Button 
            type="text" 
            size="small" 
            danger 
            icon={<Trash2 size={14} />}
            onClick={() => handleDelete(record.id)}
            title={t('admin.delete')}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('adminFeedback.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('adminFeedback.desc')}</p>
      </div>

      {/* 筛选区 */}
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <Input
              placeholder={t('adminFeedback.searchPlaceholder')}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
            />
            <Button onClick={handleSearch}>{t('common.search')}</Button>
          </div>
          <Select
            placeholder={t('admin.status')}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: 'PENDING', label: t('admin.pending') },
              { value: 'PUBLISHED', label: t('admin.published') },
              { value: 'REJECTED', label: t('admin.rejected') },
              { value: 'HIDDEN', label: t('admin.hidden') },
            ]}
          />
          <span className="text-sm text-slate-500">{t('admin.total')} {total} {t('admin.items')}</span>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (t) => `${t} ${t('admin.items')}`
          }}
        />
      </Card>
    </div>
  );
}

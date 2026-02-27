import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Space, Tag, Button, message, Modal, Select, Input, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { adminApi, categoryApi, productApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { Search, Plus, Edit, Filter } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'default', PENDING: 'orange', PUBLISHED: 'green', REJECTED: 'red', ARCHIVED: 'gray',
};

interface Category {
  id: number;
  name: string;
  nameEn?: string;
}

interface ProductOption {
  id: number;
  name: string;
  downloadCount: number;
  ratingAverage: number;
  ratingCount: number;
}

export default function AdminProducts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  
  // 多级筛选状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productFilter, setProductFilter] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<string>('downloads');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categoryFilter) {
      loadProductsByCategory(categoryFilter);
    } else {
      setProducts([]);
      setProductFilter(undefined);
    }
  }, [categoryFilter]);

  useEffect(() => { loadData(); }, [page, statusFilter, categoryFilter, productFilter, sortBy]);

  const loadCategories = async () => {
    try {
      const res: any = await categoryApi.getAll();
      setCategories(res.data || []);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadProductsByCategory = async (catId: number) => {
    try {
      const res: any = await productApi.list({ categoryId: catId, size: 100 });
      const items = res.data?.records || [];
      setProducts(items.map((p: any) => ({
        id: p.id,
        name: p.name,
        downloadCount: p.downloadCount || 0,
        ratingAverage: p.ratingAverage || 0,
        ratingCount: p.ratingCount || 0,
      })));
    } catch (e) {
      console.error('Failed to load products', e);
    }
  };

  const sortedProducts = useMemo(() => {
    if (!products.length) return [];
    const sorted = [...products];
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => b.ratingAverage - a.ratingAverage);
        break;
      case 'comments':
        sorted.sort((a, b) => b.ratingCount - a.ratingCount);
        break;
      case 'downloads':
      default:
        sorted.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
    }
    return sorted;
  }, [products, sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, size: 20 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (keyword) params.keyword = keyword;
      // 如果选择了特定产品，只显示该产品
      // 注意：后端目前不支持单个产品筛选，这里通过前端过滤
      const res: any = await adminApi.listProducts(params);
      let records = res.data.records || [];
      if (productFilter) {
        records = records.filter((r: any) => r.id === productFilter);
      }
      setData(records);
      setTotal(productFilter ? records.length : res.data.total);
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
    { title: t('admin.id'), dataIndex: 'id', width: 60 },
    { title: t('admin.name'), dataIndex: 'name', ellipsis: true },
    { title: t('admin.slug'), dataIndex: 'slug', ellipsis: true, width: 140 },
    { title: t('admin.category'), dataIndex: 'categoryName', width: 120 },
    {
      title: t('admin.status'), dataIndex: 'status', width: 100,
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    { title: t('admin.downloads'), dataIndex: 'downloadCount', width: 110, sorter: (a: any, b: any) => a.downloadCount - b.downloadCount },
    { title: t('admin.rating'), dataIndex: 'ratingAverage', width: 80, render: (v: number) => v?.toFixed(1) || '-' },
    { title: t('admin.createdAt'), dataIndex: 'createdAt', width: 170, render: (v: string) => v?.substring(0, 19).replace('T', ' ') },
    {
      title: t('admin.action'), width: 260, fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" icon={<Edit size={14} />} onClick={() => navigate(`/admin/products/${record.id}/edit`)}>{t('admin.edit')}</Button>
          {record.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>{t('admin.approve')}</Button>
              <Button size="small" danger onClick={() => handleAudit(record.id, 'REJECTED')}>{t('admin.reject')}</Button>
            </>
          )}
          {record.status === 'DRAFT' && (
            <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>{t('admin.publish')}</Button>
          )}
          <Button size="small" danger onClick={() => handleDelete(record.id)}>{t('admin.delete')}</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.products')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.manageProducts')}</p>
        </div>
        <Space wrap>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/admin/products/new')}>
            {t('admin.newProduct') || 'New Product'}
          </Button>
          <Input 
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder={t('admin.searchProduct') || "Search products..."}
            allowClear 
            className="w-48"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(1); loadData(); }} 
          />
        </Space>
      </div>

      {/* 多级筛选区域 */}
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900/50" size="small">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.filter') || 'Filter'}:
            </span>
          </div>
          
          {/* 分类筛选 */}
          <Select
            placeholder={t('admin.selectCategory') || 'Select Category'}
            allowClear
            className="w-40"
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setProductFilter(undefined); setPage(1); }}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
          
          {/* 排序规则 */}
          {categoryFilter && (
            <Select
              placeholder={t('admin.sortBy') || 'Sort By'}
              className="w-36"
              value={sortBy}
              onChange={(v) => { setSortBy(v); setProductFilter(undefined); }}
              options={[
                { value: 'downloads', label: t('admin.byDownloads') || 'By Downloads' },
                { value: 'rating', label: t('admin.byRating') || 'By Rating' },
                { value: 'comments', label: t('admin.byComments') || 'By Comments' },
              ]}
            />
          )}
          
          {/* 指定产品 */}
          {categoryFilter && sortedProducts.length > 0 && (
            <Select
              placeholder={t('admin.selectProduct') || 'Select Product'}
              allowClear
              className="w-48"
              value={productFilter}
              onChange={(v) => { setProductFilter(v); setPage(1); }}
              options={sortedProducts.map(p => ({
                value: p.id,
                label: `${p.name} (${sortBy === 'rating' ? p.ratingAverage.toFixed(1) : sortBy === 'comments' ? p.ratingCount : p.downloadCount})`,
              }))}
            />
          )}
          
          {/* 状态筛选 */}
          <Select 
            placeholder={t('admin.status') || 'Status'} 
            allowClear 
            className="w-32"
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'DRAFT', label: t('admin.draft') || 'Draft' },
              { value: 'PENDING', label: t('admin.pending') || 'Pending' },
              { value: 'PUBLISHED', label: t('admin.published') || 'Published' },
              { value: 'REJECTED', label: t('admin.rejected') || 'Rejected' },
              { value: 'ARCHIVED', label: t('admin.archived') || 'Archived' },
            ]} 
          />
          
          {/* 清除筛选 */}
          {(categoryFilter || statusFilter || productFilter) && (
            <Button 
              size="small" 
              onClick={() => {
                setCategoryFilter(undefined);
                setProductFilter(undefined);
                setStatusFilter(undefined);
                setSortBy('downloads');
                setPage(1);
              }}
            >
              {t('admin.clearFilters') || 'Clear Filters'}
            </Button>
          )}
        </div>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (total) => `${t('admin.total')} ${total} ${t('admin.items')}` }}
        />
      </Card>
    </div>
  );
}

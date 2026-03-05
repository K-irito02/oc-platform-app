import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Space, Tag, Button, Modal, Select, Input, Card, Tooltip } from 'antd';
import { message } from '@/utils/antdUtils';
import { useTranslation } from 'react-i18next';
import { adminApi, categoryApi, productApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { Search, Plus, Edit, Filter, Star, StarOff } from 'lucide-react';

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

interface ProductVersion {
  id: number;
  status: string;
}

interface ProductRecord {
  id: number;
  name: string;
  slug: string;
  categoryName?: string;
  status: string;
  downloadCount: number;
  ratingAverage?: number;
  createdAt: string;
  isFeatured?: boolean;
}

interface ApiResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  records: T[];
  total: number;
}

interface ProductListItem {
  id: number;
  name: string;
  downloadCount?: number;
  ratingAverage?: number;
  ratingCount?: number;
}

interface VersionInfo {
  allCount: number;
  publishedCount: number;
}

export default function AdminProducts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<ProductRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [versionInfoMap, setVersionInfoMap] = useState<Map<number, VersionInfo>>(new Map());
  
  // 搜索字段选择和精选筛选
  const [searchField, setSearchField] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<boolean | undefined>();
  
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

  useEffect(() => { loadData(); }, [page, statusFilter, categoryFilter, productFilter, sortBy, featuredFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll() as ApiResponse<Category[]>;
      setCategories(res.data || []);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const loadProductsByCategory = async (catId: number) => {
    try {
      const res = await productApi.list({ categoryId: catId, size: 100 }) as ApiResponse<PaginatedResponse<ProductListItem>>;
      const items = res.data?.records || [];
      setProducts(items.map((p) => ({
        id: p.id,
        name: p.name,
        downloadCount: p.downloadCount || 0,
        ratingAverage: p.ratingAverage || 0,
        ratingCount: p.ratingCount || 0,
      })));
    } catch (error) {
      console.error('Failed to load products', error);
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
      const params: Record<string, unknown> = { page, size: 20 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (keyword) {
        params.keyword = keyword;
        if (searchField !== 'all') params.searchField = searchField;
      }
      if (featuredFilter !== undefined) params.isFeatured = featuredFilter;
      // 如果选择了特定产品，只显示该产品
      // 注意：后端目前不支持单个产品筛选，这里通过前端过滤
      const res = await adminApi.listProducts(params) as ApiResponse<PaginatedResponse<ProductRecord>>;
      let records = res.data.records || [];
      if (productFilter) {
        records = records.filter((r) => r.id === productFilter);
      }
      setData(records);
      setTotal(productFilter ? records.length : res.data.total);
      
      // 加载版本信息
      await loadVersionInfo(records);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const loadVersionInfo = async (products: ProductRecord[]) => {
    const newVersionInfoMap = new Map<number, VersionInfo>();
    await Promise.all(products.map(async (product) => {
      try {
        const res = await adminApi.getVersions(product.id) as ApiResponse<ProductVersion[]>;
        const versions = res.data || [];
        newVersionInfoMap.set(product.id, {
          allCount: versions.length,
          publishedCount: versions.filter(v => v.status === 'PUBLISHED').length,
        });
      } catch {
        newVersionInfoMap.set(product.id, { allCount: 0, publishedCount: 0 });
      }
    }));
    setVersionInfoMap(newVersionInfoMap);
  };

  const handleAudit = (id: number, status: string) => {
    Modal.confirm({
      title: t('product.confirmAudit.title', { status }),
      content: t('product.confirmAudit.content', { status }),
      onOk: async () => {
        try {
          await adminApi.auditProduct(id, status);
          message.success(t('admin.operationSuccess'));
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('admin.confirmDelete'),
      content: t('admin.cannotUndo'),
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteProduct(id);
          message.success(t('admin.deleteSuccess'));
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const handleToggleFeatured = async (id: number, currentFeatured: boolean) => {
    try {
      await adminApi.updateProduct(id, { isFeatured: !currentFeatured });
      message.success(currentFeatured ? t('admin.removeFeatured') : t('admin.setFeatured'));
      loadData();
    } catch { /* handled */ }
  };

  const columns: ColumnsType<ProductRecord> = [
    { title: t('admin.id'), dataIndex: 'id', width: 60 },
    { title: t('admin.name'), dataIndex: 'name', ellipsis: true },
    { title: t('admin.slug'), dataIndex: 'slug', ellipsis: true, width: 140 },
    { title: t('admin.category'), dataIndex: 'categoryName', width: 120 },
    {
      title: t('admin.featured'), dataIndex: 'isFeatured', width: 80,
      render: (v: boolean) => v ? (
        <Tag color="gold" icon={<Star size={12} className="inline mr-1" />}>{t('admin.yes')}</Tag>
      ) : (
        <Tag color="default">{t('admin.no')}</Tag>
      ),
    },
    {
      title: t('admin.status'), dataIndex: 'status', width: 100,
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    { title: t('admin.downloads'), dataIndex: 'downloadCount', width: 110, sorter: (a, b) => a.downloadCount - b.downloadCount },
    { title: t('admin.developerName'), dataIndex: 'developerName', width: 120, ellipsis: true },
    { title: t('admin.rating'), dataIndex: 'ratingAverage', width: 80, render: (v: number) => v?.toFixed(1) || '-' },
    { title: t('admin.createdAt'), dataIndex: 'createdAt', width: 170, render: (v: string) => v?.substring(0, 19).replace('T', ' ') },
    {
      title: t('admin.action'), width: 380, fixed: 'right',
      render: (_, record) => {
        const versionInfo = versionInfoMap.get(record.id);
        const hasVersions = versionInfo && versionInfo.allCount > 0;
        const hasPublishedVersions = versionInfo && versionInfo.publishedCount > 0;
        
        return (
          <Space size="small">
            <Button size="small" icon={<Edit size={14} />} onClick={() => navigate(`/admin/products/${record.id}/edit`)}>{t('admin.edit')}</Button>
            <Tooltip title={record.isFeatured ? t('admin.removeFeatured') : t('admin.setFeatured')}>
              <Button 
                size="small" 
                icon={record.isFeatured ? <StarOff size={14} /> : <Star size={14} />}
                onClick={() => handleToggleFeatured(record.id, record.isFeatured || false)}
              />
            </Tooltip>
            {record.status === 'DRAFT' && (
              <>
                {hasVersions && (
                  <Button size="small" onClick={() => handleAudit(record.id, 'PENDING')}>{t('admin.submitForReview') || '提交审核'}</Button>
                )}
                {hasPublishedVersions ? (
                  <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>{t('admin.launch')}</Button>
                ) : (
                  <Tooltip title={t('admin.launchNeedsPublishedVersion') || '需要至少一个已发布的版本才能推出'}>
                    <Button size="small" type="primary" disabled>{t('admin.launch')}</Button>
                  </Tooltip>
                )}
              </>
            )}
            {record.status === 'PENDING' && (
              <>
                {hasPublishedVersions ? (
                  <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>{t('admin.approve')}</Button>
                ) : (
                  <Tooltip title={t('admin.approveNeedsPublishedVersion') || '需要至少一个已发布的版本才能通过审核'}>
                    <Button size="small" type="primary" disabled>{t('admin.approve')}</Button>
                  </Tooltip>
                )}
                <Button size="small" danger onClick={() => handleAudit(record.id, 'REJECTED')}>{t('admin.reject')}</Button>
              </>
            )}
            {record.status === 'REJECTED' && (
              <Button size="small" onClick={() => handleAudit(record.id, 'PENDING')}>{t('admin.resubmit') || '重新提交'}</Button>
            )}
            {record.status === 'PUBLISHED' && (
              <Button size="small" onClick={() => handleAudit(record.id, 'ARCHIVED')}>{t('admin.archive') || '归档'}</Button>
            )}
            {record.status === 'ARCHIVED' && hasPublishedVersions && (
              <Button size="small" type="primary" onClick={() => handleAudit(record.id, 'PUBLISHED')}>{t('admin.republish') || '重新发布'}</Button>
            )}
            <Button size="small" danger onClick={() => handleDelete(record.id)}>{t('admin.delete')}</Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.products')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.manageProducts')}</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} className="h-9" onClick={() => navigate('/admin/products/new')}>
          {t('admin.newProduct')}
        </Button>
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
            className="w-44 h-9"
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setProductFilter(undefined); setPage(1); }}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
          
          {/* 排序规则 */}
          {categoryFilter && (
            <Select
              placeholder={t('admin.sortBy') || 'Sort By'}
              className="w-40 h-9"
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
          
          {/* 精选筛选 */}
          <Select 
            placeholder={t('admin.featured') || 'Featured'} 
            allowClear 
            className="w-28"
            value={featuredFilter}
            onChange={(v) => { setFeaturedFilter(v); setPage(1); }}
            options={[
              { value: true, label: t('admin.yes') || 'Yes' },
              { value: false, label: t('admin.no') || 'No' },
            ]} 
          />
          
          <div className="border-l border-slate-300 dark:border-slate-600 h-6 mx-1" />
          
          {/* 搜索属性选择 */}
          <Select
            className="w-28"
            value={searchField}
            onChange={(v) => setSearchField(v)}
            options={[
              { value: 'all', label: t('admin.searchAll') || 'All' },
              { value: 'id', label: t('admin.productId') || 'Product ID' },
              { value: 'name', label: t('admin.productName') || 'Name' },
              { value: 'slug', label: t('admin.slug') || 'Slug' },
              { value: 'developerName', label: t('admin.developerName') || 'Developer Name' },
            ]}
          />
          
          {/* 搜索框 */}
          <Input 
            prefix={<Search size={14} className="text-slate-400 shrink-0" />}
            placeholder={t('admin.searchProduct')}
            allowClear 
            className="w-48 md:w-64 h-10"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { 
              setPage(1); 
              loadData(); 
            }} 
          />
          
          <Button type="primary" size="small" onClick={() => { setPage(1); loadData(); }}>
            {t('common.search') || 'Search'}
          </Button>
          
          {/* 清除筛选 */}
          {(categoryFilter || statusFilter || productFilter || featuredFilter !== undefined || keyword) && (
            <Button 
              size="small" 
              onClick={() => {
                setCategoryFilter(undefined);
                setProductFilter(undefined);
                setStatusFilter(undefined);
                setFeaturedFilter(undefined);
                setSearchField('all');
                setKeyword('');
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

import { useState, useEffect, useMemo } from 'react';
import { Table, Space, Tag, Button, Modal, Select, Card, Input } from 'antd';
import { message } from '@/utils/antdUtils';
import { adminApi, categoryApi, productApi } from '@/utils/api';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { Check, X, Trash2, Filter, Search } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface ProductOption {
  id: number;
  name: string;
  downloadCount: number;
  ratingAverage: number;
  ratingCount: number;
}

export default function AdminComments() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  
  // 多级筛选状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productFilter, setProductFilter] = useState<number | undefined>();
  const [productSortBy, setProductSortBy] = useState<string>('downloads');
  const [commentSortBy, setCommentSortBy] = useState<string>('time');
  const [commentSortOrder, setCommentSortOrder] = useState<string>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<'all' | 'commentId' | 'productId' | 'userId' | 'username' | 'email' | 'content'>('all');

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

  useEffect(() => { loadData(); }, [page, statusFilter, productFilter, commentSortBy, commentSortOrder]);

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
    switch (productSortBy) {
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
  }, [products, productSortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, size: 20 };
      if (statusFilter) params.status = statusFilter;
      if (productFilter) params.productId = productFilter;
      if (searchQuery) {
        // 根据搜索类型构建搜索参数
        if (searchType === 'all') {
          params.keyword = searchQuery;
        } else {
          // 精确搜索：添加类型前缀
          params.keyword = `${searchType}:${searchQuery}`;
        }
      }
      
      const res: any = await adminApi.listComments(params);
      let records = res.data.records || [];
      
      // 前端排序评论
      const isAsc = commentSortOrder === 'asc';
      switch (commentSortBy) {
        case 'rating':
          records.sort((a: any, b: any) => isAsc ? (a.rating || 0) - (b.rating || 0) : (b.rating || 0) - (a.rating || 0));
          break;
        case 'likes':
          records.sort((a: any, b: any) => isAsc ? (a.likeCount || 0) - (b.likeCount || 0) : (b.likeCount || 0) - (a.likeCount || 0));
          break;
        case 'replies':
          records.sort((a: any, b: any) => isAsc ? (a.replyCount || 0) - (b.replyCount || 0) : (b.replyCount || 0) - (a.replyCount || 0));
          break;
        case 'time':
        default:
          records.sort((a: any, b: any) => isAsc 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
      
      setData(records);
      setTotal(res.data.total);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const handleAudit = (id: number, status: string) => {
    Modal.confirm({
      title: status === 'PUBLISHED' ? t('admin.confirmApprove') : t('admin.confirmReject'),
      onOk: async () => {
        try {
          await adminApi.auditComment(id, status);
          message.success(t('admin.operationSuccess'));
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('admin.confirmDelete'),
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteComment(id);
          message.success(t('admin.deleteSuccess'));
          loadData();
        } catch { /* handled */ }
      },
    });
  };

  const columns: ColumnsType<any> = [
    { title: t('admin.id'), dataIndex: 'id', width: 60 },
    { title: t('admin.content'), dataIndex: 'content', ellipsis: true, width: 200 },
    { title: t('admin.rating'), dataIndex: 'rating', width: 70, render: (v: number) => v ? <span className="text-amber-500 font-bold">{v} ★</span> : '-' },
    { title: t('admin.likeCount'), dataIndex: 'likeCount', width: 90, render: (v: number) => <span className="text-blue-500">{v || 0}</span> },
    { title: t('admin.replyCount'), dataIndex: 'replyCount', width: 90, render: (v: number) => <span className="text-green-500">{v || 0}</span> },
    { title: t('admin.productId'), dataIndex: 'productId', width: 80 },
    { title: t('admin.userId'), dataIndex: 'userId', width: 80 },
    { title: t('admin.parentId'), dataIndex: 'parentId', width: 80, render: (v: number) => v ? <span className="text-purple-500">{v}</span> : '-' },
    {
      title: t('admin.status'), dataIndex: 'status', width: 100,
      render: (s: string) => (
        <Tag color={s === 'PUBLISHED' ? 'green' : s === 'PENDING' ? 'orange' : 'red'}>{s}</Tag>
      ),
    },
    { title: t('admin.createdAt'), dataIndex: 'createdAt', width: 160, render: (v: string) => v?.substring(0, 19).replace('T', ' ') },
    {
      title: t('admin.action'), width: 140, fixed: 'right',
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.moderateComments') || 'Review and moderate user comments'}</p>
        </div>
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
          
          {/* 产品排序规则 */}
          {categoryFilter && (
            <Select
              placeholder={t('admin.productSortBy') || 'Product Sort'}
              className="w-40 h-9"
              value={productSortBy}
              onChange={(v) => { setProductSortBy(v); setProductFilter(undefined); }}
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
              className="w-52 h-9"
              value={productFilter}
              onChange={(v) => { setProductFilter(v); setPage(1); }}
              options={sortedProducts.map(p => ({
                value: p.id,
                label: `${p.name} (${productSortBy === 'rating' ? p.ratingAverage.toFixed(1) : productSortBy === 'comments' ? p.ratingCount : p.downloadCount})`,
              }))}
            />
          )}
          
          {/* 评论排序规则 - 与产品详情页一致 */}
          <Select
            placeholder={t('admin.commentSortBy') || 'Comment Sort'}
            className="w-36 h-9"
            value={commentSortBy}
            onChange={(v) => { setCommentSortBy(v); }}
            options={[
              { value: 'time', label: t('productDetail.sortByTime') || 'Time' },
              { value: 'likes', label: t('productDetail.sortByLikes') || 'Likes' },
              { value: 'rating', label: t('productDetail.sortByRating') || 'Rating' },
              { value: 'replies', label: t('productDetail.sortByReplies') || 'Replies' },
            ]}
          />
          
          {/* 排序顺序 */}
          <Select
            className="w-20 h-9"
            value={commentSortOrder}
            onChange={(v) => { setCommentSortOrder(v); }}
            options={[
              { value: 'desc', label: '↓' },
              { value: 'asc', label: '↑' },
            ]}
          />
          
          {/* 搜索框 */}
          <div className="flex items-center gap-2">
            <Select
              value={searchType}
              onChange={setSearchType}
              className="w-32 h-10"
              options={[
                { value: 'all', label: t('admin.searchAll') || '全部' },
                { value: 'commentId', label: t('admin.commentId') || '评论ID' },
                { value: 'productId', label: t('admin.productId') || '产品ID' },
                { value: 'userId', label: t('admin.userId') || '用户ID' },
                { value: 'username', label: t('admin.username') || '用户名' },
                { value: 'email', label: t('admin.email') || '邮箱' },
                { value: 'content', label: t('admin.content') || '内容' },
              ]}
            />
            <Input
              placeholder={
                searchType === 'all' 
                  ? (t('admin.searchUserIdEmail') || '搜索用户名/邮箱/ID/内容')
                  : searchType === 'commentId' 
                    ? (t('admin.searchCommentId') || '输入评论ID')
                    : searchType === 'productId'
                      ? (t('admin.searchProductId') || '输入产品ID')
                      : searchType === 'userId'
                        ? (t('admin.searchUserId') || '输入用户ID')
                        : searchType === 'username'
                          ? (t('admin.searchUsername') || '输入用户名')
                          : searchType === 'email'
                            ? (t('admin.searchEmail') || '输入邮箱')
                            : (t('admin.searchContent') || '输入评论内容')
              }
              allowClear
              className="w-64 md:w-80 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={(e) => { 
                const value = e.currentTarget.value;
                setSearchQuery(value);
                setPage(1); 
                loadData(); 
              }}
              prefix={<Search size={14} className="text-slate-400 shrink-0" />}
            />
          </div>
          
          {/* 状态筛选 */}
          <Select 
            placeholder={t('admin.status') || 'Status'} 
            allowClear 
            className="w-36 h-9"
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={[
              { value: 'PENDING', label: t('admin.pending') || 'Pending' },
              { value: 'PUBLISHED', label: t('admin.published') || 'Published' },
              { value: 'REJECTED', label: t('admin.rejected') || 'Rejected' },
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
                setProductSortBy('downloads');
                setCommentSortBy('rating');
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
          scroll={{ x: 1000 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (total) => `${t('admin.total')} ${total} ${t('admin.items')}` }} 
        />
      </Card>
    </div>
  );
}

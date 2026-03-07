import { useState, useEffect, useCallback } from 'react';
import { Input, Select, Pagination, Spin, Empty, Tag, Card } from 'antd';
import { Search, Download, Star, Eye, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productApi, categoryApi } from '@/utils/api';

type ProductItem = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean;
  downloadCount?: number;
  ratingAverage?: number;
  viewCount?: number;
};

type CategoryItem = {
  id: number;
  name: string;
};

type PageResponse<T> = {
  records: T[];
  total: number;
};

type ApiResponse<T> = {
  data: T;
};

export default function Products() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get('page')) || 1;
  const categoryId = searchParams.get('category') ? Number(searchParams.get('category')) : undefined;
  const sort = searchParams.get('sort') || 'latest';
  const keyword = searchParams.get('q') || '';

  const loadCategories = useCallback(async () => {
    try {
      const res = await categoryApi.getAll() as ApiResponse<CategoryItem[]>;
      setCategories(res.data || []);
    } catch { /* handled */ }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.list({
        page,
        size: 12,
        categoryId,
        sort: sort === 'latest' ? undefined : sort,
        keyword: keyword || undefined
      }) as ApiResponse<PageResponse<ProductItem>>;
      setProducts(res.data?.records || []);
      setTotal(res.data?.total || 0);
    } catch { /* handled */ } finally { setLoading(false); }
  }, [page, categoryId, sort, keyword]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    if (updates.page === undefined && !('page' in updates)) params.set('page', '1');
    setSearchParams(params);
  };

  const categoryOptions = [
    { value: '', label: t('product.allCategories') || 'All Categories' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen bg-white dark:bg-slate-950">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('product.allProducts') || 'All Products'}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('product.browseDesc') || 'Explore our collection of high-quality applications.'}</p>
        </div>
        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
          {t('product.totalFound', { total }) || `Total ${total} products found`}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder={t('common.search') || 'Search products...'}
          defaultValue={keyword}
          className="w-full md:w-80"
          allowClear
          prefix={<Search size={16} className="text-slate-400" />}
          onPressEnter={(e) => updateParams({ q: e.currentTarget.value || undefined, page: '1' })}
        />
        
        <Select
          value={categoryId ? String(categoryId) : ''}
          className="w-full md:w-48"
          options={categoryOptions}
          onChange={(v) => updateParams({ category: v || undefined, page: '1' })}
          suffixIcon={<Filter size={14} />}
        />
        
        <Select
          value={sort}
          className="w-full md:w-48"
          onChange={(v) => updateParams({ sort: v, page: '1' })}
          options={[
            { value: 'latest', label: t('product.sortLatest') || 'Latest' },
            { value: 'downloads', label: t('product.sortDownloads') || 'Most Downloaded' },
            { value: 'rating', label: t('product.sortRating') || 'Highest Rated' },
            { value: 'name', label: t('product.sortName') || 'Name (A-Z)' },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      ) : products.length === 0 ? (
        <Empty
          description={<span className="text-slate-500 dark:text-slate-400">{t('product.noProducts')}</span>}
          className="py-20"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products.map((p) => (
              <Card
                key={p.id}
                hoverable
                className="overflow-hidden border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                styles={{ body: { padding: '1.5rem' } }}
                onClick={() => navigate(`/products/${p.slug}`)}
                cover={
                  <div className="h-40 bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 relative group">
                    {p.iconUrl ? (
                      <img
                        src={p.iconUrl}
                        alt={p.name}
                        className="h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-3xl font-bold text-slate-300 dark:text-slate-500">
                        {(p.name || 'Q')[0]}
                      </div>
                    )}
                    {p.isFeatured && (
                      <Tag color="gold" className="absolute top-2 right-2 m-0 border-none">{t('home.featured')}</Tag>
                    )}
                  </div>
                }
              >
                <div className="mb-1">
                  {p.categoryName && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      {p.categoryName}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 truncate">{p.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 h-10">
                  {p.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Download size={14} /> {p.downloadCount ?? 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" /> {(p.ratingAverage ?? 0).toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={14} /> {p.viewCount ?? 0}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {total > 12 && (
            <div className="flex justify-center">
              <Pagination
                current={page}
                total={total}
                pageSize={12}
                onChange={(p) => updateParams({ page: String(p) })}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

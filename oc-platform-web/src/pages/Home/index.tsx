import { useState, useEffect, useCallback } from 'react';
import { Input, Button, Tag, Skeleton, Empty } from 'antd';
import { Search, ArrowRight, Star, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productApi, categoryApi } from '@/utils/api';
import { useAppSelector } from '@/store/hooks';
import FeedbackSection from '@/components/home/FeedbackSection';
import InfoCards from '@/components/home/InfoCards';

type ProductItem = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  isFeatured?: boolean;
  downloadCount?: number;
  ratingAverage?: number;
};

type CategoryItem = {
  id: number;
  name: string;
};

type ApiResponse<T> = {
  data: T;
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { config } = useAppSelector((state) => state.siteConfig);
  const siteName = i18n.language === 'zh-CN' ? config.siteName : config.siteNameEn;
  const displayName = siteName || '桐人创研';
  const [featured, setFeatured] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [featRes, catRes] = await Promise.all([
        productApi.getFeatured(),
        categoryApi.getAll()
      ]);
      setFeatured((featRes as ApiResponse<ProductItem[]>).data || []);
      setCategories((catRes as ApiResponse<CategoryItem[]>).data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    navigate(`/products?q=${encodeURIComponent(value)}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8">
            {t('home.welcomeTo')} <span className="text-blue-600">{displayName}</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 mb-12">
            {t('home.heroDesc')}
          </p>
          
          <div className="max-w-xl mx-auto mb-12 relative">
            <Input
              size="large"
              placeholder={t('home.searchPlaceholder')}
              prefix={<Search className="text-slate-400 mr-2" size={20} />}
              className="h-14 text-lg rounded-full shadow-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white pl-6"
              onPressEnter={(e) => handleSearch(e.currentTarget.value)}
              onChange={(e) => setKeyword(e.target.value)}
              suffix={
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<ArrowRight size={20} />} 
                  className="bg-blue-600 border-none"
                  onClick={() => handleSearch(keyword)}
                />
              }
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.slice(0, 6).map((cat) => (
              <Tag 
                key={cat.id} 
                className="px-4 py-2 text-sm rounded-full cursor-pointer bg-slate-100 dark:bg-slate-900 border-none text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={() => navigate(`/products?category=${cat.id}`)}
              >
                {cat.name}
              </Tag>
            ))}
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('home.featuredProducts')}</h2>
              <p className="text-slate-500 dark:text-slate-400">{t('home.handPicked')}</p>
            </div>
            <Button type="link" onClick={() => navigate('/products')} className="flex items-center gap-1">
              {t('home.viewAll')} <ArrowRight size={16} />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} active avatar paragraph={{ rows: 2 }} />)}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featured.map((product) => (
                <div 
                  key={product.id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-800 cursor-pointer"
                  onClick={() => navigate(`/products/${product.slug}`)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-2xl font-bold text-slate-400">
                      {product.iconUrl ? (
                        <img src={product.iconUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        product.name[0]
                      )}
                    </div>
                      {product.isFeatured && <Tag color="gold" className="rounded-full px-2 border-none">{t('home.featured')}</Tag>}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                    {product.description || t('home.noDescription')}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <Download size={14} /> {product.downloadCount ?? 0}
                    </div>
                    <div className="flex items-center gap-1" title={t('rating.title')}>
                      <Star size={14} className="text-amber-400 fill-amber-400" /> {(product.ratingAverage ?? 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description={t('home.noFeatured')} />
          )}
        </div>
      </section>

      {/* Feedback & Info Section */}
      <section id="feedback" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeedbackSection />
          <InfoCards />
        </div>
      </section>
    </div>
  );
}

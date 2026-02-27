import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { productApi, commentApi } from '@/utils/api';
import { Button, Tag, Tabs, Rate, Avatar, Form, Input, message, Spin, Empty, Card, Progress } from 'antd';
const { TextArea } = Input;
import { Github, ExternalLink, Star, Clock, Eye, Download as DownloadIcon, Terminal, Shield, CheckCircle, Tag as TagIcon, User, Play, Pause, Volume2, VolumeX, Maximize, ThumbsUp, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ScreenshotGallery from '@/components/ScreenshotGallery';

// Video Player Component
const VideoPlayer = ({ src, poster }: { src: string; poster?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black group">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      {/* Play overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <Play size={36} className="text-slate-900 ml-1" />
          </div>
        </div>
      )}
      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <Progress percent={progress} showInfo={false} strokeColor="#3b82f6" trailColor="rgba(255,255,255,0.2)" size="small" />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors" title={isPlaying ? 'Pause' : 'Play'} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors" title={isMuted ? 'Unmute' : 'Mute'} aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
          <button onClick={handleFullscreen} className="text-white hover:text-blue-400 transition-colors" title="Fullscreen" aria-label="Fullscreen">
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Markdown Renderer Component
const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;
  
  const lines = content.split('\n');
  return (
    <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4">{line.replace('## ', '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-slate-900 dark:text-white mt-8 mb-6">{line.replace('# ', '')}</h1>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.replace('- ', '')}</li>;
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-blue-500 pl-4 italic text-slate-500 my-4">{line.replace('> ', '')}</blockquote>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
};

// Mock Data
const MOCK_PRODUCT = {
  id: 999,
  name: 'Qt Creator Ultimate',
  slug: 'qt-creator-ultimate',
  description: `# Qt Creator Ultimate Edition

The most powerful IDE for Qt development, enhanced with AI capabilities and advanced profiling tools.

## Key Features

- **Intelligent Code Completion**: Powered by latest LLMs to suggest code snippets.
- **Real-time Profiling**: Analyze CPU and memory usage as you code.
- **Cross-Platform Deployment**: One-click deploy to Windows, macOS, Linux, Android, and iOS.
- **Integrated Design Tools**: Drag-and-drop UI builder with support for Qt Quick and Widgets.

## What's New in v5.0

> "This release changes everything we know about Qt development." - TechReview

- Added support for Qt 6.8 LTS
- New dark mode theme
- Improved CMake integration
- 50% faster indexing speed

### System Requirements

- OS: Windows 10/11, macOS 12+, Ubuntu 22.04+
- RAM: 8GB (16GB recommended)
- Disk: 2GB free space
`,
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Qt_logo_2016.svg',
  categoryName: 'Development Tools',
  license: 'GPLv3',
  isFeatured: true,
  downloadCount: 12580,
  viewCount: 45020,
  ratingAverage: 4.8,
  homepageUrl: 'https://www.qt.io',
  sourceUrl: 'https://github.com/qt/qt5',
  username: 'QtCompany',
  updatedAt: '2026-05-15T10:30:00',
  tags: ['IDE', 'C++', 'QML', 'Cross-Platform'],
};

const MOCK_VERSIONS = [
  { id: 1, versionNumber: 'v5.0.0', platform: 'Windows', fileSize: 450 * 1024 * 1024, isLatest: true, createdAt: '2026-05-15' },
  { id: 2, versionNumber: 'v5.0.0', platform: 'macOS', fileSize: 480 * 1024 * 1024, isLatest: true, createdAt: '2026-05-15' },
  { id: 3, versionNumber: 'v5.0.0', platform: 'Linux', fileSize: 420 * 1024 * 1024, isLatest: true, createdAt: '2026-05-15' },
  { id: 4, versionNumber: 'v4.9.2', platform: 'Windows', fileSize: 440 * 1024 * 1024, isLatest: false, createdAt: '2026-04-01' },
];


export default function ProductDetail() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const isEnglish = i18n.language === 'en-US' || i18n.language === 'en';

  const [product, setProduct] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [_commentLoading, setCommentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [commentSortBy, setCommentSortBy] = useState<string>('time');
  const [commentSortOrder, setCommentSortOrder] = useState<string>('desc');
  const [replyingTo, setReplyingTo] = useState<{id: number, name: string} | null>(null);

  useEffect(() => { 
    if (slug) {
      loadProduct(); 
    }
  }, [slug]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      // Try to fetch real data first
      const res: any = await productApi.getBySlug(slug!);
      if (res.data) {
        setProduct(res.data);
        if (res.data.id) {
          loadVersions(res.data.id);
          loadComments(res.data.id, 1);
        }
      } else {
        // Fallback to Mock data if API returns empty but no error (rare) or specific mock slug
        if (slug === 'mock-product' || slug === 'qt-creator-ultimate') {
           useMockData();
        }
      }
    } catch (err) {
      // Fallback to Mock Data on error (for demonstration)
      console.log('API failed, using mock data');
      useMockData();
    } finally { 
      setLoading(false); 
    }
  };

  const useMockData = () => {
    setProduct(MOCK_PRODUCT);
    setVersions(MOCK_VERSIONS);
    setComments([]);
    setCommentTotal(0);
  };

  const loadVersions = async (productId: number) => {
    try {
      const res: any = await productApi.getVersions(productId);
      setVersions(res.data || []);
    } catch { /* handled */ }
  };

  const loadComments = async (productId: number, page: number, sortBy?: string, sortOrder?: string) => {
    setCommentLoading(true);
    try {
      const res: any = await commentApi.getProductComments(productId, { 
        page, 
        size: 10,
        sortBy: sortBy || commentSortBy,
        sortOrder: sortOrder || commentSortOrder
      });
      setComments(res.data.records || []);
      setCommentTotal(res.data.total || 0);
    } catch { /* handled */ } finally { setCommentLoading(false); }
  };

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    setCommentSortBy(sortBy);
    setCommentSortOrder(sortOrder);
    if (product?.id) {
      loadComments(product.id, 1, sortBy, sortOrder);
    }
  };

  const handleLikeComment = async (commentId: number, liked: boolean) => {
    if (!isAuthenticated) {
      message.warning(t('productDetail.loginToLike'));
      return;
    }
    try {
      if (liked) {
        await commentApi.unlike(commentId);
      } else {
        await commentApi.like(commentId);
      }
      // Refresh comments
      if (product?.id) {
        loadComments(product.id, 1);
      }
    } catch {
      message.error(t('productDetail.likeFailed'));
    }
  };

  const handleReplyComment = (commentId: number, userName: string) => {
    setReplyingTo({ id: commentId, name: userName });
    form.setFieldsValue({ content: `@${userName} ` });
    // Scroll to comment form
    const formElement = document.querySelector('.comment-form-card');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    form.setFieldsValue({ content: '' });
  };

  const handleComment = async (values: any) => {
    if (!product) return;
    setSubmitting(true);
    try {
      const payload: any = { content: values.content, rating: values.rating };
      if (replyingTo) {
        payload.parentId = replyingTo.id;
      }
      await commentApi.create(product.id, payload);
      message.success('Comment submitted, pending review');
      form.resetFields();
      setReplyingTo(null);
      loadComments(product.id, 1);
    } catch { 
       message.success('(Mock) Comment submitted successfully!');
       setComments([{ id: Date.now(), nickname: 'You', content: values.content, rating: values.rating, createdAt: new Date().toISOString() }, ...comments]);
       form.resetFields();
       setReplyingTo(null);
    } finally { setSubmitting(false); }
  };

  const handleDownload = async (versionId: number, fileRecordId?: number) => {
    try {
      // Increment download count
      await productApi.incrementVersionDownload(versionId);
      if (product?.id) {
        await productApi.incrementDownload(product.id);
      }
    } catch (err) {
      console.error('Download count error:', err);
    }
    
    // 使用后端完整URL进行下载（window.open不走Vite代理）
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
    const downloadPath = fileRecordId 
      ? `/api/v1/files/download/${fileRecordId}` 
      : `/api/v1/files/download/version/${versionId}`;
    window.open(`${baseUrl}${downloadPath}`, '_blank');
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spin size="large" /></div>;
  if (!product) return <div className="flex justify-center items-center min-h-[60vh]"><Empty description={t('productDetail.productNotFound')} /></div>;

  const latestVersion = versions.find((v: any) => v.isLatest) || versions[0];
  
  // 根据当前语言选择显示内容
  const displayName = (isEnglish && product.nameEn) ? product.nameEn : product.name;
  const displayDescription = (isEnglish && product.descriptionEn) ? product.descriptionEn : product.description;

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-20 pb-16 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Icon */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden shadow-xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-700">
              {product.iconUrl ? (
                <img src={product.iconUrl} alt={product.name} className="w-full h-full object-cover p-4" />
              ) : (
                <span className="text-5xl font-bold text-slate-400">{product.name?.[0]}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">{displayName}</h1>
                {product.isFeatured && <Tag color="gold" className="px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border-none">Featured</Tag>}
              </div>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl leading-relaxed">
                {displayDescription ? displayDescription.split('\n')[0].substring(0, 150) + '...' : t('home.noDescription')}
              </p>

              <div className="flex flex-wrap gap-4">
                {latestVersion && (
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<DownloadIcon size={20} />} 
                    className="h-14 px-8 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 border-none shadow-lg shadow-blue-600/20"
                    onClick={() => handleDownload(latestVersion.id, latestVersion.fileRecordId)}
                  >
                    {t('productDetail.download')} {latestVersion.versionNumber}
                  </Button>
                )}
                {product.homepageUrl && (
                  <Button size="large" icon={<ExternalLink size={20} />} href={product.homepageUrl} target="_blank" className="h-14 px-6 rounded-xl">
                    {t('productDetail.website')}
                  </Button>
                )}
                {product.sourceUrl && (
                  <Button size="large" icon={<Github size={20} />} href={product.sourceUrl} target="_blank" className="h-14 px-6 rounded-xl">
                    {t('productDetail.source')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-900 p-6 text-center group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center justify-center gap-1.5 font-medium"><DownloadIcon size={16}/> {t('productDetail.downloads')}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{product.downloadCount?.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-6 text-center group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center justify-center gap-1.5 font-medium"><Star size={16}/> {t('productDetail.rating')}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">{product.ratingAverage?.toFixed(1)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-6 text-center group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center justify-center gap-1.5 font-medium"><Eye size={16}/> {t('productDetail.views')}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{product.viewCount?.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-6 text-center group hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center justify-center gap-1.5 font-medium"><Clock size={16}/> {t('productDetail.updated')}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{product.updatedAt?.substring(0, 10)}</div>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs 
              items={[
                {
                  key: 'overview',
                  label: t('productDetail.overview'),
                  children: (
                    <div className="bg-white dark:bg-slate-900 mt-4 p-6 space-y-8 min-h-[400px]">
                      {/* Demo Video */}
                      {product.demoVideoUrl && (
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('productDetail.demoVideo')}</h3>
                          <VideoPlayer src={product.demoVideoUrl} poster={product.bannerUrl} />
                        </div>
                      )}
                      {/* Screenshots */}
                      {product.screenshots && product.screenshots.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('productDetail.screenshots')}</h3>
                          <ScreenshotGallery screenshots={product.screenshots} />
                        </div>
                      )}
                      {/* Description */}
                      <MarkdownRenderer content={displayDescription} />
                    </div>
                  )
                },
                {
                  key: 'versions',
                  label: `${t('productDetail.versions')} (${versions.length})`,
                  children: (
                    <div className="mt-4 space-y-3">
                      {versions.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-slate-50 dark:bg-slate-900/50">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-slate-900 dark:text-white">{v.versionNumber}</span>
                              {v.isLatest && <Tag color="green" className="rounded-full px-2">{t('productDetail.latest')}</Tag>}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1"><Terminal size={12}/> {v.platform}</span>
                              <span>•</span>
                              <span>{v.createdAt?.substring(0, 10)}</span>
                            </div>
                          </div>
                          <Button type="primary" ghost icon={<DownloadIcon size={16} />} onClick={() => handleDownload(v.id, v.fileRecordId)}>
                            {formatSize(v.fileSize)}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  key: 'comments',
                  label: `${t('productDetail.reviews')} (${commentTotal})`,
                  children: (
                    <div className="mt-6 space-y-8">
                      {isAuthenticated ? (
                        <Card className="comment-form-card dark:bg-slate-900 dark:border-slate-800 shadow-sm" styles={{ body: { padding: '1.5rem' } }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {replyingTo ? `${t('productDetail.reply')} @${replyingTo.name}` : t('productDetail.writeReview')}
                            </h3>
                            {replyingTo && (
                              <Button size="small" onClick={cancelReply}>{t('common.cancel')}</Button>
                            )}
                          </div>
                          <Form form={form} onFinish={handleComment} layout="vertical">
                            {!replyingTo && (
                              <Form.Item name="rating" label={t('productDetail.rating')} initialValue={5}>
                                <Rate />
                              </Form.Item>
                            )}
                            <Form.Item name="content" rules={[{ required: true, message: t('productDetail.commentPlaceholder') }]}>
                              <TextArea rows={4} placeholder={t('productDetail.commentPlaceholder')} className="rounded-xl resize-none" />
                            </Form.Item>
                            <div className="flex justify-end">
                              <Button type="primary" htmlType="submit" loading={submitting}>{t('productDetail.submitReview')}</Button>
                            </div>
                          </Form>
                        </Card>
                      ) : (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <p className="text-slate-600 dark:text-slate-400 mb-4">{t('productDetail.loginToReview')}</p>
                          <Link to="/login"><Button type="primary">{t('productDetail.login')}</Button></Link>
                        </div>
                      )}
                      
                      {/* Sort Options */}
                      {comments.length > 0 && (
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-sm text-slate-500 dark:text-slate-400">{t('productDetail.sortBy')}:</span>
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="small" 
                              type={commentSortBy === 'time' ? 'primary' : 'default'}
                              onClick={() => handleSortChange('time', commentSortOrder === 'desc' && commentSortBy === 'time' ? 'asc' : 'desc')}
                            >
                              {t('productDetail.sortByTime')} {commentSortBy === 'time' && (commentSortOrder === 'desc' ? '↓' : '↑')}
                            </Button>
                            <Button 
                              size="small" 
                              type={commentSortBy === 'likes' ? 'primary' : 'default'}
                              onClick={() => handleSortChange('likes', commentSortOrder === 'desc' && commentSortBy === 'likes' ? 'asc' : 'desc')}
                            >
                              {t('productDetail.sortByLikes')} {commentSortBy === 'likes' && (commentSortOrder === 'desc' ? '↓' : '↑')}
                            </Button>
                            <Button 
                              size="small" 
                              type={commentSortBy === 'rating' ? 'primary' : 'default'}
                              onClick={() => handleSortChange('rating', commentSortOrder === 'desc' && commentSortBy === 'rating' ? 'asc' : 'desc')}
                            >
                              {t('productDetail.sortByRating')} {commentSortBy === 'rating' && (commentSortOrder === 'desc' ? '↓' : '↑')}
                            </Button>
                            <Button 
                              size="small" 
                              type={commentSortBy === 'replies' ? 'primary' : 'default'}
                              onClick={() => handleSortChange('replies', commentSortOrder === 'desc' && commentSortBy === 'replies' ? 'asc' : 'desc')}
                            >
                              {t('productDetail.sortByReplies')} {commentSortBy === 'replies' && (commentSortOrder === 'desc' ? '↓' : '↑')}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-6">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-4">
                            <Avatar className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md mt-1">{c.nickname?.[0] || c.username?.[0] || 'U'}</Avatar>
                            <div className="flex-1">
                              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-slate-900 dark:text-white">{c.nickname || c.username || 'User'}</h4>
                                  <span className="text-xs text-slate-400">{c.createdAt?.substring(0, 10)}</span>
                                </div>
                                {c.rating && <div className="mb-2"><Rate disabled defaultValue={c.rating} style={{ fontSize: 12 }} /></div>}
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{c.content}</p>
                                <div className="mt-3 flex items-center gap-4">
                                  <button 
                                    onClick={() => handleLikeComment(c.id, c.liked)}
                                    className={`flex items-center gap-1 text-sm transition-colors ${c.liked ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                                  >
                                    <ThumbsUp size={14} className={c.liked ? 'fill-current' : ''} />
                                    <span>{c.likeCount || 0}</span>
                                  </button>
                                  {isAuthenticated && (
                                    <button 
                                      onClick={() => handleReplyComment(c.id, c.nickname || c.username)}
                                      className="flex items-center gap-1 text-sm text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                      <MessageCircle size={14} />
                                      <span>{t('productDetail.reply')}</span>
                                    </button>
                                  )}
                                  {c.replyCount > 0 && (
                                    <span className="text-xs text-slate-400">{c.replyCount} {t('productDetail.sortByReplies')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {comments.length === 0 && (
                          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <p className="text-slate-600 dark:text-slate-400 mb-4">{t('productDetail.noReviews')}</p>
                            {isAuthenticated ? (
                              <Button type="link" className="text-blue-600 hover:text-blue-700">{t('productDetail.beFirstToReview')}</Button>
                            ) : (
                              <Link to="/login"><Button type="primary">{t('productDetail.login')}</Button></Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            <Card title={t('productDetail.information')} bordered={false} className="shadow-sm dark:bg-slate-900 dark:border-slate-800 sticky top-24">
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 flex items-center gap-2"><Shield size={16}/> {t('productDetail.license')}</span>
                  <span className="font-medium dark:text-slate-200">{product.license || 'Proprietary'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 flex items-center gap-2"><TagIcon size={16}/> {t('productDetail.category')}</span>
                  <span className="font-medium dark:text-slate-200">{product.categoryName || 'Uncategorized'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 flex items-center gap-2"><CheckCircle size={16}/> {t('productDetail.version')}</span>
                  <span className="font-medium dark:text-slate-200">{latestVersion?.versionNumber || '-'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 flex items-center gap-2"><User size={16} /> {t('productDetail.developer')}</span>
                  <span className="font-medium dark:text-slate-200">{product.username || 'Official'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

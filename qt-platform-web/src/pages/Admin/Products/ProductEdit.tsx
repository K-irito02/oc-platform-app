import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Upload, message, Spin, Tabs, Image, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { adminApi, categoryApi, fileApi } from '@/utils/api';
import { ArrowLeft, Upload as UploadIcon, Plus, Trash2, Play, Image as ImageIcon, Film, Package } from 'lucide-react';
import type { UploadProps } from 'antd/es/upload/interface';

const { TextArea } = Input;

interface ProductData {
  id: number;
  name: string;
  nameEn?: string;
  slug: string;
  description: string;
  descriptionEn?: string;
  categoryId: number;
  status: string;
  iconUrl?: string;
  bannerUrl?: string;
  screenshots?: string[];
  demoVideoUrl?: string;
  homepageUrl?: string;
  sourceUrl?: string;
  license?: string;
  tags?: string[];
  isFeatured?: boolean;
}

interface Category {
  id: number;
  name: string;
  nameEn?: string;
}

export default function ProductEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductData | null>(null);
  
  const [iconUrl, setIconUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [demoVideoUrl, setDemoVideoUrl] = useState<string>('');
  const [previewVideo, setPreviewVideo] = useState(false);

  useEffect(() => {
    loadCategories();
    if (id) {
      loadProduct(parseInt(id));
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const res: any = await categoryApi.getAll();
      setCategories(res.data || []);
    } catch (e) {
      console.error(t('productEdit.loadCategoriesFailed'), e);
    }
  };

  const loadProduct = async (productId: number) => {
    setLoading(true);
    try {
      const res: any = await adminApi.getProduct(productId);
      const data = res.data;
      setProduct(data);
      form.setFieldsValue({
        name: data.name,
        nameEn: data.nameEn,
        slug: data.slug,
        description: data.description,
        descriptionEn: data.descriptionEn,
        categoryId: data.categoryId,
        status: data.status,
        homepageUrl: data.homepageUrl,
        sourceUrl: data.sourceUrl,
        license: data.license,
        tags: data.tags?.join(', '),
        isFeatured: data.isFeatured,
      });
      setIconUrl(data.iconUrl || '');
      setBannerUrl(data.bannerUrl || '');
      setScreenshots(data.screenshots || []);
      setDemoVideoUrl(data.demoVideoUrl || '');
    } catch (e) {
      message.error(t('productEdit.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        iconUrl,
        bannerUrl,
        screenshots,
        demoVideoUrl,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      };
      
      if (id) {
        await adminApi.updateProduct(parseInt(id), payload);
        message.success(t('productEdit.updateSuccess'));
      } else {
        await adminApi.createProduct(payload);
        message.success(t('productEdit.createSuccess'));
        navigate('/admin/products');
      }
    } catch (e) {
      message.error(t('productEdit.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File, type: 'icon' | 'banner' | 'screenshot' | 'video') => {
    setUploading(true);
    try {
      let res: any;
      const productId = product?.id || 0;
      
      if (type === 'video') {
        if (productId > 0) {
          res = await fileApi.uploadProductVideo(file, productId);
        } else {
          // 新建产品时使用通用视频上传
          res = await fileApi.uploadVideo(file);
        }
      } else {
        if (productId > 0) {
          res = await fileApi.uploadProductImage(file, productId);
        } else {
          // 新建产品时使用通用图片上传
          res = await fileApi.uploadImage(file);
        }
      }
      
      // 兼容不同的响应格式
      const url = res.data?.url || res.data?.fileUrl;
      
      if (!url) {
        console.error('Upload response:', res);
        throw new Error('Upload failed - no URL returned');
      }
      
      switch (type) {
        case 'icon':
          setIconUrl(url);
          message.success(t('productEdit.iconUploaded') || 'Icon uploaded');
          break;
        case 'banner':
          setBannerUrl(url);
          message.success(t('productEdit.bannerUploaded') || 'Banner uploaded');
          break;
        case 'screenshot':
          setScreenshots(prev => [...prev, url]);
          message.success(t('productEdit.screenshotUploaded') || 'Screenshot uploaded');
          break;
        case 'video':
          setDemoVideoUrl(url);
          message.success(t('productEdit.videoUploaded') || 'Video uploaded');
          break;
      }
    } catch (e: any) {
      console.error('Upload failed:', e);
      message.error(e?.response?.data?.message || t('productEdit.uploadFailed') || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const uploadProps = (type: 'icon' | 'banner' | 'screenshot' | 'video'): UploadProps => ({
    beforeUpload: (file) => {
      handleUpload(file, type);
      return false;
    },
    showUploadList: false,
    accept: type === 'video' ? 'video/*' : 'image/*',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          icon={<ArrowLeft size={16} />} 
          onClick={() => navigate('/admin/products')}
        >
          {t('productEdit.back')}
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {id ? t('productEdit.title') : t('productEdit.newTitle')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {id ? t('productEdit.editDesc') : t('productEdit.createDesc')}
          </p>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="max-w-5xl"
      >
        <Tabs
          items={[
            {
              key: 'basic',
              label: (
                <span className="flex items-center gap-2">
                  <Package size={16} />
                  {t('productEdit.basicInfo')}
                </span>
              ),
              children: (
                <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item
                      name="name"
                      label={t('productEdit.productName')}
                      rules={[{ required: true, message: t('productEdit.productNameRequired') }]}
                    >
                      <Input placeholder={t('productEdit.productNamePlaceholder')} />
                    </Form.Item>

                    <Form.Item name="nameEn" label={t('productEdit.englishName')}>
                      <Input placeholder={t('productEdit.englishNamePlaceholder')} />
                    </Form.Item>

                    <Form.Item
                      name="slug"
                      label={t('productEdit.slug')}
                      rules={[{ required: true, message: t('productEdit.slugRequired') }]}
                    >
                      <Input placeholder={t('productEdit.slugPlaceholder')} />
                    </Form.Item>

                    <Form.Item
                      name="categoryId"
                      label={t('productEdit.category')}
                      rules={[{ required: true, message: t('productEdit.categoryRequired') }]}
                    >
                      <Select placeholder={t('productEdit.selectCategory')}>
                        {categories.map(c => (
                          <Select.Option key={c.id} value={c.id}>
                            {c.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item name="status" label={t('admin.status')}>
                      <Select>
                        <Select.Option value="DRAFT">{t('admin.draft')}</Select.Option>
                        <Select.Option value="PENDING">{t('admin.pending')}</Select.Option>
                        <Select.Option value="PUBLISHED">{t('admin.published')}</Select.Option>
                        <Select.Option value="ARCHIVED">{t('admin.archived')}</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item name="license" label={t('productEdit.license')}>
                      <Input placeholder={t('productEdit.licensePlaceholder')} />
                    </Form.Item>

                    <Form.Item name="homepageUrl" label={t('productEdit.homepageUrl')}>
                      <Input placeholder={t('productEdit.homepagePlaceholder')} />
                    </Form.Item>

                    <Form.Item name="sourceUrl" label={t('productEdit.sourceUrl')}>
                      <Input placeholder={t('productEdit.sourcePlaceholder')} />
                    </Form.Item>

                    <Form.Item name="tags" label={t('productEdit.tags')} className="md:col-span-2">
                      <Input placeholder={t('productEdit.tagsPlaceholder')} />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="description"
                    label={t('admin.description')}
                    rules={[{ required: true, message: t('productEdit.descriptionRequired') }]}
                  >
                    <TextArea rows={10} placeholder={t('productEdit.descriptionPlaceholder')} />
                  </Form.Item>

                  <Form.Item name="descriptionEn" label={t('productEdit.englishDescription')}>
                    <TextArea rows={8} placeholder={t('productEdit.englishDescriptionPlaceholder')} />
                  </Form.Item>
                </Card>
              ),
            },
            {
              key: 'media',
              label: (
                <span className="flex items-center gap-2">
                  <ImageIcon size={16} />
                  {t('productEdit.media')}
                </span>
              ),
              children: (
                <div className="space-y-6">
                  <Card 
                    title={<span className="flex items-center gap-2"><ImageIcon size={16} /> {t('productEdit.iconBanner')}</span>}
                    className="border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('productEdit.productIcon')}</label>
                        <div className="flex items-start gap-4">
                          {iconUrl ? (
                            <div className="relative group">
                              <Image
                                src={iconUrl}
                                alt={t('productEdit.productIcon')}
                                width={80}
                                height={80}
                                className="rounded-lg object-cover"
                              />
                              <Button
                                size="small"
                                danger
                                icon={<Trash2 size={14} />}
                                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setIconUrl('')}
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                              <ImageIcon size={24} className="text-slate-400" />
                            </div>
                          )}
                          <Upload {...uploadProps('icon')}>
                            <Button icon={<UploadIcon size={14} />}>{t('productEdit.uploadIcon')}</Button>
                          </Upload>
                        </div>
                        <Input
                          className="mt-2"
                          placeholder={t('productEdit.iconUrlPlaceholder')}
                          value={iconUrl}
                          onChange={(e) => setIconUrl(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">{t('productEdit.bannerImage')}</label>
                        <div className="space-y-2">
                          {bannerUrl ? (
                            <div className="relative group">
                              <Image
                                src={bannerUrl}
                                alt={t('productEdit.bannerImage')}
                                className="rounded-lg object-cover max-h-32"
                              />
                              <Button
                                size="small"
                                danger
                                icon={<Trash2 size={14} />}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setBannerUrl('')}
                              />
                            </div>
                          ) : (
                            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                              <ImageIcon size={32} className="text-slate-400" />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Upload {...uploadProps('banner')}>
                              <Button icon={<UploadIcon size={14} />}>{t('productEdit.uploadBanner')}</Button>
                            </Upload>
                          </div>
                          <Input
                            placeholder={t('productEdit.bannerUrlPlaceholder')}
                            value={bannerUrl}
                            onChange={(e) => setBannerUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card 
                    title={<span className="flex items-center gap-2"><ImageIcon size={16} /> {t('productEdit.screenshots')}</span>}
                    className="border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {screenshots.map((url, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={url}
                              alt={`${t('productEdit.screenshot')} ${index + 1}`}
                              className="rounded-lg object-cover aspect-video"
                            />
                            <Button
                              size="small"
                              danger
                              icon={<Trash2 size={14} />}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeScreenshot(index)}
                            />
                          </div>
                        ))}
                        <Upload {...uploadProps('screenshot')}>
                          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600">
                            <Plus size={24} className="text-slate-400" />
                            <span className="text-sm text-slate-500 mt-1">{t('productEdit.addScreenshot')}</span>
                          </div>
                        </Upload>
                      </div>
                      <p className="text-sm text-slate-500">
                        {t('productEdit.screenshotRecommend')}
                      </p>
                    </div>
                  </Card>

                  <Card 
                    title={<span className="flex items-center gap-2"><Film size={16} /> {t('productEdit.demoVideo')}</span>}
                    className="border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="space-y-4">
                      {demoVideoUrl ? (
                        <div className="relative">
                          <div 
                            className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer group"
                            onClick={() => setPreviewVideo(true)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <Play size={32} className="text-white ml-1" />
                              </div>
                            </div>
                            <video src={demoVideoUrl} className="w-full h-full object-cover rounded-lg opacity-50" />
                          </div>
                          <Button
                            danger
                            icon={<Trash2 size={14} />}
                            className="absolute top-2 right-2"
                            onClick={() => setDemoVideoUrl('')}
                          >
                            {t('productEdit.remove')}
                          </Button>
                        </div>
                      ) : (
                        <Upload {...uploadProps('video')}>
                          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600">
                            <Film size={48} className="text-slate-400" />
                            <span className="text-slate-500 mt-2">{t('productEdit.uploadDemoVideo')}</span>
                            <span className="text-sm text-slate-400">{t('productEdit.videoSupport')}</span>
                          </div>
                        </Upload>
                      )}
                      <Input
                        placeholder={t('productEdit.videoUrlPlaceholder')}
                        value={demoVideoUrl}
                        onChange={(e) => setDemoVideoUrl(e.target.value)}
                      />
                    </div>
                  </Card>
                </div>
              ),
            },
          ]}
        />

        <div className="flex justify-end gap-4 mt-6">
          <Button onClick={() => navigate('/admin/products')}>{t('productEdit.cancel') || 'Cancel'}</Button>
          <Button type="primary" htmlType="submit" loading={saving} disabled={uploading}>
            {id ? (t('productEdit.saveChanges') || 'Save Changes') : (t('productEdit.createProduct') || 'Create Product')}
          </Button>
        </div>
      </Form>

      <Modal
        open={previewVideo}
        onCancel={() => setPreviewVideo(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <video
          src={demoVideoUrl}
          controls
          autoPlay
          className="w-full rounded-lg"
        />
      </Modal>
    </div>
  );
}

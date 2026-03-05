import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Upload, Spin, Tabs, Image, Modal, Table, Tag, Popconfirm, Space, Switch } from 'antd';
import { message } from '@/utils/antdUtils';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { adminApi, categoryApi, fileApi } from '@/utils/api';
import { fetchPlatformConfig } from '@/store/slices/platformConfigSlice';
import { RootState, AppDispatch } from '@/store';
import { ArrowLeft, Upload as UploadIcon, Plus, Trash2, Play, Image as ImageIcon, Film, Package, HardDrive, Monitor, CheckCircle } from 'lucide-react';
import type { UploadProps } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';

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
  developerName?: string;
  displayVersions?: Record<string, number>;
}

interface ProductVersion {
  id: number;
  versionNumber: string;
  platform: string;
  architecture?: string;
  fileName: string;
  fileSize: number;
  fileRecordId?: number;
  status: string;
  isLatest?: boolean;
  showOnDetail?: boolean;
  releaseNotes?: string;
  releaseNotesEn?: string;
  createdAt?: string;
  publishedAt?: string;
}

// 临时版本（新建产品时使用，尚未保存到服务器）
interface PendingVersion {
  tempId: string; // 临时 ID
  versionNumber: string;
  platform: string;
  architecture?: string;
  minOsVersion?: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  fileRecordId: number;
  checksumSha256: string;
  checksumMd5: string;
  signature?: string;
  releaseNotes?: string;
  releaseNotesEn?: string;
  status?: string; // 版本状态，默认为DRAFT
}

// 系统平台选项
interface Category {
  id: number;
  name: string;
  nameEn?: string;
}

interface ApiResponse<T> {
  data: T;
}

interface VersionFormValues {
  versionNumber: string;
  platform: string;
  architecture?: string;
  releaseNotes?: string;
  releaseNotesEn?: string;
}

interface ProductFormValues {
  name: string;
  nameEn?: string;
  slug: string;
  description: string;
  descriptionEn?: string;
  categoryId: number;
  status?: string;
  homepageUrl?: string;
  sourceUrl?: string;
  license?: string;
  tags?: string;
  isFeatured?: boolean;
  developerName?: string;
}

interface UploadedFileData {
  id: number;
  originalName: string;
  fileSize: number;
  checksumSha256: string;
  filePath: string;
  url?: string;
  fileUrl?: string;
}

export default function ProductEdit() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { config: platformConfig, loading: platformConfigLoading } = useSelector((state: RootState) => state.platformConfig);
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
    const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [pendingVersions, setPendingVersions] = useState<PendingVersion[]>([]); // 新建产品时的临时版本
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionForm] = Form.useForm();
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ id: number; name: string; size: number; checksum: string; path: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [creating, setCreating] = useState(false); // 创建产品中
  const isNewProduct = !id;

  useEffect(() => {
    loadCategories();
    dispatch(fetchPlatformConfig());
    if (id) {
      loadProduct(parseInt(id));
      loadVersions(parseInt(id));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 根据选择的平台获取可用架构
  const getAvailableArchitectures = useCallback((platformValue: string) => {
    if (!platformConfig) return [];
    
    const platform = platformConfig.platforms.find(p => p.value === platformValue);
    if (!platform) return platformConfig.architectures;
    
    return platformConfig.architectures.filter(
      arch => platform.architectures.includes(arch.value)
    );
  }, [platformConfig]);

  // 平台选择变化时，重置架构
  const handlePlatformChange = useCallback((value: string) => {
    const availableArchs = getAvailableArchitectures(value);
    if (availableArchs.length > 0) {
      versionForm.setFieldsValue({ architecture: availableArchs[0].value });
    } else {
      versionForm.setFieldsValue({ architecture: undefined });
    }
  }, [getAvailableArchitectures, versionForm]);

  // 验证产品状态一致性
  const validateProductStatusConsistency = useCallback((): string | null => {
    if (isNewProduct) {
      // 新建产品模式
      const status = form.getFieldValue('status');
      const allCount = pendingVersions.length;
      const publishedCount = pendingVersions.filter(v => v.status === 'PUBLISHED').length;
      
      if (status === 'PENDING' && allCount === 0) {
        return t('productEdit.pendingButNoVersion');
      }
      
      if (status === 'PUBLISHED' && publishedCount === 0) {
        return t('productEdit.publishedButNoVersion');
      }
      
      return null;
    }
    
    // 编辑产品模式
    const status = product?.status;
    const allCount = versions.length;
    const publishedCount = versions.filter(v => v.status === 'PUBLISHED').length;
    
    if (status === 'PENDING' && allCount === 0) {
      return t('productEdit.pendingButNoVersion');
    }
    
    if (status === 'PUBLISHED' && publishedCount === 0) {
      return t('productEdit.publishedButNoVersion');
    }
    
    return null;
  }, [isNewProduct, product?.status, versions, pendingVersions, form, t]);

  // 监听页面离开事件
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const statusError = validateProductStatusConsistency();
      if (hasUnsavedChanges || statusError) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, validateProductStatusConsistency]);

  // 使用 useBlocker 拦截所有导航行为
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      // 只在编辑模式下拦截
      if (isNewProduct) return false;
      
      // 如果目标路径相同，不拦截
      if (currentLocation.pathname === nextLocation.pathname) return false;
      
      // 检查状态一致性
      const statusError = validateProductStatusConsistency();
      if (statusError) return true;
      
      // 检查未保存更改
      if (hasUnsavedChanges) return true;
      
      return false;
    }
  );

  // 处理 blocker 状态
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const statusError = validateProductStatusConsistency();
      
      if (statusError) {
        Modal.warning({
          title: t('productEdit.statusInconsistent'),
          content: statusError,
          okText: t('productEdit.goToFix'),
          onOk: () => {
            blocker.reset();
            setActiveTab('versions');
          }
        });
      } else if (hasUnsavedChanges) {
        Modal.confirm({
          title: t('productEdit.unsavedChanges'),
          content: t('productEdit.unsavedChangesContent'),
          okText: t('productEdit.leave'),
          cancelText: t('productEdit.stay'),
          onOk: () => blocker.proceed(),
          onCancel: () => blocker.reset(),
        });
      }
    }
  }, [blocker, hasUnsavedChanges, validateProductStatusConsistency, t]);

  // 表单变化时标记为有未保存更改
  const handleFormChange = useCallback(() => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  }, [hasUnsavedChanges]);

  // 安全导航（检查未保存更改和状态一致性）
  const safeNavigate = useCallback((path: string) => {
    // 先检查状态一致性（仅编辑模式）
    const statusError = validateProductStatusConsistency();
    
    if (statusError) {
      Modal.warning({
        title: t('productEdit.statusInconsistent'),
        content: statusError,
        okText: t('productEdit.goToFix'),
        onOk: () => {
          setActiveTab('versions');
        }
      });
      return;
    }
    
    // 原有的未保存更改检查
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: t('productEdit.unsavedChanges'),
        content: t('productEdit.unsavedChangesContent'),
        okText: t('productEdit.leave'),
        cancelText: t('productEdit.stay'),
        onOk: () => navigate(path),
      });
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate, t, validateProductStatusConsistency]);

  const loadVersions = async (productId: number) => {
    try {
      const res = await adminApi.getVersions(productId) as ApiResponse<ProductVersion[]>;
      setVersions(res.data || []);
    } catch (error) {
      console.error('Failed to load versions', error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getAll() as ApiResponse<Category[]>;
      setCategories(res.data || []);
    } catch (error) {
      console.error(t('productEdit.loadCategoriesFailed'), error);
    }
  };

  const loadProduct = async (productId: number) => {
    setLoading(true);
    try {
      const res = await adminApi.getProduct(productId) as ApiResponse<ProductData>;
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
        developerName: data.developerName,
      });
      setIconUrl(data.iconUrl || '');
      setBannerUrl(data.bannerUrl || '');
      setScreenshots(data.screenshots || []);
      setDemoVideoUrl(data.demoVideoUrl || '');
          } catch {
      message.error(t('productEdit.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 上传应用程序文件
  const handleVersionFileUpload = async (file: File) => {
    setUploadingVersion(true);
    try {
      const res = await fileApi.uploadApplication(file) as ApiResponse<UploadedFileData>;
      setUploadedFile({
        id: res.data.id,
        name: res.data.originalName,
        size: res.data.fileSize,
        checksum: res.data.checksumSha256,
        path: res.data.filePath,
      });
      versionForm.setFieldsValue({ fileName: res.data.originalName });
      message.success(t('productEdit.fileUploaded'));
    } catch {
      message.error(t('productEdit.uploadFailed'));
    } finally {
      setUploadingVersion(false);
    }
  };

  // 创建新版本（编辑模式直接保存，新建模式添加到临时列表）
  const handleCreateVersion = async (values: VersionFormValues) => {
    if (!uploadedFile) {
      message.error(t('productEdit.pleaseUploadFile'));
      return;
    }

    if (creatingVersion) {
      return; // 防止重复提交
    }

    if (isNewProduct) {
      // 新建产品模式：添加到临时版本列表
      const newPendingVersion: PendingVersion = {
        tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        versionNumber: values.versionNumber,
        platform: values.platform,
        architecture: values.architecture || 'x64',
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        filePath: uploadedFile.path,
        checksumSha256: uploadedFile.checksum,
        checksumMd5: '', // 可以后续计算
        fileRecordId: uploadedFile.id,
        releaseNotes: values.releaseNotes,
        releaseNotesEn: values.releaseNotesEn,
        status: 'DRAFT', // 默认状态为DRAFT
      };
      setPendingVersions(prev => [...prev, newPendingVersion]);
      message.success(t('productEdit.versionAdded'));
      setVersionModalOpen(false);
      versionForm.resetFields();
      setUploadedFile(null);
      setHasUnsavedChanges(true);
    } else {
      // 编辑产品模式：直接保存到服务器
      if (!product?.id) {
        message.error(t('productEdit.productNotLoaded'));
        return;
      }
      setCreatingVersion(true);
      try {
        await adminApi.createVersion(product.id, {
          versionNumber: values.versionNumber,
          platform: values.platform,
          architecture: values.architecture || 'x64',
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          filePath: uploadedFile.path,
          checksumSha256: uploadedFile.checksum,
          fileRecordId: uploadedFile.id,
          releaseNotes: values.releaseNotes,
          releaseNotesEn: values.releaseNotesEn,
          status: 'DRAFT',
        });
        message.success(t('productEdit.versionCreated'));
        setVersionModalOpen(false);
        versionForm.resetFields();
        setUploadedFile(null);
        loadVersions(product.id);
      } catch {
        // 错误已由请求拦截器统一处理并显示
      } finally {
        setCreatingVersion(false);
      }
    }
  };

  // 删除临时版本
  const handleDeletePendingVersion = (tempId: string) => {
    const version = pendingVersions.find(v => v.tempId === tempId);
    const remainingVersions = pendingVersions.filter(v => v.tempId !== tempId);
    const currentStatus = form.getFieldValue('status');
    
    // 如果删除的是最后一个已发布版本，且产品状态为 PUBLISHED
    if (version?.status === 'PUBLISHED' && pendingVersions.filter(v => v.status === 'PUBLISHED').length === 1 && currentStatus === 'PUBLISHED') {
      Modal.confirm({
        title: t('productEdit.deleteLastPublishedVersion'),
        content: t('productEdit.deleteLastPublishedVersionAutoChange'),
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onOk: () => {
          setPendingVersions(remainingVersions);
          form.setFieldsValue({ status: 'DRAFT' });
          setHasUnsavedChanges(true);
          message.info(t('productEdit.statusChangedToDraft'));
        }
      });
      return;
    }
    
    // 如果删除后没有版本，且产品状态为 PENDING
    if (remainingVersions.length === 0 && currentStatus === 'PENDING') {
      Modal.confirm({
        title: t('productEdit.statusWillChange'),
        content: t('productEdit.deleteLastVersionWarning', { status: t(`productStatus.${currentStatus}`) }),
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onOk: () => {
          setPendingVersions(remainingVersions);
          form.setFieldsValue({ status: 'DRAFT' });
          setHasUnsavedChanges(true);
          message.info(t('productEdit.statusChangedToDraft'));
        }
      });
      return;
    }
    
    // 如果删除的是已发布版本，且是最后一个（产品状态不是 PUBLISHED）
    if (version?.status === 'PUBLISHED' && pendingVersions.filter(v => v.status === 'PUBLISHED').length === 1) {
      Modal.confirm({
        title: t('productEdit.deleteLastPublishedVersion'),
        content: t('productEdit.deleteLastPublishedVersionInfo'),
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onOk: () => {
          setPendingVersions(remainingVersions);
          setHasUnsavedChanges(true);
        }
      });
      return;
    }
    
    setPendingVersions(remainingVersions);
    setHasUnsavedChanges(true);
  };

  // 发布临时版本（将状态设置为PUBLISHED）
  const handlePublishPendingVersion = (tempId: string) => {
    setPendingVersions(prev => 
      prev.map(v => v.tempId === tempId ? { ...v, status: 'PUBLISHED' } : v)
    );
    setHasUnsavedChanges(true);
    message.success(t('productEdit.versionPublished'));
  };

  // 发布版本
  const handlePublishVersion = async (versionId: number) => {
    try {
      await adminApi.publishVersion(versionId);
      message.success(t('productEdit.versionPublished'));
      if (product?.id) loadVersions(product.id);
    } catch {
      message.error(t('productEdit.publishFailed'));
    }
  };

  // 删除版本
  const handleDeleteVersion = async (versionId: number) => {
    const version = versions.find(v => v.id === versionId);
    const remainingVersions = versions.filter(v => v.id !== versionId);
    const productStatus = product?.status;
    
    // 如果删除的是最后一个已发布版本，且产品状态为 PUBLISHED，提示用户
    if (version?.status === 'PUBLISHED' && versions.filter(v => v.status === 'PUBLISHED').length === 1 && productStatus === 'PUBLISHED') {
      Modal.confirm({
        title: t('productEdit.deleteLastPublishedVersion'),
        content: t('productEdit.deleteLastPublishedVersionAutoChange'),
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onOk: async () => {
          try {
            await adminApi.deleteVersion(versionId);
            message.success(t('productEdit.versionDeleted'));
            message.info(t('productEdit.statusChangedToDraft'));
            if (product?.id) {
              loadVersions(product.id);
              loadProduct(product.id);
            }
          } catch {
            message.error(t('productEdit.deleteFailed'));
          }
        }
      });
      return;
    }
    
    // 如果删除后没有版本，且产品状态为 PENDING，提示用户
    if (remainingVersions.length === 0 && productStatus === 'PENDING') {
      Modal.confirm({
        title: t('productEdit.statusWillChange'),
        content: t('productEdit.deleteLastVersionWarning', { status: t(`productStatus.${productStatus}`) }),
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onOk: async () => {
          try {
            await adminApi.deleteVersion(versionId);
            if (product?.id) {
              await adminApi.updateProduct(product.id, { status: 'DRAFT' });
            }
            message.success(t('productEdit.versionDeleted'));
            message.info(t('productEdit.statusChangedToDraft'));
            if (product?.id) {
              loadVersions(product.id);
              loadProduct(product.id);
            }
          } catch {
            message.error(t('productEdit.deleteFailed'));
          }
        }
      });
      return;
    }
    
    // 普通删除
    Modal.confirm({
      title: t('productEdit.confirmDelete'),
      content: t('productEdit.deleteVersionConfirm'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await adminApi.deleteVersion(versionId);
          message.success(t('productEdit.versionDeleted'));
          if (product?.id) loadVersions(product.id);
        } catch {
          message.error(t('productEdit.deleteFailed'));
        }
      }
    });
  };

  // 更新版本显示状态（带 loading 状态防止重复点击）
  const [updatingShowOnDetail, setUpdatingShowOnDetail] = useState<number | null>(null);
  
  const handleUpdateVersionShowOnDetail = async (versionId: number, showOnDetail: boolean) => {
    if (updatingShowOnDetail === versionId) return; // 防止重复点击
    setUpdatingShowOnDetail(versionId);
    try {
      await adminApi.updateVersionShowOnDetail(versionId, showOnDetail);
      message.success(showOnDetail ? t('productEdit.versionShowOnDetailEnabled') : t('productEdit.versionShowOnDetailDisabled'));
      if (product?.id) loadVersions(product.id);
    } catch {
      message.error(t('productEdit.updateFailed'));
    } finally {
      setUpdatingShowOnDetail(null);
    }
  };

  // 设置展示版本（按平台+架构）
  const [updatingDisplayVersion, setUpdatingDisplayVersion] = useState<number | null>(null);
  
  const handleSetDisplayVersion = async (version: ProductVersion) => {
    if (!product?.id || updatingDisplayVersion === version.id) return;
    const platformKey = `${version.platform}_${version.architecture || 'x64'}`;
    const isCurrentDisplay = product.displayVersions?.[platformKey] === version.id;
    
    setUpdatingDisplayVersion(version.id);
    try {
      await adminApi.updateDisplayVersion(product.id, platformKey, isCurrentDisplay ? null : version.id);
      message.success(t('productEdit.displayVersionUpdated'));
      // 更新本地状态
      setProduct(prev => {
        if (!prev) return prev;
        const newDisplayVersions = { ...(prev.displayVersions || {}) };
        if (isCurrentDisplay) {
          delete newDisplayVersions[platformKey];
        } else {
          newDisplayVersions[platformKey] = version.id;
        }
        return { ...prev, displayVersions: newDisplayVersions };
      });
    } catch {
      message.error(t('productEdit.updateFailed'));
    } finally {
      setUpdatingDisplayVersion(null);
    }
  };

  // 检查版本是否为当前展示版本
  const isDisplayVersion = (version: ProductVersion) => {
    if (!product?.displayVersions) return false;
    const platformKey = `${version.platform}_${version.architecture || 'x64'}`;
    return product.displayVersions[platformKey] === version.id;
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  // 验证所有必填项（新建产品时使用）
  const validateAllFields = async (): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    // 1. 验证基本信息
    try {
      await form.validateFields(['name', 'slug', 'categoryId', 'status', 'description']);
    } catch {
      errors.push(t('productEdit.validation.basicInfoIncomplete'));
    }

    // 检查状态是否已选择
    const status = form.getFieldValue('status');
    if (!status) {
      if (!errors.includes(t('productEdit.validation.basicInfoIncomplete'))) {
        errors.push(t('productEdit.validation.basicInfoIncomplete'));
      }
    }

    // 2. 验证媒体 - 产品图标必填
    if (!iconUrl) {
      errors.push(t('productEdit.validation.iconRequired'));
    }

    // 3. 验证版本 - 至少需要一个版本
    if (pendingVersions.length === 0) {
      errors.push(t('productEdit.atLeastOneVersionRequired'));
    }

    // 4. 状态转换验证
    if (status) {
      const publishedCount = pendingVersions.filter(v => v.status === 'PUBLISHED').length;
      
      if (status === 'PENDING' && pendingVersions.length === 0) {
        errors.push(t('productEdit.pendingNeedsVersion') || '提交审核前，请先添加至少一个版本');
      }
      
      if (status === 'PUBLISHED' && publishedCount === 0) {
        errors.push(t('productEdit.publishedVersionRequired'));
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // 创建产品（统一验证后创建）
  const handleCreateProduct = async () => {
    const { valid, errors } = await validateAllFields();

    if (!valid) {
      // 显示验证错误
      Modal.error({
        title: t('productEdit.validation.title'),
        content: (
          <div className="mt-2">
            <p className="mb-2">{t('productEdit.validation.pleaseComplete')}</p>
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((err, idx) => (
                <li key={idx} className="text-red-600">{err}</li>
              ))}
            </ul>
          </div>
        ),
      });
      return;
    }

    setCreating(true);
    try {
      const values = form.getFieldsValue();
      const payload = {
        ...values,
        iconUrl,
        bannerUrl,
        screenshots,
        demoVideoUrl,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      };

      // 1. 创建产品
      const res = await adminApi.createProduct(payload) as ApiResponse<ProductData>;
      const productId = res.data?.id;

      if (!productId) {
        throw new Error('Failed to create product');
      }

      // 2. 创建所有版本
      for (const version of pendingVersions) {
        await adminApi.createVersion(productId, {
          versionNumber: version.versionNumber,
          platform: version.platform,
          architecture: version.architecture,
          fileName: version.fileName,
          fileSize: version.fileSize,
          filePath: version.filePath,
          checksumSha256: version.checksumSha256,
          fileRecordId: version.fileRecordId,
          releaseNotes: version.releaseNotes,
          releaseNotesEn: version.releaseNotesEn,
          status: version.status || 'DRAFT',
        });
      }

      message.success(t('productEdit.createSuccess'));
      setHasUnsavedChanges(false);
      navigate('/admin/products');
    } catch {
      message.error(t('productEdit.saveFailed'));
    } finally {
      setCreating(false);
    }
  };

  // 验证状态转换是否满足条件（公共函数）
  const validatePublishStatus = useCallback((currentStatus: string, targetStatus: string, versionList: Array<{ status?: string }>): string | null => {
    if (currentStatus === targetStatus) {
      return null;
    }
    
    const allCount = versionList.length;
    const publishedCount = versionList.filter(v => v.status === 'PUBLISHED').length;
    
    // 从 DRAFT 转换
    if (currentStatus === 'DRAFT') {
      if (targetStatus === 'PENDING' && allCount === 0) {
        return t('productEdit.pendingNeedsVersion');
      }
      if (targetStatus === 'PUBLISHED' && publishedCount === 0) {
        return t('productEdit.publishedVersionRequired');
      }
      return null;
    }
    
    // 从 PENDING 转换
    if (currentStatus === 'PENDING') {
      if (targetStatus === 'PUBLISHED' && publishedCount === 0) {
        return t('productEdit.publishedVersionRequired');
      }
      // PENDING 可以转换为 DRAFT, REJECTED, PUBLISHED
      if (!['DRAFT', 'REJECTED', 'PUBLISHED'].includes(targetStatus)) {
        return t('productEdit.invalidStatusTransition', { from: currentStatus, to: targetStatus });
      }
      return null;
    }
    
    // 从 REJECTED 转换
    if (currentStatus === 'REJECTED') {
      if (targetStatus === 'PENDING' && allCount === 0) {
        return t('productEdit.pendingNeedsVersion');
      }
      // REJECTED 可以转换为 DRAFT, PENDING
      if (!['DRAFT', 'PENDING'].includes(targetStatus)) {
        return t('productEdit.invalidStatusTransition', { from: currentStatus, to: targetStatus });
      }
      return null;
    }
    
    // 从 PUBLISHED 转换
    if (currentStatus === 'PUBLISHED') {
      if (targetStatus === 'PENDING' && allCount === 0) {
        return t('productEdit.pendingNeedsVersion');
      }
      // PUBLISHED 可以转换为 DRAFT, PENDING, ARCHIVED
      if (!['DRAFT', 'PENDING', 'ARCHIVED'].includes(targetStatus)) {
        return t('productEdit.invalidStatusTransition', { from: currentStatus, to: targetStatus });
      }
      return null;
    }
    
    // 从 ARCHIVED 转换
    if (currentStatus === 'ARCHIVED') {
      if (targetStatus === 'PUBLISHED' && publishedCount === 0) {
        return t('productEdit.publishedVersionRequired');
      }
      // ARCHIVED 可以转换为 DRAFT, PUBLISHED
      if (!['DRAFT', 'PUBLISHED'].includes(targetStatus)) {
        return t('productEdit.invalidStatusTransition', { from: currentStatus, to: targetStatus });
      }
      return null;
    }
    
    return null;
  }, [t]);

  // 检查是否需要状态转换确认
  const needsStatusChangeConfirmation = useCallback((currentStatus: string, targetStatus: string): { needed: boolean; message?: string } => {
    if (currentStatus === 'PUBLISHED') {
      if (targetStatus === 'DRAFT') {
        return { needed: true, message: t('productEdit.publishedToDraftWarning') };
      }
      if (targetStatus === 'PENDING') {
        return { needed: true, message: t('productEdit.publishedToPendingWarning') };
      }
    }
    return { needed: false };
  }, [t]);

  // 状态选择时的验证
  const handleStatusSelect = useCallback((value: string) => {
    const currentStatus = product?.status || 'DRAFT';
    const versionList = isNewProduct ? pendingVersions : versions;
    const error = validatePublishStatus(currentStatus, value, versionList);
    
    if (error) {
      Modal.warning({
        title: t('productEdit.statusChangeWarning'),
        content: error,
      });
      setTimeout(() => {
        form.setFieldsValue({ status: currentStatus });
      }, 0);
      return;
    }
    
    // 检查是否需要确认
    const confirmation = needsStatusChangeConfirmation(currentStatus, value);
    if (confirmation.needed && confirmation.message) {
      Modal.confirm({
        title: t('productEdit.confirmStatusChange'),
        content: confirmation.message,
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onOk: () => {
          form.setFieldsValue({ status: value });
          // 如果状态不是 PUBLISHED，自动取消精选
          if (value !== 'PUBLISHED') {
            form.setFieldsValue({ isFeatured: false });
          }
          setHasUnsavedChanges(true);
        },
        onCancel: () => {
          setTimeout(() => {
            form.setFieldsValue({ status: currentStatus });
          }, 0);
        }
      });
      return;
    }
    
    // 如果状态不是 PUBLISHED，自动取消精选
    if (value !== 'PUBLISHED') {
      form.setFieldsValue({ isFeatured: false });
    }
    
    setHasUnsavedChanges(true);
  }, [product?.status, isNewProduct, pendingVersions, versions, form, t, validatePublishStatus, needsStatusChangeConfirmation]);

  // 保存产品（编辑模式）
  const handleSave = async (values: ProductFormValues) => {
    // 验证状态转换
    const currentStatus = product?.status || 'DRAFT';
    const publishError = validatePublishStatus(currentStatus, values.status || 'DRAFT', versions);
    if (publishError) {
      Modal.warning({
        title: t('productEdit.validation.title'),
        content: publishError,
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name,
        nameEn: values.nameEn,
        description: values.description,
        descriptionEn: values.descriptionEn,
        categoryId: values.categoryId,
        status: values.status,
        homepageUrl: values.homepageUrl,
        sourceUrl: values.sourceUrl,
        license: values.license,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        isFeatured: values.isFeatured,
        developerName: values.developerName,
        iconUrl,
        bannerUrl,
        screenshots,
        demoVideoUrl,
      };
      
      if (id) {
        await adminApi.updateProduct(parseInt(id), payload);
        message.success(t('productEdit.updateSuccess'));
        setHasUnsavedChanges(false);
      }
    } catch {
      message.error(t('productEdit.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File, type: 'icon' | 'banner' | 'screenshot' | 'video') => {
    setUploading(true);
    try {
      let res: ApiResponse<UploadedFileData>;
      const productId = product?.id || 0;
      
      if (type === 'video') {
        if (productId > 0) {
          res = await fileApi.uploadProductVideo(file, productId) as ApiResponse<UploadedFileData>;
        } else {
          res = await fileApi.uploadVideo(file) as ApiResponse<UploadedFileData>;
        }
      } else {
        if (productId > 0) {
          res = await fileApi.uploadProductImage(file, productId) as ApiResponse<UploadedFileData>;
        } else {
          res = await fileApi.uploadImage(file) as ApiResponse<UploadedFileData>;
        }
      }
      
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
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err?.response?.data?.message || t('productEdit.uploadFailed') || 'Upload failed');
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
          onClick={() => safeNavigate('/admin/products')}
        >
          {t('productEdit.back')}
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {id ? t('productEdit.title') : t('productEdit.newTitle')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {id ? t('productEdit.editDesc') : t('productEdit.newProductDesc')}
          </p>
        </div>
        {hasUnsavedChanges && (
          <Tag color="orange">{t('productEdit.unsavedTag')}</Tag>
        )}
        {/* 新建产品：顶部显示创建按钮 */}
        {isNewProduct && (
          <Button 
            type="primary" 
            size="large"
            icon={<Plus size={16} />}
            onClick={handleCreateProduct}
            loading={creating}
            disabled={uploading || uploadingVersion}
          >
            {t('productEdit.createProduct')}
          </Button>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        onValuesChange={handleFormChange}
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

                    <Form.Item 
                      name="status" 
                      label={t('admin.status')}
                      rules={[{ required: true, message: t('productEdit.statusRequired') }]}
                    >
                      <Select onSelect={handleStatusSelect}>
                        <Select.Option value="DRAFT">{t('admin.draft')}</Select.Option>
                        <Select.Option value="PENDING">{t('admin.pending')}</Select.Option>
                        <Select.Option value="PUBLISHED">{t('admin.published')}</Select.Option>
                        <Select.Option value="ARCHIVED">{t('admin.archived')}</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item 
                      name="isFeatured" 
                      label={t('admin.featured')}
                      valuePropName="checked"
                      tooltip={t('productEdit.featuredTooltip')}
                    >
                      <Switch checkedChildren={t('admin.yes')} unCheckedChildren={t('admin.no')} />
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

                    <Form.Item
                      name="developerName"
                      label={t('productEdit.developerName')}
                      rules={[{ required: true, message: t('productEdit.developerNameRequired') }]}
                    >
                      <Input placeholder={t('productEdit.developerNamePlaceholder')} />
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
                    title={<span className="flex items-center gap-2 text-slate-900 dark:text-white"><ImageIcon size={16} /> {t('productEdit.iconBanner')}</span>}
                    className="border-slate-200 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('productEdit.productIcon')} <span className="text-red-500">*</span>
                        </label>
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
                    title={<span className="flex items-center gap-2 text-slate-900 dark:text-white"><ImageIcon size={16} /> {t('productEdit.screenshots')}</span>}
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
                    title={<span className="flex items-center gap-2 text-slate-900 dark:text-white"><Film size={16} /> {t('productEdit.demoVideo')}</span>}
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
            // 版本管理标签页
            {
              key: 'versions',
              label: (
                <span className="flex items-center gap-2">
                  <HardDrive size={16} />
                  {t('productEdit.versions')} ({isNewProduct ? pendingVersions.length : versions.length})
                </span>
              ),
              children: (
                <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{t('productEdit.versionManagement')}</h3>
                    <Button type="primary" icon={<Plus size={16} />} onClick={() => setVersionModalOpen(true)}>
                      {t('productEdit.addVersion')}
                    </Button>
                  </div>
                  
                  {/* 新建产品模式：显示提示和临时版本列表 */}
                  {isNewProduct && (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-700 dark:text-blue-400 text-sm">
                          {t('productEdit.versionHint')}
                        </p>
                      </div>
                      <Table
                        dataSource={pendingVersions}
                        rowKey="tempId"
                        columns={[
                          { 
                            title: t('productEdit.version'), 
                            dataIndex: 'versionNumber',
                            render: (v: string, record: PendingVersion) => (
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{v}</span>
                                <Tag color={record.status === 'PUBLISHED' ? 'green' : record.status === 'DRAFT' ? 'orange' : 'default'}>
                                  {record.status === 'PUBLISHED' ? t('admin.published') : record.status === 'DRAFT' ? t('admin.draft') : record.status || t('admin.draft')}
                                </Tag>
                              </div>
                            )
                          },
                          { 
                            title: t('productEdit.platform'), 
                            dataIndex: 'platform',
                            render: (p: string) => {
                              const platform = platformConfig?.platforms.find(opt => opt.value === p);
                              return platform ? `${platform.icon} ${i18n.language === 'zh-CN' ? platform.label : platform.labelEn}` : p;
                            }
                          },
                          { 
                            title: t('productEdit.fileSize'), 
                            dataIndex: 'fileSize',
                            render: (size: number) => formatSize(size)
                          },
                          { 
                            title: t('productEdit.fileName'), 
                            dataIndex: 'fileName',
                            ellipsis: true,
                          },
                          {
                            title: t('admin.action'),
                            render: (_: unknown, record: PendingVersion) => (
                              <Space size="small">
                                {record.status !== 'PUBLISHED' && (
                                  <Button 
                                    size="small" 
                                    type="primary" 
                                    icon={<CheckCircle size={14} />}
                                    onClick={() => handlePublishPendingVersion(record.tempId)}
                                  >
                                    {t('admin.publish')}
                                  </Button>
                                )}
                                <Popconfirm
                                  title={t('productEdit.confirmDelete')}
                                  onConfirm={() => handleDeletePendingVersion(record.tempId)}
                                >
                                  <Button size="small" danger icon={<Trash2 size={14} />} />
                                </Popconfirm>
                              </Space>
                            )
                          }
                        ] as ColumnsType<PendingVersion>}
                        pagination={false}
                        locale={{ emptyText: t('productEdit.noVersionsYet') }}
                      />
                    </>
                  )}

                  {/* 编辑产品模式：显示已保存的版本列表 */}
                  {!isNewProduct && (
                    <Table
                      dataSource={versions}
                      rowKey="id"
                      columns={[
                        { 
                          title: t('productEdit.version'), 
                          dataIndex: 'versionNumber',
                          render: (v: string, record: ProductVersion) => (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">{v}</span>
                              {record.isLatest && <Tag color="green">{t('productEdit.latest')}</Tag>}
                            </div>
                          )
                        },
                        { 
                          title: t('productEdit.platform'), 
                          dataIndex: 'platform',
                          render: (p: string) => {
                            const platform = platformConfig?.platforms.find(opt => opt.value === p);
                            return platform ? `${platform.icon} ${i18n.language === 'zh-CN' ? platform.label : platform.labelEn}` : p;
                          }
                        },
                        { 
                          title: t('productEdit.fileSize'), 
                          dataIndex: 'fileSize',
                          render: (size: number) => formatSize(size)
                        },
                        { 
                          title: t('admin.status'), 
                          dataIndex: 'status',
                          render: (s: string) => (
                            <Tag color={s === 'PUBLISHED' ? 'green' : s === 'DRAFT' ? 'default' : 'orange'}>
                              {s}
                            </Tag>
                          )
                        },
                        { 
                          title: t('productEdit.showOnDetail'), 
                          dataIndex: 'showOnDetail',
                          render: (showOnDetail: boolean, record: ProductVersion) => (
                            <Switch 
                              size="small"
                              checked={showOnDetail !== false}
                              loading={updatingShowOnDetail === record.id}
                              onChange={(checked) => handleUpdateVersionShowOnDetail(record.id, checked)}
                            />
                          )
                        },
                        { 
                          title: t('productEdit.displayVersion'), 
                          render: (_: unknown, record: ProductVersion) => (
                            <Button 
                              size="small"
                              type={isDisplayVersion(record) ? 'primary' : 'default'}
                              loading={updatingDisplayVersion === record.id}
                              onClick={() => handleSetDisplayVersion(record)}
                              disabled={record.status !== 'PUBLISHED'}
                            >
                              {isDisplayVersion(record) ? t('productEdit.currentDisplay') : t('productEdit.setAsDisplay')}
                            </Button>
                          )
                        },
                        {
                          title: t('admin.action'),
                          render: (_: unknown, record: ProductVersion) => (
                            <div className="flex gap-2">
                              {record.status !== 'PUBLISHED' && (
                                <Button size="small" type="primary" onClick={() => handlePublishVersion(record.id)}>
                                  {t('admin.publish')}
                                </Button>
                              )}
                              <Popconfirm
                                title={t('productEdit.confirmDelete')}
                                onConfirm={() => handleDeleteVersion(record.id)}
                              >
                                <Button size="small" danger icon={<Trash2 size={14} />} />
                              </Popconfirm>
                            </div>
                          )
                        }
                      ] as ColumnsType<ProductVersion>}
                      pagination={false}
                      locale={{ emptyText: t('productEdit.noVersions') }}
                    />
                  )}
                </Card>
              ),
            },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

        {/* 底部按钮区域 - 仅编辑模式显示 */}
        {!isNewProduct && (
          <div className="flex justify-end gap-4 mt-6">
            <Button onClick={() => safeNavigate('/admin/products')}>{t('productEdit.cancel')}</Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={saving} 
              disabled={uploading || !hasUnsavedChanges}
            >
              {t('productEdit.saveChanges')}
            </Button>
          </div>
        )}
      </Form>

      <Modal
        open={previewVideo}
        onCancel={() => setPreviewVideo(false)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        <video
          src={demoVideoUrl}
          controls
          autoPlay
          className="w-full rounded-lg"
        />
      </Modal>

      {/* 添加版本弹窗 */}
      <Modal
        open={versionModalOpen}
        onCancel={() => {
          setVersionModalOpen(false);
          versionForm.resetFields();
          setUploadedFile(null);
        }}
        title={<span className="flex items-center gap-2 text-slate-900 dark:text-white"><Monitor size={18} /> {t('productEdit.addNewVersion')}</span>}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <Form form={versionForm} layout="vertical" onFinish={handleCreateVersion} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="versionNumber"
              label={t('productEdit.versionNumber')}
              rules={[{ required: true, message: t('productEdit.versionRequired') }]}
            >
              <Input placeholder="1.0.0" />
            </Form.Item>

            <Form.Item
              name="platform"
              label={t('productEdit.platform')}
              rules={[{ required: true, message: t('productEdit.platformRequired') }]}
            >
              <Select 
                placeholder={t('productEdit.selectPlatform')}
                onChange={handlePlatformChange}
                loading={platformConfigLoading}
                notFoundContent={platformConfig ? null : t('productEdit.platformConfigLoading')}
              >
                {platformConfig?.platforms
                  .filter(p => p.enabled)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(p => (
                    <Select.Option key={p.value} value={p.value}>
                      {p.icon} {i18n.language === 'zh-CN' ? p.label : p.labelEn}
                    </Select.Option>
                  ))
                }
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="architecture"
            label={t('productEdit.architecture')}
            initialValue="x64"
          >
            <Select>
              {getAvailableArchitectures(versionForm.getFieldValue('platform')).map(arch => (
                <Select.Option key={arch.value} value={arch.value}>
                  {i18n.language === 'zh-CN' ? arch.label : arch.labelEn}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t('productEdit.applicationFile')}
            required
          >
            <Upload
              beforeUpload={(file) => {
                handleVersionFileUpload(file);
                return false;
              }}
              showUploadList={false}
              accept=".exe,.msi,.dmg,.pkg,.deb,.rpm,.AppImage,.zip,.tar.gz"
            >
              <Button icon={<UploadIcon size={14} />} loading={uploadingVersion}>
                {t('productEdit.uploadApplication')}
              </Button>
            </Upload>
            {uploadedFile && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <HardDrive size={16} />
                  <span className="font-medium">{uploadedFile.name}</span>
                  <span className="text-sm text-green-600 dark:text-green-500">({formatSize(uploadedFile.size)})</span>
                </div>
              </div>
            )}
          </Form.Item>

          <Form.Item name="releaseNotes" label={t('productEdit.releaseNotes')}>
            <TextArea rows={3} placeholder={t('productEdit.releaseNotesPlaceholder')} />
          </Form.Item>

          <Form.Item name="releaseNotesEn" label={t('productEdit.releaseNotesEn')}>
            <TextArea rows={3} placeholder="What's new in this version..." />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => {
              setVersionModalOpen(false);
              versionForm.resetFields();
              setUploadedFile(null);
            }}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit" disabled={!uploadedFile} loading={creatingVersion}>
              {t('productEdit.createVersion')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

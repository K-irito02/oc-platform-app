import { useState, useCallback } from 'react';
import { Modal, Upload, Slider, Button } from 'antd';
import { message } from '@/utils/antdUtils';
import { UploadOutlined, ZoomInOutlined, ZoomOutOutlined, RotateLeftOutlined, RotateRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { fileApi } from '@/utils/api';

interface LogoCropUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  onSave?: (url: string) => Promise<void>;
}

type ApiResponse<T> = {
  data?: T;
};

type UploadImageResponse = {
  url?: string;
  fileUrl?: string;
};

// 创建裁剪后的图片
const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const rotRad = (rotation * Math.PI) / 180;

  // 计算旋转后的边界框
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // 设置 canvas 大小为边界框大小
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // 平移到中心，旋转，然后绘制
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  // 创建裁剪后的 canvas
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No 2d context');
  }

  // 设置裁剪后的 canvas 大小
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // 绘制裁剪区域
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/png', 1);
  });
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

export const LogoCropUploader = ({ value, onChange, onSave }: LogoCropUploaderProps) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (file: File) => {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      message.error(t('avatar.formatError') || 'Unsupported image format');
      return false;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      message.warning(t('avatar.sizeWarning') || 'File size exceeds 5MB');
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setModalOpen(true);
      // 重置裁剪参数
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    });
    reader.readAsDataURL(file);

    return false;
  };

  const handleUploadAndSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    try {
      // 创建裁剪后的图片
      const croppedBlob = await createCroppedImage(imageSrc, croppedAreaPixels, rotation);
      
      // 转换 Blob 为 File 对象
      const logoFile = new File([croppedBlob], 'logo.png', { type: 'image/png' });
      
      const res = await fileApi.uploadImage(logoFile) as ApiResponse<UploadImageResponse>;
      const logoUrl = res.data?.url || res.data?.fileUrl;
      
      if (logoUrl) {
        onChange?.(logoUrl);
        await onSave?.(logoUrl);
        message.success(t('logo.uploadSuccess') || 'Logo uploaded successfully');
        setModalOpen(false);
      }
    } catch {
      message.error(t('logo.uploadFailed') || 'Logo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 1));
  const handleRotateLeft = () => setRotation((r) => r - 90);
  const handleRotateRight = () => setRotation((r) => r + 90);

  // 处理滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(Math.max(z + delta, 1), 3));
  }, []);

  return (
    <div className="logo-crop-uploader">
      {/* 当前 Logo 预览 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600">
          {value ? (
            <img src={value} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 text-2xl font-bold">K</span>
          )}
        </div>
        <div className="flex-1">
          <Upload
            accept="image/jpeg,image/png,image/webp,image/gif"
            showUploadList={false}
            beforeUpload={handleFileChange}
          >
            <Button icon={<UploadOutlined />}>
              {t('logo.upload') || 'Upload Logo'}
            </Button>
          </Upload>
          <p className="text-xs text-slate-500 mt-1">
            {t('logo.hint') || 'Supports JPG/PNG/WebP/GIF, max 5MB'}
          </p>
        </div>
      </div>

      {/* 裁剪 Modal */}
      <Modal
        title={t('logo.cropTitle') || 'Crop Logo'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={500}
        centered
        destroyOnClose
      >
        {imageSrc && (
          <div className="space-y-4">
            {/* 裁剪区域 */}
            <div 
              className="relative w-full h-80 bg-slate-900 rounded-lg overflow-hidden"
              onWheel={handleWheel}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-2">
              <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={zoom <= 1} />
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={setZoom}
                style={{ width: 150 }}
                tooltip={{ formatter: (v) => `${Math.round((v || 1) * 100)}%` }}
              />
              <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={zoom >= 3} />
              <div className="mx-2 h-6 w-px bg-slate-300" />
              <Button icon={<RotateLeftOutlined />} onClick={handleRotateLeft} />
              <Button icon={<RotateRightOutlined />} onClick={handleRotateRight} />
            </div>

            {/* 提示文字 */}
            <p className="text-center text-sm text-slate-500">
              {t('logo.scrollToZoom') || 'Scroll to zoom, drag to move'}
            </p>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button onClick={() => setModalOpen(false)}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button type="primary" onClick={handleUploadAndSave} loading={uploading}>
                {t('logo.confirmCrop') || 'Crop & Upload'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

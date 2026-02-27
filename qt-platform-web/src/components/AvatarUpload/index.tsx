import { useState, useCallback } from 'react';
import { Modal, Upload, Slider, Button, message, Space } from 'antd';
import { UploadOutlined, ScissorOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];

interface AvatarUploadProps {
  currentAvatar?: string;
  onUpload: (file: Blob, isGif: boolean) => Promise<void>;
  size?: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
  });
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatar, onUpload, size = 88 }) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleBeforeUpload = (file: File) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      message.error(t('avatar.formatError') || '不支持的图片格式，请上传 JPG/PNG/WebP/GIF/BMP/SVG');
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.warning(
        (t('avatar.sizeWarning') || `文件大小 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过 ${MAX_FILE_SIZE_MB}MB，建议压缩后上传`)
          .replace('{size}', (file.size / 1024 / 1024).toFixed(1))
          .replace('{max}', String(MAX_FILE_SIZE_MB))
      );
    }

    const isGifFile = file.type === 'image/gif';

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      if (isGifFile) {
        handleGifUpload(file);
      } else {
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleGifUpload = async (file: File) => {
    setUploading(true);
    try {
      await onUpload(file, true);
      message.success(t('avatar.uploadSuccess') || '头像上传成功');
    } catch {
      message.error(t('avatar.uploadFail') || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleCropConfirm = async () => {
    if (!previewUrl || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      await onUpload(croppedBlob, false);
      message.success(t('avatar.uploadSuccess') || '头像上传成功');
      setCropModalOpen(false);
    } catch {
      message.error(t('avatar.uploadFail') || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--paper-warm, #f5f0e8)',
            background: 'var(--ink-lighter, #ccc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            color: '#fff',
          }}
        >
          {currentAvatar ? (
            <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>👤</span>
          )}
        </div>
        <Upload
          showUploadList={false}
          beforeUpload={handleBeforeUpload}
          accept={ACCEPTED_FORMATS.join(',')}
        >
          <Button icon={<UploadOutlined />} size="small" loading={uploading}>
            {t('avatar.change') || '更换头像'}
          </Button>
        </Upload>
        <div style={{ fontSize: 11, color: 'var(--ink-light, #999)', textAlign: 'center', lineHeight: 1.4 }}>
          {t('avatar.hint') || `支持 JPG/PNG/WebP/GIF/BMP，最大 ${MAX_FILE_SIZE_MB}MB`}
        </div>
      </div>

      <Modal
        title={<span><ScissorOutlined /> {t('avatar.cropTitle') || '裁剪头像'}</span>}
        open={cropModalOpen}
        onCancel={() => setCropModalOpen(false)}
        width={480}
        footer={
          <Space>
            <Button onClick={() => setCropModalOpen(false)}>{t('common.cancel') || '取消'}</Button>
            <Button type="primary" onClick={handleCropConfirm} loading={uploading}>
              {t('avatar.confirmCrop') || '确认裁剪并上传'}
            </Button>
          </Space>
        }
        destroyOnHidden
      >
        {previewUrl && (
          <div style={{ position: 'relative', width: '100%', height: 320, background: '#333', borderRadius: 8, overflow: 'hidden' }}>
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 13, color: '#666' }}>{t('avatar.zoom') || '缩放'}:</span>
          <Slider min={1} max={3} step={0.1} value={zoom} onChange={setZoom} />
        </div>
      </Modal>
    </>
  );
};

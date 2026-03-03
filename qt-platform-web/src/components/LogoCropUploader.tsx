import { useState, useRef, useEffect } from 'react';
import { Modal, Upload, Button, Segmented, Space, message } from 'antd';
import { UploadOutlined, BorderOutlined, DragOutlined, UndoOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { fileApi } from '@/utils/api';

interface LogoCropUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  onSave?: (url: string) => Promise<void>;
}

type CropShape = 'square' | 'circle' | 'free';

type ApiResponse<T> = {
  data?: T;
};

type UploadImageResponse = {
  url?: string;
  fileUrl?: string;
};

const createCroppedImage = async (
  imageSrc: string,
  shape: CropShape,
  cropData?: any
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = image.width;
  canvas.height = image.height;

  if (shape === 'free' && cropData?.path) {
    ctx.beginPath();
    ctx.moveTo(cropData.path[0].x, cropData.path[0].y);
    for (let i = 1; i < cropData.path.length; i++) {
      ctx.lineTo(cropData.path[i].x, cropData.path[i].y);
    }
    ctx.closePath();
    ctx.clip();
  } else if (shape === 'circle') {
    const centerX = image.width / 2;
    const centerY = image.height / 2;
    const radius = Math.min(centerX, centerY);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(image, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
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

export const LogoCropUploader = ({ value, onChange, onSave }: LogoCropUploaderProps) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropShape, setCropShape] = useState<CropShape>('square');
  const [uploading, setUploading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      message.error(t('avatar.formatError') || 'Unsupported image format');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.warning(t('avatar.sizeWarning') || 'File size exceeds 5MB');
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setModalOpen(true);
      setCropShape('square');
      setPath([]);
    });
    reader.readAsDataURL(file);

    return false;
  };

  const handleUploadAndSave = async () => {
    if (!imageSrc) return;

    if (cropShape === 'free' && path.length < 3) {
      message.error('请绘制一个完整的形状');
      return;
    }

    setUploading(true);
    try {
      const croppedBlob = await createCroppedImage(imageSrc, cropShape, { path });
      
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

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cropShape !== 'free') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setPath([{ x, y }]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || cropShape !== 'free') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPath(prev => [...prev, { x, y }]);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const handleCanvasMouseLeave = () => {
    setIsDrawing(false);
  };

  const handleClearPath = () => {
    setPath([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (canvas && image && imageSrc) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        
        if (cropShape === 'free' && path.length > 1) {
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
          }
          ctx.closePath();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  }, [imageSrc, cropShape, path]);

  return (
    <div className="logo-crop-uploader">
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

      <Modal
        title={t('logo.cropTitle') || 'Crop Logo'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
        centered
        destroyOnHidden
      >
        {imageSrc && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Segmented
                value={cropShape}
                onChange={(v) => {
                  setCropShape(v as CropShape);
                  setPath([]);
                }}
                options={[
                  { label: <Space><BorderOutlined />{t('logo.shapeSquare') || '正方形'}</Space>, value: 'square' },
                  { label: <Space><BorderOutlined style={{ borderRadius: '50%' }} />{t('logo.shapeCircle') || '圆形'}</Space>, value: 'circle' },
                  { label: <Space><DragOutlined />{t('logo.shapeFree') || '自由'}</Space>, value: 'free' },
                ]}
              />
            </div>

            <div className="flex justify-center">
              {cropShape === 'free' && (
                <div className="text-center text-sm text-slate-500 mb-2">
                  {t('logo.freeDrawHint') || '拖动鼠标绘制任意形状'}
                  <Button 
                    icon={<UndoOutlined />} 
                    size="small" 
                    onClick={handleClearPath}
                    className="ml-2"
                  >
                    {t('logo.clearPath') || '清除'}
                  </Button>
                </div>
              )}
            </div>

            <div className="relative w-full flex justify-center">
              <img 
                ref={imageRef}
                src={imageSrc} 
                alt="Preview" 
                style={{ display: 'none' }}
                onLoad={() => {
                  const canvas = canvasRef.current;
                  const image = imageRef.current;
                  if (canvas && image) {
                    canvas.width = image.width;
                    canvas.height = image.height;
                  }
                }}
              />
              
              <canvas
                ref={canvasRef}
                className={`cursor-${cropShape === 'free' ? 'crosshair' : 'default'}`}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
              />
            </div>

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

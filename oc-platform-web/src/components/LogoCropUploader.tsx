import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Upload, Button, Segmented, Space, message, Slider } from 'antd';
import { UploadOutlined, BorderOutlined, DragOutlined, UndoOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { fileApi } from '@/utils/api';

interface LogoCropUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  onSave?: (url: string) => Promise<void>;
  title?: string;
}

type CropShape = 'square' | 'circle' | 'free';

type ApiResponse<T> = {
  data?: T;
};

type UploadImageResponse = {
  url?: string;
  fileUrl?: string;
};

const OUTPUT_SIZE = 512;

const getBoundingBox = (path: { x: number; y: number }[]): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } | null => {
  if (path.length === 0) return null;
  
  let minX = path[0].x;
  let maxX = path[0].x;
  let minY = path[0].y;
  let maxY = path[0].y;
  
  for (const point of path) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const createCroppedImage = async (
  imageSrc: string,
  shape: CropShape,
  cropData?: { path?: { x: number; y: number }[] },
  scale: number = 1,
  offsetX: number = 0,
  offsetY: number = 0
): Promise<Blob> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const centerX = OUTPUT_SIZE / 2;
  const centerY = OUTPUT_SIZE / 2;

  const imgDrawWidth = image.width * scale;
  const imgDrawHeight = image.height * scale;
  const imgDrawX = centerX - imgDrawWidth / 2 + offsetX;
  const imgDrawY = centerY - imgDrawHeight / 2 + offsetY;

  if (shape === 'free' && cropData?.path && cropData.path.length > 2) {
    const bbox = getBoundingBox(cropData.path);
    if (!bbox) throw new Error('Invalid crop path');
    
    canvas.width = Math.max(1, Math.round(bbox.width));
    canvas.height = Math.max(1, Math.round(bbox.height));
    
    const pathOffsetX = -bbox.minX;
    const pathOffsetY = -bbox.minY;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cropData.path[0].x + pathOffsetX, cropData.path[0].y + pathOffsetY);
    for (let i = 1; i < cropData.path.length; i++) {
      ctx.lineTo(cropData.path[i].x + pathOffsetX, cropData.path[i].y + pathOffsetY);
    }
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, imgDrawX + pathOffsetX, imgDrawY + pathOffsetY, imgDrawWidth, imgDrawHeight);
    ctx.restore();
  } else if (shape === 'circle') {
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, imgDrawX, imgDrawY, imgDrawWidth, imgDrawHeight);
    ctx.restore();
  } else {
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    
    ctx.drawImage(image, imgDrawX, imgDrawY, imgDrawWidth, imgDrawHeight);
  }

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

export const LogoCropUploader = ({ value, onChange, onSave, title }: LogoCropUploaderProps) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [cropShape, setCropShape] = useState<CropShape>('square');
  const [uploading, setUploading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState<{ x: number; y: number }[]>([]);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetState = useCallback(() => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setPath([]);
    setIsDrawing(false);
    setIsDragging(false);
    setImageElement(null);
  }, []);

  useEffect(() => {
    if (!modalOpen || !imageSrc) {
      setImageElement(null);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    loadImage(imageSrc)
      .then((img) => {
        if (mounted) {
          setImageElement(img);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsLoading(false);
          message.error('Failed to load image');
        }
      });

    return () => {
      mounted = false;
    };
  }, [modalOpen, imageSrc]);

  useEffect(() => {
    if (!modalOpen || !imageElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const centerX = OUTPUT_SIZE / 2;
    const centerY = OUTPUT_SIZE / 2;

    const drawWidth = imageElement.width * scale;
    const drawHeight = imageElement.height * scale;
    const drawX = centerX - drawWidth / 2 + offsetX;
    const drawY = centerY - drawHeight / 2 + offsetY;

    if (cropShape === 'free' && path.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (cropShape === 'circle') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);

      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    }
  }, [modalOpen, imageElement, cropShape, path, scale, offsetX, offsetY]);

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
      resetState();
    });
    reader.readAsDataURL(file);

    return false;
  };

  const handleUploadAndSave = async () => {
    if (!imageSrc) return;

    if (cropShape === 'free' && path.length < 3) {
      message.error(t('logo.freeDrawHint') || '请绘制一个完整的形状');
      return;
    }

    setUploading(true);
    try {
      const croppedBlob = await createCroppedImage(imageSrc, cropShape, { path }, scale, offsetX, offsetY);

      const logoFile = new File([croppedBlob], 'logo.png', { type: 'image/png' });

      const res = await fileApi.uploadImage(logoFile) as ApiResponse<UploadImageResponse>;
      const logoUrl = res.data?.url || res.data?.fileUrl;

      if (logoUrl) {
        onChange?.(logoUrl);
        await onSave?.(logoUrl);
        message.success(t('logo.uploadSuccess') || 'Logo uploaded successfully');
        setModalOpen(false);
        resetState();
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setPath([{ x, y }]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || cropShape !== 'free') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.3, Math.min(5, scale + delta));
    setScale(newScale);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev + 0.2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.3, prev - 0.2));
  };

  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cropShape === 'free' || !imageElement) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || cropShape === 'free' || !imageElement) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

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
        title={title || t('logo.cropTitle') || 'Crop Logo'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          resetState();
        }}
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

            {cropShape === 'free' && (
              <div className="text-center text-sm text-slate-500">
                <Space>
                  <span>{t('logo.freeDrawHint') || '拖动鼠标绘制任意形状'}</span>
                  <Button
                    icon={<UndoOutlined />}
                    size="small"
                    onClick={handleClearPath}
                  >
                    {t('logo.clearPath') || '清除'}
                  </Button>
                </Space>
              </div>
            )}

            <div
              ref={containerRef}
              className="relative w-full flex justify-center items-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden"
              style={{ height: '420px' }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className={`max-w-[380px] max-h-[380px] shadow-2xl transition-transform duration-150 ${cropShape === 'free' ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{
                    borderRadius: cropShape === 'circle' ? '50%' : '8px',
                    backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseLeave}
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Button
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  disabled={scale <= 0.3}
                >
                  {t('logo.zoomOut') || '缩小'}
                </Button>
                <Slider
                  min={0.3}
                  max={5}
                  step={0.1}
                  value={scale}
                  onChange={(v) => setScale(v as number)}
                  style={{ width: 180 }}
                />
                <Button
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  disabled={scale >= 5}
                >
                  {t('logo.zoomIn') || '放大'}
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={scale === 1 && offsetX === 0 && offsetY === 0}
                >
                  {t('logo.reset') || '重置'}
                </Button>
              </div>
              <p className="text-center text-sm text-slate-500">
                {t('logo.scrollToZoom') || '滚动鼠标缩放'} · {t('logo.dragToMove') || '拖动移动'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={() => {
                setModalOpen(false);
                resetState();
              }}>
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

import { useState, useRef, useEffect, useCallback, MouseEvent, TouchEvent, WheelEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Sliders, 
  Crop, 
  Check, 
  Sun, 
  Maximize2, 
  RefreshCw, 
  Sparkles,
  Eye,
  Grid,
  Film,
  Layers,
  Upload,
  Contrast,
  Palette,
  Camera,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { uploadToImgBB } from '../services/imgbb';

export interface ImageAdjustModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSave: (adjustedDataUrl: string) => void;
  title?: string;
  defaultAspectRatio?: '1:1' | '16:9' | '9:16' | '4:5' | '4:3' | 'free';
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '4:3' | 'free';

export interface PresetFilter {
  id: string;
  name: string;
  tag: string;
  color: string;
  brightness: number; // offset from 100
  contrast: number;   // offset from 100
  saturation: number; // offset from 100
  warmth: number;     // -50 to +50
  tint: number;       // -50 to +50
  vignette: number;   // 0 to 100
  sepia: number;      // 0 to 100
}

const PRESETS: PresetFilter[] = [
  { id: 'normal', name: 'Original', tag: 'RAW', color: 'from-slate-500 to-slate-700', brightness: 0, contrast: 0, saturation: 0, warmth: 0, tint: 0, vignette: 0, sepia: 0 },
  { id: 'cinematic', name: 'Teal & Orange', tag: 'CINEMA', color: 'from-cyan-500 to-amber-500', brightness: 2, contrast: 18, saturation: 15, warmth: 12, tint: -6, vignette: 30, sepia: 0 },
  { id: 'moody', name: 'Moody Noir', tag: 'DARK', color: 'from-zinc-700 to-stone-900', brightness: -6, contrast: 28, saturation: -90, warmth: -4, tint: 0, vignette: 45, sepia: 5 },
  { id: 'golden', name: 'Golden Hour', tag: 'WARM', color: 'from-amber-500 to-orange-600', brightness: 4, contrast: 10, saturation: 20, warmth: 26, tint: 4, vignette: 18, sepia: 0 },
  { id: 'cyber', name: 'Cyber Neon', tag: 'POP', color: 'from-fuchsia-500 to-cyan-400', brightness: 2, contrast: 22, saturation: 35, warmth: -15, tint: 14, vignette: 32, sepia: 0 },
  { id: 'vintage', name: 'Vintage 35mm', tag: 'RETRO', color: 'from-yellow-600 to-stone-700', brightness: 4, contrast: -6, saturation: -12, warmth: 16, tint: 6, vignette: 28, sepia: 25 },
  { id: 'studio', name: 'Studio Clean', tag: 'PRO', color: 'from-sky-400 to-blue-600', brightness: 4, contrast: 12, saturation: 8, warmth: 2, tint: 0, vignette: 10, sepia: 0 },
  { id: 'vibrant', name: 'Vibrant Pop', tag: 'LUSH', color: 'from-emerald-400 to-teal-600', brightness: 2, contrast: 14, saturation: 30, warmth: 6, tint: 0, vignette: 12, sepia: 0 },
  { id: 'urban', name: 'Urban Fade', tag: 'MATTE', color: 'from-slate-600 to-indigo-900', brightness: -2, contrast: -10, saturation: -18, warmth: -8, tint: 8, vignette: 35, sepia: 0 }
];

export default function ImageAdjustModal({
  isOpen,
  imageUrl: initialImageUrl,
  onClose,
  onSave,
  title = 'Creative Edit Studio',
  defaultAspectRatio = '16:9'
}: ImageAdjustModalProps) {
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(initialImageUrl);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultAspectRatio);
  const [activePreset, setActivePreset] = useState<string>('normal');
  
  // Transform values
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [straighten, setStraighten] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Pro Color Grading values (-50 to +50 or 0 to 100)
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  const [warmth, setWarmth] = useState<number>(0); // Temp: cool to warm
  const [tint, setTint] = useState<number>(0);     // Tint: green to magenta
  const [vignette, setVignette] = useState<number>(0);
  const [sepia, setSepia] = useState<number>(0);

  // Tool UI state
  const [activeToolTab, setActiveToolTab] = useState<'presets' | 'color' | 'crop' | 'effects'>('presets');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isComparing, setIsComparing] = useState<boolean>(false); // Press & hold to view original
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0
  });
  const touchDistRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load image when currentImageSrc changes
  useEffect(() => {
    if (!currentImageSrc || !isOpen) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      setImageMeta({
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080
      });
      // Initial reset
      handleReset();
    };
    img.src = currentImageSrc;
  }, [currentImageSrc, isOpen]);

  // Apply a preset
  const handleSelectPreset = (preset: PresetFilter) => {
    setActivePreset(preset.id);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setWarmth(preset.warmth);
    setTint(preset.tint);
    setVignette(preset.vignette);
    setSepia(preset.sepia);
  };

  // Reset all adjustments to 0
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setStraighten(0);
    setFlipH(false);
    setFlipV(false);
    setPanX(0);
    setPanY(0);
    setActivePreset('normal');
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setWarmth(0);
    setTint(0);
    setVignette(0);
    setSepia(0);
    setAspectRatio(defaultAspectRatio);
  };

  // Draw Canvas Preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport box dimensions
    let targetWidth = 640;
    let targetHeight = 360;

    if (aspectRatio === '1:1') {
      targetWidth = 460;
      targetHeight = 460;
    } else if (aspectRatio === '16:9') {
      targetWidth = 640;
      targetHeight = 360;
    } else if (aspectRatio === '9:16') {
      targetWidth = 270;
      targetHeight = 480;
    } else if (aspectRatio === '4:5') {
      targetWidth = 360;
      targetHeight = 450;
    } else if (aspectRatio === '4:3') {
      targetWidth = 520;
      targetHeight = 390;
    } else {
      // Free / original aspect ratio
      const naturalAspect = (img.naturalWidth || 16) / (img.naturalHeight || 9);
      if (naturalAspect >= 1) {
        targetWidth = 560;
        targetHeight = Math.round(targetWidth / naturalAspect);
      } else {
        targetHeight = 440;
        targetWidth = Math.round(targetHeight * naturalAspect);
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // If user is currently holding the "Compare" button, show raw original with 0 filters
    if (isComparing) {
      ctx.filter = 'none';
    } else {
      const bVal = 100 + brightness;
      const cVal = 100 + contrast;
      const sVal = 100 + saturation;
      const sepVal = sepia;
      ctx.filter = `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%) sepia(${sepVal}%)`;
    }

    ctx.save();
    ctx.translate(targetWidth / 2 + (isComparing ? 0 : panX), targetHeight / 2 + (isComparing ? 0 : panY));
    
    if (!isComparing) {
      ctx.rotate(((rotation + straighten) * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.scale(zoom, zoom);
    }

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const boxAspect = targetWidth / targetHeight;

    let drawW: number;
    let drawH: number;

    if (imgAspect > boxAspect) {
      drawH = targetHeight;
      drawW = targetHeight * imgAspect;
    } else {
      drawW = targetWidth;
      drawH = targetWidth / imgAspect;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Secondary Warmth / Tint overlay (simulates Lumetri temperature & tint)
    if (!isComparing && (warmth !== 0 || tint !== 0)) {
      ctx.save();
      if (warmth > 0) {
        // Amber Warmth
        ctx.fillStyle = `rgba(255, 170, 40, ${Math.min(0.25, (warmth / 100) * 0.4)})`;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (warmth < 0) {
        // Cool Blue
        ctx.fillStyle = `rgba(40, 150, 255, ${Math.min(0.25, (-warmth / 100) * 0.4)})`;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      if (tint > 0) {
        // Magenta
        ctx.fillStyle = `rgba(230, 40, 180, ${Math.min(0.2, (tint / 100) * 0.35)})`;
        ctx.globalCompositeOperation = 'color';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (tint < 0) {
        // Green
        ctx.fillStyle = `rgba(40, 230, 100, ${Math.min(0.2, (-tint / 100) * 0.35)})`;
        ctx.globalCompositeOperation = 'color';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      ctx.restore();
    }

    // Cinematic Vignette Overlay (smooth radial dark edges)
    if (!isComparing && vignette > 0) {
      ctx.save();
      const radius = Math.max(targetWidth, targetHeight) * 0.75;
      const grad = ctx.createRadialGradient(
        targetWidth / 2,
        targetHeight / 2,
        radius * 0.35,
        targetWidth / 2,
        targetHeight / 2,
        radius
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${(vignette / 100) * 0.7})`);
      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.restore();
    }
  }, [
    aspectRatio, 
    zoom, 
    rotation, 
    straighten, 
    flipH, 
    flipV, 
    brightness, 
    contrast, 
    saturation, 
    warmth, 
    tint, 
    vignette, 
    sepia, 
    panX, 
    panY, 
    isComparing
  ]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse & Touch Pan Handling
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panX,
      startPanY: panY
    };
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanX(dragStartRef.current.startPanX + dx);
    setPanY(dragStartRef.current.startPanY + dy);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((prev) => Math.max(0.5, Math.min(3, Number((prev + delta).toFixed(2)))));
  };

  // Touch handlers
  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startPanX: panX,
        startPanY: panY
      };
      touchDistRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPanX(dragStartRef.current.startPanX + dx);
      setPanY(dragStartRef.current.startPanY + dy);
    } else if (e.touches.length === 2 && touchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const scaleDelta = (newDist - touchDistRef.current) * 0.005;
      setZoom((prev) => Math.max(0.5, Math.min(3, Number((prev + scaleDelta).toFixed(2)))));
      touchDistRef.current = newDist;
    }
  };

  // Image upload handling
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setCurrentImageSrc(loadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if zero changes were made
  const hasZeroChanges = 
    zoom === 1 && 
    rotation === 0 && 
    straighten === 0 && 
    !flipH && 
    !flipV && 
    brightness === 0 && 
    contrast === 0 && 
    saturation === 0 && 
    warmth === 0 && 
    tint === 0 && 
    vignette === 0 && 
    sepia === 0 && 
    panX === 0 && 
    panY === 0 &&
    (aspectRatio === 'free' || aspectRatio === defaultAspectRatio);

  // High-Resolution Export
  const [isUploadingToImgBB, setIsUploadingToImgBB] = useState(false);

  const generateExportDataUrl = (): string | null => {
    const img = imageObjRef.current;
    if (!img) {
      return currentImageSrc || null;
    }

    // Zero-change bypass: returns original image without any compression
    if (hasZeroChanges && currentImageSrc === initialImageUrl) {
      return initialImageUrl;
    }

    const exportCanvas = document.createElement('canvas');
    const naturalW = img.naturalWidth || 1920;
    const naturalH = img.naturalHeight || 1080;

    let exportW = Math.max(1600, naturalW);
    let exportH = Math.max(900, naturalH);

    if (aspectRatio === '1:1') {
      const size = Math.min(exportW, exportH);
      exportW = size;
      exportH = size;
    } else if (aspectRatio === '16:9') {
      exportH = Math.round(exportW * (9 / 16));
    } else if (aspectRatio === '9:16') {
      exportW = Math.round(exportH * (9 / 16));
    } else if (aspectRatio === '4:5') {
      exportW = Math.round(exportH * (4 / 5));
    } else if (aspectRatio === '4:3') {
      exportH = Math.round(exportW * (3 / 4));
    } else {
      const naturalAspect = naturalW / naturalH;
      exportH = Math.round(exportW / naturalAspect);
    }

    exportCanvas.width = exportW;
    exportCanvas.height = exportH;
    const eCtx = exportCanvas.getContext('2d');

    if (!eCtx) {
      return currentImageSrc || null;
    }

    // Apply color filter string
    const bVal = 100 + brightness;
    const cVal = 100 + contrast;
    const sVal = 100 + saturation;
    const sepVal = sepia;
    eCtx.filter = `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%) sepia(${sepVal}%)`;

    const previewCanvas = canvasRef.current;
    const scaleRatio = previewCanvas ? exportW / previewCanvas.width : 1;

    eCtx.save();
    eCtx.translate(exportW / 2 + panX * scaleRatio, exportH / 2 + panY * scaleRatio);
    eCtx.rotate(((rotation + straighten) * Math.PI) / 180);
    eCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    eCtx.scale(zoom, zoom);

    const imgAspect = naturalW / naturalH;
    const boxAspect = exportW / exportH;

    let drawW: number;
    let drawH: number;

    if (imgAspect > boxAspect) {
      drawH = exportH;
      drawW = exportH * imgAspect;
    } else {
      drawW = exportW;
      drawH = exportW / imgAspect;
    }

    eCtx.imageSmoothingEnabled = true;
    eCtx.imageSmoothingQuality = 'high';
    eCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    eCtx.restore();

    // Warmth / Tint overlay on export
    if (warmth !== 0 || tint !== 0) {
      eCtx.save();
      if (warmth > 0) {
        eCtx.fillStyle = `rgba(255, 170, 40, ${Math.min(0.25, (warmth / 100) * 0.4)})`;
        eCtx.globalCompositeOperation = 'overlay';
        eCtx.fillRect(0, 0, exportW, exportH);
      } else if (warmth < 0) {
        eCtx.fillStyle = `rgba(40, 150, 255, ${Math.min(0.25, (-warmth / 100) * 0.4)})`;
        eCtx.globalCompositeOperation = 'overlay';
        eCtx.fillRect(0, 0, exportW, exportH);
      }

      if (tint > 0) {
        eCtx.fillStyle = `rgba(230, 40, 180, ${Math.min(0.2, (tint / 100) * 0.35)})`;
        eCtx.globalCompositeOperation = 'color';
        eCtx.fillRect(0, 0, exportW, exportH);
      } else if (tint < 0) {
        eCtx.fillStyle = `rgba(40, 230, 100, ${Math.min(0.2, (-tint / 100) * 0.35)})`;
        eCtx.globalCompositeOperation = 'color';
        eCtx.fillRect(0, 0, exportW, exportH);
      }
      eCtx.restore();
    }

    // Vignette on export
    if (vignette > 0) {
      eCtx.save();
      const radius = Math.max(exportW, exportH) * 0.75;
      const grad = eCtx.createRadialGradient(
        exportW / 2,
        exportH / 2,
        radius * 0.35,
        exportW / 2,
        exportH / 2,
        radius
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${(vignette / 100) * 0.7})`);
      eCtx.fillStyle = grad;
      eCtx.globalCompositeOperation = 'source-over';
      eCtx.fillRect(0, 0, exportW, exportH);
      eCtx.restore();
    }

    return exportCanvas.toDataURL('image/jpeg', 0.94);
  };

  const handleSaveAndApply = () => {
    const dataUrl = generateExportDataUrl();
    if (dataUrl) {
      onSave(dataUrl);
      onClose();
    } else {
      onClose();
    }
  };

  const handleExportToImgBB = async () => {
    const dataUrl = generateExportDataUrl();
    if (!dataUrl) return;

    setIsUploadingToImgBB(true);
    try {
      const res = await uploadToImgBB(dataUrl);
      const url = res.displayUrl || res.url;
      onSave(url);
      onClose();
    } catch (err: any) {
      console.error('ImgBB export error:', err);
      alert('ImgBB upload error: ' + (err.message || 'Failed to upload'));
    } finally {
      setIsUploadingToImgBB(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="image-adjust-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#050811]/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="image-adjust-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#0b0f19] text-slate-100 rounded-2xl sm:rounded-3xl border border-slate-800/90 shadow-2xl overflow-hidden flex flex-col max-h-[95dvh] my-auto"
        >
          {/* Top Pro Studio Header Bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide font-heading">
                    {title}
                  </h3>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800/70 text-[10px] font-mono text-sky-400 font-bold uppercase">
                    PRO EDIT APP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {imageMeta.width}×{imageMeta.height} • {aspectRatio.toUpperCase()} • sRGB Rec.709
                </p>
              </div>
            </div>

            {/* Center Quick Actions: Live Compare & Grid Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-edit-compare"
                onMouseDown={() => setIsComparing(true)}
                onMouseUp={() => setIsComparing(false)}
                onMouseLeave={() => setIsComparing(false)}
                onTouchStart={() => setIsComparing(true)}
                onTouchEnd={() => setIsComparing(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                  isComparing
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Press & hold to see original unedited picture"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hold to Compare</span>
                <span className="sm:hidden">Compare</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGrid((g) => !g)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  showGrid
                    ? 'bg-sky-950 text-sky-400 border border-sky-800'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Rule of Thirds Composition Grid"
              >
                <Grid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Reset All Adjustments"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-5 bg-slate-800 mx-0.5" />

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Stage & Toolset Viewport */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-[#080c16]">
            {/* Viewport Canvas Center Stage */}
            <div className="flex-1 relative flex flex-col items-center justify-center p-4 sm:p-6 bg-[#090e1a] overflow-hidden select-none min-h-[260px] sm:min-h-[340px]">
              {/* Checkered / Charcoal Canvas Stage Container */}
              <div className="relative max-w-full max-h-[380px] flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-[#050811]">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                  className="max-w-full max-h-[360px] w-auto h-auto object-contain cursor-grab active:cursor-grabbing transition-transform"
                />

                {/* Rule of Thirds Grid Overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                    <div className="border-r border-b border-white/15" />
                    <div className="border-r border-b border-white/15" />
                    <div className="border-b border-white/15" />
                    <div className="border-r border-b border-white/15" />
                    <div className="border-r border-b border-white/15" />
                    <div className="border-b border-white/15" />
                    <div className="border-r border-b border-white/15" />
                    <div className="border-r border-b border-white/15" />
                    <div />
                  </div>
                )}

                {/* On-Canvas Live Status Badge */}
                <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-1.5">
                  {isComparing ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" /> ORIGINAL UNEDITED
                    </span>
                  ) : hasZeroChanges ? (
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-400 font-mono text-[10px] backdrop-blur-xs">
                      UNTOUCHED RAW
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/90 text-slate-950 font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> LIVE COLOR GRADE
                    </span>
                  )}
                </div>

                {/* Mini RGB Color Waveform / Histogram Visualizer */}
                <div className="absolute top-3 right-3 pointer-events-none bg-slate-950/80 border border-slate-800 rounded-lg p-1.5 flex items-end gap-1 h-6 backdrop-blur-xs">
                  <div 
                    className="w-1.5 bg-rose-500 rounded-xs transition-all"
                    style={{ height: `${Math.min(20, Math.max(4, 12 + warmth * 0.15 + brightness * 0.1))}px` }}
                    title="Red Channel"
                  />
                  <div 
                    className="w-1.5 bg-emerald-500 rounded-xs transition-all"
                    style={{ height: `${Math.min(20, Math.max(4, 12 + tint * -0.15 + brightness * 0.1))}px` }}
                    title="Green Channel"
                  />
                  <div 
                    className="w-1.5 bg-sky-500 rounded-xs transition-all"
                    style={{ height: `${Math.min(20, Math.max(4, 12 - warmth * 0.15 + brightness * 0.1))}px` }}
                    title="Blue Channel"
                  />
                </div>
              </div>

              {/* Viewport Floating HUD Controls (Zoom, Pan, Rotate, Fit) */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-sky-400 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-3.5 bg-slate-800 mx-1" />

                <button
                  type="button"
                  onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
                  title="Fit to Frame"
                >
                  Fit Frame
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Rotate Left 90°"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Rotate Right 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setFlipH((f) => !f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    flipH ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Flip Horizontal"
                >
                  Flip H
                </button>

                <div className="w-[1px] h-3.5 bg-slate-800 mx-1" />

                {/* Upload / Test different image button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-300 hover:text-sky-400 hover:bg-slate-800 flex items-center gap-1"
                  title="Load a different image into the editor"
                >
                  <Upload className="w-3 h-3" /> Load Image
                </button>
              </div>
            </div>

            {/* Right Editing Toolset Panel (Docked App Interface) */}
            <div className="w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-800/90 bg-[#0e1424]">
              {/* Tool Category Tabs */}
              <div className="p-2 border-b border-slate-800/80 grid grid-cols-4 gap-1 bg-[#0b0f19]">
                <button
                  type="button"
                  onClick={() => setActiveToolTab('presets')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    activeToolTab === 'presets'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px]">LUTs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveToolTab('color')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    activeToolTab === 'color'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Color</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveToolTab('crop')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    activeToolTab === 'crop'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Crop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveToolTab('effects')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    activeToolTab === 'effects'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Finish</span>
                </button>
              </div>

              {/* Scrollable Tool Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 max-h-[340px] lg:max-h-none text-xs">
                {/* ================= TAB 1: LUTs & PRESETS ================= */}
                {activeToolTab === 'presets' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        Cinematic Presets & LUTs
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(PRESETS[0])}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Reset to RAW
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                      {PRESETS.map((p) => {
                        const isSelected = activePreset === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPreset(p)}
                            className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                              isSelected
                                ? 'bg-slate-800 border-sky-500 ring-1 ring-sky-500 shadow-md'
                                : 'bg-[#0b0f19] border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-white block">
                                {p.name}
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                                {p.tag}
                              </span>
                            </div>

                            {/* Preset color strip bar */}
                            <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${p.color}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ================= TAB 2: PRO COLOR GRADING ================= */}
                {activeToolTab === 'color' && (
                  <div className="space-y-4">
                    {/* Brightness / Exposure Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1 text-slate-300">
                        <span>Exposure / Brightness</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sky-400">{brightness > 0 ? `+${brightness}` : brightness}</span>
                          {brightness !== 0 && (
                            <button type="button" onClick={() => setBrightness(0)} className="text-[10px] text-slate-500 hover:text-slate-300">0</button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Contrast Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1 text-slate-300">
                        <span>Contrast</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sky-400">{contrast > 0 ? `+${contrast}` : contrast}</span>
                          {contrast !== 0 && (
                            <button type="button" onClick={() => setContrast(0)} className="text-[10px] text-slate-500 hover:text-slate-300">0</button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Temperature / Warmth (Cool Blue <-> Warm Amber) */}
                    <div>
                      <div className="flex items-center justify-between mb-1 text-slate-300">
                        <span>Temperature (Warmth)</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-amber-400">{warmth > 0 ? `+${warmth}` : warmth}</span>
                          {warmth !== 0 && (
                            <button type="button" onClick={() => setWarmth(0)} className="text-[10px] text-slate-500 hover:text-slate-300">0</button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={warmth}
                        onChange={(e) => setWarmth(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gradient-to-r from-blue-500 via-slate-700 to-amber-500 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                        <span>Cool Blue</span>
                        <span>Warm Amber</span>
                      </div>
                    </div>

                    {/* Tint (Green <-> Magenta) */}
                    <div>
                      <div className="flex items-center justify-between mb-1 text-slate-300">
                        <span>Color Tint</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-pink-400">{tint > 0 ? `+${tint}` : tint}</span>
                          {tint !== 0 && (
                            <button type="button" onClick={() => setTint(0)} className="text-[10px] text-slate-500 hover:text-slate-300">0</button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={tint}
                        onChange={(e) => setTint(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gradient-to-r from-emerald-500 via-slate-700 to-pink-500 rounded-lg appearance-none cursor-pointer accent-pink-400"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                        <span>Emerald</span>
                        <span>Magenta</span>
                      </div>
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex items-center justify-between mb-1 text-slate-300">
                        <span>Color Saturation</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sky-400">{saturation > 0 ? `+${saturation}` : saturation}</span>
                          {saturation !== 0 && (
                            <button type="button" onClick={() => setSaturation(0)} className="text-[10px] text-slate-500 hover:text-slate-300">0</button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={saturation}
                        onChange={(e) => setSaturation(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>
                  </div>
                )}

                {/* ================= TAB 3: CROP & ASPECT RATIO ================= */}
                {activeToolTab === 'crop' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Aspect Ratio Presets
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['16:9', '9:16', '1:1', '4:5', '4:3', 'free'] as AspectRatio[]).map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setAspectRatio(ratio)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between ${
                              aspectRatio === ratio
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-[#0b0f19] text-slate-300 border border-slate-800 hover:bg-slate-800/50'
                            }`}
                          >
                            <span>
                              {ratio === '16:9' && '16:9 (YouTube)'}
                              {ratio === '9:16' && '9:16 (Reel/Short)'}
                              {ratio === '1:1' && '1:1 (Square Feed)'}
                              {ratio === '4:5' && '4:5 (Portrait)'}
                              {ratio === '4:3' && '4:3 (Standard)'}
                              {ratio === 'free' && 'Original Canvas'}
                            </span>
                            {aspectRatio === ratio && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Straighten Angle Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1 text-slate-300">
                        <span>Straighten Angle</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sky-400">{straighten}°</span>
                          {straighten !== 0 && (
                            <button type="button" onClick={() => setStraighten(0)} className="text-[10px] text-slate-500 hover:text-slate-300">0°</button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        value={straighten}
                        onChange={(e) => setStraighten(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Vertical Flip */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFlipV((v) => !v)}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                          flipV ? 'bg-sky-500 text-slate-950 font-bold border-sky-400' : 'bg-[#0b0f19] text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Flip Vertical
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= TAB 4: FINISH & EFFECTS ================= */}
                {activeToolTab === 'effects' && (
                  <div className="space-y-4">
                    {/* Vignette Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1 text-slate-300">
                        <span>Cinematic Vignette</span>
                        <span className="font-mono text-sky-400">{vignette}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vignette}
                        onChange={(e) => setVignette(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Soft dark gradient falloff on edges to draw focus inward.
                      </p>
                    </div>

                    {/* Sepia Vintage */}
                    <div>
                      <div className="flex items-center justify-between mb-1 text-slate-300">
                        <span>Sepia / Film Nostalgia</span>
                        <span className="font-mono text-amber-400">{sepia}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sepia}
                        onChange={(e) => setSepia(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Drawer / Export Button */}
              <div className="p-4 border-t border-slate-800 bg-[#0b0f19] flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isUploadingToImgBB}
                  onClick={handleExportToImgBB}
                  className="py-2.5 px-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Upload adjusted image directly to ImgBB Cloud"
                >
                  {isUploadingToImgBB ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload to ImgBB</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-apply-and-save-edit"
                  onClick={handleSaveAndApply}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

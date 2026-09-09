import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { uploadToImgBB, IMGBB_API_KEY } from '../services/imgbb';

interface ImgbbUploaderProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  buttonText?: string;
  multiple?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ImgbbUploader({
  onUploadSuccess,
  label = 'Upload Image via ImgBB CDN',
  buttonText = 'Upload to ImgBB',
  multiple = false,
  compact = false,
  className = '',
}: ImgbbUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);

    const fileArray = Array.from(files);
    let successCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgress(
        fileArray.length > 1
          ? `Uploading ${i + 1} of ${fileArray.length}...`
          : `Uploading to ImgBB CDN...`
      );

      try {
        const result = await uploadToImgBB(file);
        const finalUrl = result.displayUrl || result.url;
        onUploadSuccess(finalUrl);
        setLastUploadedUrl(finalUrl);
        successCount++;
      } catch (err: any) {
        console.error('ImgBB upload error:', err);
        setErrorMessage(err.message || 'ImgBB upload failed');
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (successCount > 0 && !errorMessage) {
      setTimeout(() => setLastUploadedUrl(null), 4000);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUploadFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          ref={fileInputRef}
          onChange={onFileInputChange}
          className="hidden"
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          title="Direct upload to ImgBB Cloud API"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>{uploadProgress || 'Uploading...'}</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{buttonText}</span>
            </>
          )}
        </button>

        {lastUploadedUrl && (
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Uploaded!</span>
          </span>
        )}

        {errorMessage && (
          <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{errorMessage}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-slate-950/80 border border-slate-800 p-4 transition-all ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UploadCloud className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">{label}</span>
        </div>
        <span className="text-[10px] text-emerald-400/90 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
          ImgBB API Active
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/50'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          ref={fileInputRef}
          onChange={onFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mb-2" />
            <span className="text-xs font-bold text-white">
              {uploadProgress || 'Uploading to ImgBB CDN...'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              Optimizing image and generating permanent hosted URL
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 mb-2">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              Drag & drop images here, or <span className="text-emerald-400 underline">browse files</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports PNG, JPG, GIF, WebP up to 32MB • Direct ImgBB Cloud Hosting
            </p>
          </div>
        )}
      </div>

      {lastUploadedUrl && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-emerald-300 truncate">
              Image uploaded successfully to ImgBB CDN!
            </span>
          </div>
          <a
            href={lastUploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-emerald-400 hover:underline font-mono shrink-0 ml-2"
          >
            View ↗
          </a>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

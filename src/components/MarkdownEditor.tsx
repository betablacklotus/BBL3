import { useRef, useState, useEffect } from 'react';
import { Upload, LayoutGrid } from 'lucide-react';
import { uploadImage } from '../imageUpload';
import { GalleryBuilder } from './GalleryBuilder';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

export function MarkdownEditor({ value, onChange, rows = 18 }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  const pendingCursorRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ active: boolean; count: number }>({ active: false, count: 0 });
  const [showGallery, setShowGallery] = useState(false);

  // Keep valueRef in sync so async handlers always read the latest value
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Restore cursor position after React re-renders the textarea
  useEffect(() => {
    if (pendingCursorRef.current !== null && textareaRef.current) {
      const pos = pendingCursorRef.current;
      textareaRef.current.setSelectionRange(pos, pos);
      pendingCursorRef.current = null;
    }
  });

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    const current = valueRef.current;
    const start = el ? el.selectionStart : current.length;
    const end = el ? el.selectionEnd : current.length;
    const next = current.slice(0, start) + text + current.slice(end);
    pendingCursorRef.current = start + text.length;
    onChange(next);
  };

  const processFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;

    setUploadStatus({ active: true, count: images.length });
    try {
      const lines = await Promise.all(
        images.map(async (file) => {
          const url = await uploadImage(file);
          const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
          return `![${alt}](${url})`;
        })
      );
      insertAtCursor('\n' + lines.join('\n') + '\n');
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadStatus({ active: false, count: 0 });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    await processFiles(files);
  };

  const showOverlay = isDragging || uploadStatus.active;

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <label
          className="btn cursor-pointer"
          style={{ padding: '5px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Upload size={13} />
          Upload Image
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFileInput}
            disabled={uploadStatus.active}
          />
        </label>

        <button
          type="button"
          onClick={() => setShowGallery(true)}
          className="btn"
          style={{ padding: '5px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          disabled={uploadStatus.active}
        >
          <LayoutGrid size={13} />
          Add Image Gallery
        </button>

        {uploadStatus.active && (
          <span className="text-xs text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span className="upload-spinner" />
            Uploading {uploadStatus.count} image{uploadStatus.count !== 1 ? 's' : ''}…
          </span>
        )}
      </div>

      {/* Textarea + drop layer */}
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field font-mono"
          rows={rows}
          style={{ fontSize: 13, lineHeight: 1.6, width: '100%' }}
        />

        {showOverlay && (
          <div className="upload-drop-overlay">
            <div className="upload-drop-inner">
              <Upload size={28} />
              <span>
                {uploadStatus.active
                  ? `Uploading ${uploadStatus.count} image${uploadStatus.count !== 1 ? 's' : ''}…`
                  : 'Drop images to upload'}
              </span>
            </div>
          </div>
        )}
      </div>

      {showGallery && (
        <GalleryBuilder
          onClose={() => setShowGallery(false)}
          onInsert={(md) => {
            insertAtCursor('\n' + md + '\n');
            setShowGallery(false);
          }}
        />
      )}
    </div>
  );
}

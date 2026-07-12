import { useState, useRef } from 'react';
import { Plus, X, ArrowUp, ArrowDown, LayoutGrid, Rows3 } from 'lucide-react';
import { uploadImage } from '../imageUpload';

interface GalleryItem {
  id: string;
  file: File;
  previewUrl: string;
  alt: string;
}

interface GalleryBuilderProps {
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

export function GalleryBuilder({ onClose, onInsert }: GalleryBuilderProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [layout, setLayout] = useState<'grid' | 'carousel'>('grid');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const newItems: GalleryItem[] = imageFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim(),
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const updateAlt = (id: string, alt: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, alt } : i)));

  const handleInsert = async () => {
    if (items.length === 0 || uploading) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await Promise.all(
        items.map(async (item) => ({
          url: await uploadImage(item.file),
          alt: item.alt,
        }))
      );
      const lines = uploaded.map(({ url, alt }) => `![${alt}](${url})`).join('\n');
      const markdown = layout === 'carousel' ? `:::carousel\n${lines}\n:::` : lines;
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      onInsert(markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setUploading(false);
    }
  };

  return (
    <div
      className="gallery-builder-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="gallery-builder-modal">
        {/* Header */}
        <div className="gallery-builder-header">
          <span className="text-base font-semibold">Add Image Gallery</span>
          <button onClick={onClose} className="gallery-builder-close-btn" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="gallery-builder-body">
          <div className="flex items-center gap-3 mb-4">
            <label
              className="btn cursor-pointer"
              style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Plus size={14} />
              Add Images
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFileInput}
              />
            </label>
            {items.length === 0 && (
              <span className="text-xs text-muted">Select multiple images, or drag them into the list.</span>
            )}
          </div>

          {/* Empty drop zone */}
          {items.length === 0 ? (
            <div
              className="gallery-builder-empty"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <LayoutGrid size={28} style={{ opacity: 0.25 }} />
              <span className="text-sm text-muted">No images yet — click Add Images or drag here</span>
            </div>
          ) : (
            <div className="gallery-builder-list">
              {items.map((item, idx) => (
                <div key={item.id} className="gallery-builder-item">
                  <img src={item.previewUrl} alt={item.alt} className="gallery-builder-thumb" />
                  <div className="gallery-builder-item-meta">
                    <input
                      type="text"
                      value={item.alt}
                      onChange={(e) => updateAlt(item.id, e.target.value)}
                      className="field"
                      placeholder="Alt text"
                      style={{ fontSize: 12, padding: '3px 7px' }}
                    />
                    <span className="text-xs text-muted">
                      {(item.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="gallery-builder-item-controls">
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, -1)}
                      disabled={idx === 0}
                      className="btn"
                      style={{ padding: '4px 7px' }}
                      aria-label="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, 1)}
                      disabled={idx === items.length - 1}
                      className="btn"
                      style={{ padding: '4px 7px' }}
                      aria-label="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="btn"
                      style={{ padding: '4px 7px' }}
                      aria-label="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Layout picker */}
          {items.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold mb-2">Layout</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLayout('grid')}
                  className={`gallery-layout-btn${layout === 'grid' ? ' gallery-layout-btn--active' : ''}`}
                >
                  <LayoutGrid size={14} />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('carousel')}
                  className={`gallery-layout-btn${layout === 'carousel' ? ' gallery-layout-btn--active' : ''}`}
                >
                  <Rows3 size={14} />
                  Carousel
                </button>
              </div>
              <p className="text-xs text-muted mt-1.5">
                {layout === 'grid'
                  ? 'Responsive grid — click any image to enlarge with lightbox.'
                  : 'Horizontal scroll strip — click any image to enlarge with lightbox.'}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-error mt-3">{error}</p>}
        </div>

        {/* Footer */}
        <div className="gallery-builder-footer">
          <button type="button" onClick={onClose} className="btn">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={items.length === 0 || uploading}
            className="btn btn-primary"
          >
            {uploading
              ? `Uploading ${items.length} image${items.length !== 1 ? 's' : ''}…`
              : `Insert ${items.length > 0 ? items.length + ' ' : ''}Image${items.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

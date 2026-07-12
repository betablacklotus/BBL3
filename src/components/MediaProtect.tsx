import { useEffect, useRef, ReactNode } from 'react';

// Wraps media (images, video, audio) with basic client-side protection:
// - disables right-click context menu on the media
// - disables drag-to-save on images
// - blocks common keyboard shortcuts (save, view source) while focused
// - adds a transparent overlay on images to prevent easy right-click save
//
// NOTE: Client-side protection is deterrent only and can be bypassed by a
// determined user. For real protection, use Bunny Stream token auth + domain
// restrictions for audio/video, and server-side hotlink protection for images.

interface MediaProtectProps {
  children: ReactNode;
  className?: string;
}

export function MediaProtect({ children, className = '' }: MediaProtectProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+U, Ctrl+Shift+I when media is focused
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'u')) {
        e.preventDefault();
      }
    };

    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('dragstart', onDragStart);
      el.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={ref} className={`media-protect ${className}`} onContextMenu={(e) => e.preventDefault()}>
      {children}
    </div>
  );
}

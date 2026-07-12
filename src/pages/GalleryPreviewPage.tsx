import { useState, useCallback } from 'react';
import { Lightbox } from '../components/Lightbox';
import { navigate } from '../router';

const IMAGES = [
  { src: 'https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Wet sand at low tide, early morning' },
  { src: 'https://images.pexels.com/photos/163236/pexels-photo-163236.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Fishing boats moored in harbour' },
  { src: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Coiled rope on a wooden dock' },
  { src: 'https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Peeling blue paint on a boat hull' },
  { src: 'https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Fog sitting low over the water' },
  { src: 'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Seabirds on a groyne at low water' },
  { src: 'https://images.pexels.com/photos/2249959/pexels-photo-2249959.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Weathered wooden bollard' },
  { src: 'https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', alt: 'Breakwater extending into a grey sea' },
  { src: 'https://images.pexels.com/photos/2480078/pexels-photo-2480078.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Rock pools exposed at low tide' },
  { src: 'https://images.pexels.com/photos/1450363/pexels-photo-1450363.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop', alt: 'Kelp draped over dark rocks' },
  { src: 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Old stone sea wall, close texture' },
  { src: 'https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Iron ladder descending to the water' },
  { src: 'https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Horizon line with a distant vessel' },
  { src: 'https://images.pexels.com/photos/994605/pexels-photo-994605.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Pebble beach, long exposure blur' },
  { src: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Wooden beach hut, faded yellow' },
  { src: 'https://images.pexels.com/photos/1005014/pexels-photo-1005014.jpeg?auto=compress&cs=tinysrgb&w=900', alt: 'Footprints in wet sand leading away' },
  { src: 'https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=900&h=500&fit=crop', alt: 'The sea, simply' },
];

export function GalleryPreviewPage() {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const open = useCallback((i: number) => setLightboxIndex(i), []);
  const close = useCallback(() => setLightboxIndex(-1), []);
  const nav = useCallback((i: number) => setLightboxIndex(i), []);

  return (
    <div className="max-w-page mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20">
      <div className="text-xs text-muted mb-6">
        <a href="/" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <span className="mx-1">/</span>
        <a href="/seventeen-frames-from-the-coast" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('/seventeen-frames-from-the-coast'); }}>Seventeen Frames from the Coast</a>
        <span className="mx-1">/</span>
        <span>Gallery Preview</span>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2" style={{ lineHeight: 1.2 }}>
          Gallery Preview
        </h1>
        <p className="text-sm text-muted">
          All 17 images from <em>Seventeen Frames from the Coast</em> — shown below in both available gallery layouts. Click any image to enlarge.
        </p>
      </header>

      {/* Grid layout */}
      <section className="mb-12">
        <div className="flex items-baseline gap-3 mb-3 pb-2 border-b rule">
          <h2 className="text-base font-semibold">Grid</h2>
          <span className="text-xs text-muted">Responsive square tiles — fills available width</span>
        </div>
        <div className="gallery">
          {IMAGES.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              loading="lazy"
              onClick={() => open(i)}
            />
          ))}
        </div>
      </section>

      {/* Carousel layout */}
      <section className="mb-12">
        <div className="flex items-baseline gap-3 mb-3 pb-2 border-b rule">
          <h2 className="text-base font-semibold">Carousel</h2>
          <span className="text-xs text-muted">Horizontal scroll strip — swipe or drag</span>
        </div>
        <div className="gallery-carousel">
          {IMAGES.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              loading="lazy"
              onClick={() => open(i)}
            />
          ))}
        </div>
      </section>

      <div>
        <a
          href="/seventeen-frames-from-the-coast"
          className="btn"
          onClick={(e) => { e.preventDefault(); navigate('/seventeen-frames-from-the-coast'); }}
        >
          ← Back to post
        </a>
      </div>

      {lightboxIndex >= 0 && (
        <Lightbox
          images={IMAGES}
          index={lightboxIndex}
          onClose={close}
          onNavigate={nav}
        />
      )}
    </div>
  );
}

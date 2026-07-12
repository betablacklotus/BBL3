import { useState, useEffect } from 'react';
import { isLoggedIn } from '../adminAuth';
import { navigate } from '../router';
import { Pencil } from 'lucide-react';

interface EditFabProps {
  slug?: string;
  type?: 'post' | 'page';
}

export function EditFab({ slug, type = 'post' }: EditFabProps) {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  if (!loggedIn) return null;

  const handleClick = () => {
    if (slug) {
      const param = type === 'page' ? 'editPage' : 'edit';
      navigate(`/backstage-3k9mxf2p7qw4?${param}=${encodeURIComponent(slug)}`);
    } else {
      navigate('/backstage-3k9mxf2p7qw4');
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={slug ? `Edit this ${type}` : 'Admin panel'}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 0.875rem',
        background: '#1a1a1a',
        color: '#f5f5f0',
        border: '1px solid #1a1a1a',
        fontSize: '0.75rem',
        fontFamily: 'inherit',
        letterSpacing: '0.03em',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        opacity: 0.85,
        transition: 'opacity 0.15s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
    >
      <Pencil size={13} strokeWidth={2} />
      {slug ? (type === 'page' ? 'Edit Page' : 'Edit Post') : 'Admin'}
    </button>
  );
}

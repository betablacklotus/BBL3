import { useState } from 'react';
import { BookOpen, Image as ImageIcon, Settings, Upload, Copy, Check, FilePlus, FileDown, FileText } from 'lucide-react';
import { getAllPosts, pinPost, unpinPost, deletePost, updatePost, resetPosts, createPost, getPost, formatDate } from '../postStore';
import { getAllPages, createPage, updatePage, deletePage } from '../pageStore';
import { changePassword } from '../adminAuth';
import { checkPasswordStrength, getBlockedIPs, getRecentFailedAttempts } from '../security';
import { useMeta } from '../seo';
import { navigate } from '../router';
import { downloadRssFeed } from '../rss';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { getBunnyConfig, setBunnyConfig, isStorageConfigured, BunnyConfig } from '../bunnyConfig';
import { uploadImage } from '../imageUpload';
import { downloadPostAsMarkdown, markdownToPost } from '../markdownExport';
import type { Post, Page } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  useMeta({ title: 'Admin Panel', description: 'Manage posts.' });

  const [posts, setPosts] = useState<Post[]>(getAllPosts());
  const [editing, setEditing] = useState<Post | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('edit');
    if (slug) {
      history.replaceState(null, '', window.location.pathname);
      const found = getPost(slug);
      if (found) return { ...found };
    }
    return null;
  });
  const [isNew, setIsNew] = useState(false);
  const [tab, setTab] = useState<'posts' | 'pages' | 'media' | 'settings'>('posts');
  const [message, setMessage] = useState('');

  const refresh = () => setPosts(getAllPosts());
  const flash = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3500); };

  const handlePin = (slug: string, pin: boolean) => {
    if (pin) pinPost(slug); else unpinPost(slug);
    refresh();
  };

  const handleDelete = (slug: string) => {
    if (confirm('Delete this post? This cannot be undone.')) {
      deletePost(slug);
      refresh();
    }
  };

  const handleSave = (post: Post) => {
    if (isNew) {
      if (!createPost(post)) {
        alert(`A post with slug "${post.slug}" already exists. Change the slug and try again.`);
        return;
      }
    } else {
      post.pinned ? pinPost(post.slug) : unpinPost(post.slug);
      updatePost(post.slug, post);
    }
    refresh();
    setEditing(null);
    setIsNew(false);
    flash(isNew ? 'Post created.' : 'Post saved.');
  };

  const handleSaveAndView = (post: Post) => {
    if (isNew) {
      if (!createPost(post)) {
        alert(`A post with slug "${post.slug}" already exists. Change the slug and try again.`);
        return;
      }
    } else {
      post.pinned ? pinPost(post.slug) : unpinPost(post.slug);
      updatePost(post.slug, post);
    }
    refresh();
    setEditing(null);
    setIsNew(false);
    window.open(`/${post.slug}`, '_blank', 'noopener');
  };

  const handleNew = () => {
    setIsNew(true);
    setEditing({
      slug: '',
      title: '',
      date: new Date().toISOString().slice(0, 10),
      excerpt: '',
      content: '',
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = markdownToPost(reader.result as string);
      if (!parsed) {
        alert('Could not parse this file. Make sure it has valid frontmatter (---) with title and slug fields.');
        return;
      }
      setIsNew(true);
      setEditing({
        slug: '',
        title: '',
        date: new Date().toISOString().slice(0, 10),
        excerpt: '',
        content: '',
        ...parsed,
      });
    };
    reader.readAsText(file);
  };

  const handleExportAll = () => {
    posts.forEach((p, i) => setTimeout(() => downloadPostAsMarkdown(p), i * 100));
  };

  const handleReset = () => {
    if (confirm('Reset all posts to the original sample content? This will delete any posts you have created.')) {
      resetPosts();
      refresh();
      flash('Posts reset to defaults.');
    }
  };

  if (editing) {
    return (
      <PostEditor
        post={editing}
        isNew={isNew}
        onSave={handleSave}
        onSaveAndView={handleSaveAndView}
        onCancel={() => { setEditing(null); setIsNew(false); }}
      />
    );
  }

  return (
    <div className="max-w-page mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20">
      <header className="border-b rule pb-5 mb-7 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-0.5">Admin</h1>
          <p className="text-sm text-muted">{posts.length} posts</p>
        </div>
        <button onClick={onLogout} className="btn">Log out</button>
      </header>

      {message && (
        <div className="border p-3 mb-5 text-sm" style={{ borderColor: '#5a9e5a', background: '#eef5ee' }}>
          {message}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b rule mb-8">
        {([
          ['posts',    BookOpen,   'Posts'],
          ['pages',    FileText,   'Pages'],
          ['media',    ImageIcon,  'Media'],
          ['settings', Settings,   'Settings'],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm select-none ${
              tab === id ? 'font-semibold' : 'text-muted'
            }`}
            style={{
              borderBottom: tab === id ? '2px solid #1a1a1a' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Posts tab ── */}
      {tab === 'posts' && (
        <div>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <button onClick={handleNew} className="btn btn-primary flex items-center gap-1.5">
              <FilePlus size={14} />
              New Post
            </button>
            <label className="btn cursor-pointer flex items-center gap-1.5">
              <Upload size={14} />
              Import .md
              <input
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                className="sr-only"
                onChange={handleImport}
              />
            </label>
            <button onClick={handleExportAll} className="btn flex items-center gap-1.5">
              <FileDown size={14} />
              Export all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead>
                <tr className="border-b rule">
                  <th className="text-left py-2 px-2 font-semibold">Title</th>
                  <th className="text-left py-2 px-2 font-semibold hidden sm:table-cell">Date</th>
                  <th className="text-center py-2 px-2 font-semibold">Pin</th>
                  <th className="text-left py-2 px-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.slug} className="border-b rule" style={{ transition: 'background 0.1s' }}>
                    <td className="py-2.5 px-2">
                      <a
                        href={`/${post.slug}`}
                        onClick={(e) => { e.preventDefault(); navigate(`/${post.slug}`); }}
                        style={{ textDecoration: 'none', color: '#1a1a1a' }}
                        className="hover:underline"
                      >
                        {post.title}
                      </a>
                    </td>
                    <td className="py-2.5 px-2 text-muted hidden sm:table-cell whitespace-nowrap">
                      {formatDate(post.date)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!post.pinned}
                        onChange={(e) => handlePin(post.slug, e.target.checked)}
                        className="cursor-pointer"
                        title="Pin to top of feed"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex gap-1 flex-wrap items-center">
                        <button
                          onClick={() => setEditing({ ...post })}
                          className="btn"
                          style={{ padding: '3px 9px', fontSize: 12 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="btn"
                          style={{ padding: '3px 9px', fontSize: 12 }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => downloadPostAsMarkdown(post)}
                          className="btn"
                          style={{ padding: '3px 9px', fontSize: 12 }}
                          title="Download as Markdown file"
                        >
                          ↓ .md
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pages tab ── */}
      {tab === 'pages' && <PagesTab />}

      {/* ── Media tab ── */}
      {tab === 'media' && <MediaUploader />}
      {/* ── Settings tab ── */}
      {tab === 'settings' && (
        <SettingsTab
          onReset={handleReset}
          blockedIPs={getBlockedIPs()}
          failedAttempts={getRecentFailedAttempts()}
        />
      )}
    </div>
  );
}

// ─── Media Uploader ──────────────────────────────────────────────────────────

interface UploadResult {
  name: string;
  url: string;
}

function MediaUploader() {
  const [results, setResults] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const configured = isStorageConfigured();
  const cfg = getBunnyConfig();

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    setError('');
    setUploading(true);
    const newResults: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`Uploading ${file.name} (${i + 1} of ${files.length})…`);
      try {
        const url = await uploadImage(file);
        newResults.push({ name: file.name, url });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.');
        break;
      }
    }

    setResults((prev) => [...prev, ...newResults]);
    setUploading(false);
    setProgress('');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    await processFiles(files);
  };

  if (!configured) {
    return (
      <div className="border rule p-8 text-center">
        <p className="font-semibold mb-2">Bunny Storage not configured</p>
        <p className="text-sm text-muted">
          Add your Bunny Storage credentials in the <strong>Settings</strong> tab to enable image uploads.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <p className="text-sm text-muted">
        Images upload to Bunny Storage (<code>{cfg.cdnUrl || cfg.storageZone}</code>). Copy the CDN URL after upload to paste into your posts.
      </p>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed p-12 text-center transition-colors ${isDragging ? 'border-ink' : ''}`}
        style={{ borderColor: isDragging ? '#1a1a1a' : '#ccc' }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <span className="upload-spinner" />
            <span className="text-sm text-muted">{progress}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={28} style={{ opacity: 0.25 }} />
            <p className="text-sm text-muted">Drag images here, or</p>
            <label className="btn btn-primary cursor-pointer">
              Choose images
              <input
                type="file"
                multiple
                accept="image/*"
                className="sr-only"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm border p-3" style={{ borderColor: '#c00', color: '#c00' }}>{error}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Uploaded ({results.length})</h3>
            <button onClick={() => setResults([])} className="text-xs text-muted hover:text-ink">Clear</button>
          </div>
          <div className="flex flex-col gap-2">
            {results.map((r, idx) => (
              <div key={idx} className="border rule p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted mb-0.5 truncate">{r.name}</p>
                  <code className="text-xs" style={{ wordBreak: 'break-all' }}>{r.url}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(r.url, idx)}
                  className="btn flex items-center gap-1.5 flex-shrink-0"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                >
                  {copiedIdx === idx ? <Check size={11} /> : <Copy size={11} />}
                  {copiedIdx === idx ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bunny Stream guidance */}
      <div className="border rule p-4 text-sm">
        <p className="font-semibold mb-2">Video &amp; Audio (Bunny Stream)</p>
        <p className="text-muted mb-3">
          Upload videos and audio directly on your Bunny.net dashboard, then reference them in posts using:
        </p>
        <ul className="text-muted space-y-1" style={{ listStyle: 'none', padding: 0 }}>
          <li><code>:::bunny-video {'{libraryId} {videoId}'}</code> — video embed</li>
          <li><code>:::bunny-audio {'{libraryId} {audioId}'}</code> — audio embed</li>
        </ul>
        <p className="text-muted mt-3 text-xs">
          Or set Library ID + Video ID in the post editor's Media tab to use it as the post cover.
        </p>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({
  onReset,
  blockedIPs,
  failedAttempts,
}: {
  onReset: () => void;
  blockedIPs: ReturnType<typeof getBlockedIPs>;
  failedAttempts: ReturnType<typeof getRecentFailedAttempts>;
}) {
  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <BunnySettingsForm />

      <div className="border-t rule pt-8">
        <SecuritySection blockedIPs={blockedIPs} failedAttempts={failedAttempts} />
      </div>

      <div className="border-t rule pt-8">
        <h2 className="text-base font-semibold mb-3">Downloads</h2>
        <button onClick={downloadRssFeed} className="btn">Download RSS feed</button>
      </div>

      <div className="border-t rule pt-8">
        <h2 className="text-base font-semibold mb-2">Danger zone</h2>
        <p className="text-sm text-muted mb-4">
          Discard all posts and restore the original sample content.
        </p>
        <button
          onClick={onReset}
          className="btn"
          style={{ borderColor: '#c00', color: '#c00' }}
        >
          Reset posts to defaults
        </button>
      </div>
    </div>
  );
}

function BunnySettingsForm() {
  const [cfg, setCfg] = useState<BunnyConfig>(getBunnyConfig());
  const [saved, setSaved] = useState(false);

  const update = (k: keyof BunnyConfig, v: string) => setCfg((prev) => ({ ...prev, [k]: v }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setBunnyConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="text-base font-semibold mb-1">Bunny.net</h2>
      <p className="text-sm text-muted mb-5">
        Credentials are stored in this browser only and sent only to Bunny's APIs when uploading.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Storage */}
        <div className="border rule p-4 flex flex-col gap-4">
          <h3 className="text-sm font-semibold">Storage Zone — images</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Zone name</label>
              <input
                type="text"
                value={cfg.storageZone}
                onChange={(e) => update('storageZone', e.target.value)}
                className="field"
                placeholder="myblog"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Storage API key</label>
              <input
                type="password"
                value={cfg.storageKey}
                onChange={(e) => update('storageKey', e.target.value)}
                className="field"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Pull zone CDN URL</label>
              <input
                type="url"
                value={cfg.cdnUrl}
                onChange={(e) => update('cdnUrl', e.target.value)}
                className="field"
                placeholder="https://myblog.b-cdn.net"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Storage region endpoint</label>
              <input
                type="text"
                value={cfg.storageHostname}
                onChange={(e) => update('storageHostname', e.target.value)}
                className="field"
                placeholder="storage.bunnycdn.com"
              />
              <p className="text-xs text-muted mt-1">Default: storage.bunnycdn.com (Frankfurt)</p>
            </div>
          </div>
          <p className="text-xs text-muted border-t rule pt-3">
            <strong>CORS required:</strong> In your Bunny Storage zone settings, add your site's origin under &quot;CORS Headers&quot; so browser uploads work.
          </p>
        </div>

        {/* Stream */}
        <div className="border rule p-4 flex flex-col gap-4">
          <h3 className="text-sm font-semibold">Stream Library — video &amp; audio</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Library ID</label>
              <input
                type="text"
                value={cfg.streamLibraryId}
                onChange={(e) => update('streamLibraryId', e.target.value)}
                className="field"
                placeholder="123456"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Stream API key</label>
              <input
                type="password"
                value={cfg.streamApiKey}
                onChange={(e) => update('streamApiKey', e.target.value)}
                className="field"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary self-start flex items-center gap-1.5">
          {saved ? <><Check size={14} /> Saved</> : 'Save Bunny settings'}
        </button>
      </form>
    </div>
  );
}

// ─── Security section ─────────────────────────────────────────────────────────

function SecuritySection({
  blockedIPs,
  failedAttempts,
}: {
  blockedIPs: ReturnType<typeof getBlockedIPs>;
  failedAttempts: ReturnType<typeof getRecentFailedAttempts>;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirmPw) { setMsg('New passwords do not match.'); return; }
    const strength = checkPasswordStrength(next);
    if (!strength.strong) { setMsg(strength.message); return; }
    const result = await changePassword(current, next);
    setMsg(result.message);
    if (result.success) { setCurrent(''); setNext(''); setConfirmPw(''); }
  };

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">Security</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold mb-3">Change password</h3>
          <form onSubmit={handleChange} className="flex flex-col gap-3">
            <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className="field" required />
            <input type="password" placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} className="field" required />
            <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="field" required />
            {msg && <p className="text-xs text-error">{msg}</p>}
            <button type="submit" className="btn btn-primary self-start">Change password</button>
          </form>
          <p className="text-xs text-muted mt-3">12+ chars with upper, lower, number, and symbol.</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Recent failed attempts ({failedAttempts.length})</h3>
          <div className="max-h-40 overflow-y-auto border rule bg-white">
            {failedAttempts.length === 0 ? (
              <p className="p-3 text-xs text-muted">No recent failed attempts.</p>
            ) : (
              <ul className="text-xs">
                {failedAttempts.slice(-10).map((a, i) => (
                  <li key={i} className="px-3 py-1.5 border-b rule last:border-b-0">
                    {new Date(a.timestamp).toLocaleString()} — {a.ip}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <h3 className="text-sm font-semibold mt-5 mb-3">Blocked IPs ({blockedIPs.length})</h3>
          <div className="max-h-40 overflow-y-auto border rule bg-white">
            {blockedIPs.length === 0 ? (
              <p className="p-3 text-xs text-muted">No blocked IPs.</p>
            ) : (
              <ul className="text-xs">
                {blockedIPs.map((b) => (
                  <li key={b.ip} className="px-3 py-1.5 border-b rule last:border-b-0">
                    {b.ip} — until {new Date(b.blockedUntil).toLocaleString()} ({b.attempts} attempts)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pages Tab ───────────────────────────────────────────────────────────────

function PagesTab() {
  const [pages, setPages] = useState<Page[]>(getAllPages());
  const [editing, setEditing] = useState<Page | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = () => setPages(getAllPages());
  const flash = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3500); };

  const handleNew = () => {
    setIsNew(true);
    setEditing({ slug: '', title: '', content: '' });
  };

  const handleSave = (page: Page) => {
    if (isNew) {
      if (!createPage(page)) {
        alert(`A page with slug "${page.slug}" already exists. Change the slug and try again.`);
        return;
      }
    } else {
      updatePage(page.slug, page);
    }
    refresh();
    setEditing(null);
    setIsNew(false);
    flash(isNew ? 'Page created.' : 'Page saved.');
  };

  const handleSaveAndView = (page: Page) => {
    if (isNew) {
      if (!createPage(page)) {
        alert(`A page with slug "${page.slug}" already exists. Change the slug and try again.`);
        return;
      }
    } else {
      updatePage(page.slug, page);
    }
    refresh();
    setEditing(null);
    setIsNew(false);
    window.open(`/page/${page.slug}`, '_blank', 'noopener');
  };

  const handleDelete = (slug: string) => {
    if (confirm('Delete this page? This cannot be undone.')) {
      deletePage(slug);
      refresh();
    }
  };

  if (editing) {
    return (
      <PageEditor
        page={editing}
        isNew={isNew}
        onSave={handleSave}
        onSaveAndView={handleSaveAndView}
        onCancel={() => { setEditing(null); setIsNew(false); }}
      />
    );
  }

  return (
    <div>
      {message && (
        <div className="border p-3 mb-5 text-sm" style={{ borderColor: '#5a9e5a', background: '#eef5ee' }}>
          {message}
        </div>
      )}

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={handleNew} className="btn btn-primary flex items-center gap-1.5">
          <FilePlus size={14} />
          New Page
        </button>
      </div>

      {pages.length === 0 ? (
        <p className="text-sm text-muted">No pages yet. Create one to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 480 }}>
            <thead>
              <tr className="border-b rule">
                <th className="text-left py-2 px-2 font-semibold">Title</th>
                <th className="text-left py-2 px-2 font-semibold hidden sm:table-cell">URL</th>
                <th className="text-left py-2 px-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.slug} className="border-b rule">
                  <td className="py-2.5 px-2">{page.title}</td>
                  <td className="py-2.5 px-2 text-muted hidden sm:table-cell">
                    <code className="text-xs">/page/{page.slug}</code>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex gap-1 flex-wrap items-center">
                      <button
                        onClick={() => setEditing({ ...page })}
                        className="btn"
                        style={{ padding: '3px 9px', fontSize: 12 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => window.open(`/page/${page.slug}`, '_blank', 'noopener')}
                        className="btn"
                        style={{ padding: '3px 9px', fontSize: 12 }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(page.slug)}
                        className="btn"
                        style={{ padding: '3px 9px', fontSize: 12 }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page Editor ──────────────────────────────────────────────────────────────

function PageEditor({
  page,
  isNew,
  onSave,
  onSaveAndView,
  onCancel,
}: {
  page: Page;
  isNew: boolean;
  onSave: (p: Page) => void;
  onSaveAndView: (p: Page) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Page>({ ...page });
  const [tab, setTab] = useState<'content' | 'social'>('content');

  const update = (field: keyof Page, value: unknown) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-page mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20">
      <header className="border-b rule pb-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold">{isNew ? 'New Page' : `Edit: ${page.title}`}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onCancel} className="btn">Cancel</button>
          <button onClick={() => onSave(draft)} className="btn btn-primary">
            {isNew ? 'Create' : 'Save'}
          </button>
          <button onClick={() => onSaveAndView(draft)} className="btn btn-primary">
            {isNew ? 'Create & View' : 'Save & View'}
          </button>
        </div>
      </header>

      <div className="flex border-b rule mb-6">
        {(['content', 'social'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm capitalize select-none ${tab === t ? 'font-semibold' : 'text-muted'}`}
            style={{
              borderBottom: tab === t ? '2px solid #1a1a1a' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm block mb-1">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              className="field"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm block mb-1">Slug</label>
              <input
                type="text"
                value={draft.slug}
                onChange={(e) => update('slug', e.target.value)}
                className="field"
                disabled={!isNew}
              />
              {!isNew && (
                <p className="text-xs text-muted mt-1">Slug cannot be changed after creation.</p>
              )}
            </div>
            <div>
              <label className="text-sm block mb-1">Featured image URL</label>
              <input
                type="url"
                value={draft.featuredImage ?? ''}
                onChange={(e) => update('featuredImage', e.target.value)}
                className="field"
                placeholder="https://…"
              />
            </div>
          </div>
          <div>
            <label className="text-sm block mb-1">Excerpt (used for SEO description)</label>
            <textarea
              value={draft.excerpt ?? ''}
              onChange={(e) => update('excerpt', e.target.value)}
              className="field"
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!draft.showInHeader}
                onChange={(e) => update('showInHeader', e.target.checked)}
              />
              Show link in site header
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!draft.showInFooter}
                onChange={(e) => update('showInFooter', e.target.checked)}
              />
              Show link in site footer
            </label>
          </div>
          <div>
            <label className="text-sm block mb-1">Content (Markdown)</label>
            <MarkdownEditor value={draft.content} onChange={(v) => update('content', v)} rows={20} />
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div className="flex flex-col gap-4 max-w-prose">
          <p className="text-sm text-muted">
            Controls how the page appears when shared on social media. Defaults to title and excerpt if left blank.
          </p>
          <div>
            <label className="text-sm block mb-1">Social title</label>
            <input
              type="text"
              value={draft.socialTitle ?? ''}
              onChange={(e) => update('socialTitle', e.target.value)}
              className="field"
              placeholder={draft.title}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Social description</label>
            <textarea
              value={draft.socialDescription ?? ''}
              onChange={(e) => update('socialDescription', e.target.value)}
              className="field"
              rows={3}
              placeholder={draft.excerpt ?? ''}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Social image URL</label>
            <input
              type="url"
              value={draft.socialImage ?? ''}
              onChange={(e) => update('socialImage', e.target.value)}
              className="field"
              placeholder={draft.featuredImage ?? 'https://…'}
            />
            <p className="text-xs text-muted mt-1">Recommended: 1200×630px for Open Graph / Twitter Card.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Post Editor ──────────────────────────────────────────────────────────────

function PostEditor({
  post,
  isNew,
  onSave,
  onSaveAndView,
  onCancel,
}: {
  post: Post;
  isNew: boolean;
  onSave: (p: Post) => void;
  onSaveAndView: (p: Post) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Post>({ ...post });
  const [tab, setTab] = useState<'content' | 'social' | 'media'>('content');

  const update = (field: keyof Post, value: unknown) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-page mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20">
      <header className="border-b rule pb-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold">{isNew ? 'New Post' : `Edit: ${post.title}`}</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onCancel} className="btn">Cancel</button>
          <button onClick={() => onSave(draft)} className="btn btn-primary">
            {isNew ? 'Create' : 'Save'}
          </button>
          <button onClick={() => onSaveAndView(draft)} className="btn btn-primary">
            {isNew ? 'Create & View' : 'Save & View'}
          </button>
        </div>
      </header>

      {/* Editor tabs */}
      <div className="flex border-b rule mb-6">
        {(['content', 'social', 'media'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm capitalize select-none ${tab === t ? 'font-semibold' : 'text-muted'}`}
            style={{
              borderBottom: tab === t ? '2px solid #1a1a1a' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm block mb-1">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              className="field"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm block mb-1">Slug</label>
              <input
                type="text"
                value={draft.slug}
                onChange={(e) => update('slug', e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Date</label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => update('date', e.target.value)}
                className="field"
              />
            </div>
          </div>
          <div>
            <label className="text-sm block mb-1">Excerpt</label>
            <textarea
              value={draft.excerpt}
              onChange={(e) => update('excerpt', e.target.value)}
              className="field"
              rows={2}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={(draft.tags ?? []).join(', ')}
              onChange={(e) =>
                update('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))
              }
              className="field"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Content (Markdown)</label>
            <MarkdownEditor value={draft.content} onChange={(v) => update('content', v)} rows={20} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!draft.pinned}
              onChange={(e) => update('pinned', e.target.checked)}
            />
            Pinned — appears at the top of the feed
          </label>
        </div>
      )}

      {tab === 'social' && (
        <div className="flex flex-col gap-4 max-w-prose">
          <p className="text-sm text-muted">
            Controls how the post appears when shared on social media. Defaults to title and excerpt if left blank.
          </p>
          <div>
            <label className="text-sm block mb-1">Social title</label>
            <input
              type="text"
              value={draft.socialTitle ?? ''}
              onChange={(e) => update('socialTitle', e.target.value)}
              className="field"
              placeholder={draft.title}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Social description</label>
            <textarea
              value={draft.socialDescription ?? ''}
              onChange={(e) => update('socialDescription', e.target.value)}
              className="field"
              rows={3}
              placeholder={draft.excerpt}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Social image URL</label>
            <input
              type="url"
              value={draft.socialImage ?? ''}
              onChange={(e) => update('socialImage', e.target.value)}
              className="field"
              placeholder={draft.featuredImage ?? 'https://…'}
            />
            <p className="text-xs text-muted mt-1">Recommended: 1200×630px for Open Graph / Twitter Card.</p>
          </div>
        </div>
      )}

      {tab === 'media' && (
        <div className="flex flex-col gap-6 max-w-prose">

          {/* Cover image */}
          <div>
            <label className="text-sm block mb-1">Cover image URL</label>
            <input
              type="url"
              value={draft.featuredImage ?? ''}
              onChange={(e) => update('featuredImage', e.target.value)}
              className="field"
              placeholder="https://…"
            />
            <p className="text-xs text-muted mt-1">
              Upload an image first in the <strong>Media</strong> tab, then paste the CDN URL here.
              Ignored if a Bandcamp or Bunny video embed is set.
            </p>
          </div>

          {/* Bandcamp */}
          <div className="border rule p-4 flex flex-col gap-4">
            <h3 className="text-sm font-semibold">Bandcamp embed</h3>
            <p className="text-xs text-muted">
              Enter a Track ID or Album ID to embed the Bandcamp player as the post cover.
              You can also use <code>:::bandcamp-track ID</code> or <code>:::bandcamp-album ID</code> anywhere in the content.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm block mb-1">Track ID</label>
                <input
                  type="text"
                  value={draft.bandcampTrackId ?? ''}
                  onChange={(e) => update('bandcampTrackId', e.target.value || undefined)}
                  className="field"
                  placeholder="e.g. 1234567890"
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Album ID</label>
                <input
                  type="text"
                  value={draft.bandcampAlbumId ?? ''}
                  onChange={(e) => update('bandcampAlbumId', e.target.value || undefined)}
                  className="field"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>
            {(draft.bandcampTrackId || draft.bandcampAlbumId) && (
              <div>
                <p className="text-xs text-muted mb-2">Preview:</p>
                <div className="bandcamp-embed">
                  <iframe
                    key={`${draft.bandcampTrackId}|${draft.bandcampAlbumId}`}
                    src={
                      draft.bandcampTrackId
                        ? `https://bandcamp.com/EmbeddedPlayer/track=${draft.bandcampTrackId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/`
                        : `https://bandcamp.com/EmbeddedPlayer/album=${draft.bandcampAlbumId}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/`
                    }
                    title="Bandcamp preview"
                    seamless
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bunny Stream */}
          <div className="border rule p-4 flex flex-col gap-4">
            <h3 className="text-sm font-semibold">Bunny Stream</h3>
            <p className="text-xs text-muted">
              Upload video/audio on your Bunny dashboard, then enter the IDs here to embed them as the post cover.
              You can also use <code>:::bunny-video</code> / <code>:::bunny-audio</code> directly in the content.
            </p>
            <div>
              <label className="text-sm block mb-1">Library ID</label>
              <input
                type="text"
                value={draft.bunnyLibraryId ?? ''}
                onChange={(e) => update('bunnyLibraryId', e.target.value || undefined)}
                className="field"
                placeholder="e.g. 12345"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Video ID</label>
              <input
                type="text"
                value={draft.bunnyVideoId ?? ''}
                onChange={(e) => update('bunnyVideoId', e.target.value || undefined)}
                className="field"
                placeholder="e.g. abc-123"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Audio ID</label>
              <input
                type="text"
                value={draft.bunnyAudioId ?? ''}
                onChange={(e) => update('bunnyAudioId', e.target.value || undefined)}
                className="field"
                placeholder="e.g. abc-456"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

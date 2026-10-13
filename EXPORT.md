# Beta Black Lotus — Cloudflare Pages Deployment Guide

A lightweight, monospace-styled personal blog built with React + Vite. This guide covers deploying the site to Cloudflare Pages (free tier) with the domain `betablacklotus.com`.

---

## 1. Prerequisites

- A Cloudflare account (free) at [cloudflare.com](https://cloudflare.com)
- Node.js 18+ installed locally
- Your domain `betablacklotus.com` registered (any registrar)

---

## 2. Build the static site

```bash
npm install
npm run build
```

This produces a `dist/` directory containing the entire static site:

```
dist/
  index.html
  feed.xml
  favicon.svg
  _redirects          — SPA catch-all routing
  _headers            — security + caching headers
  assets/
    *.js
    *.css
  images/
```

---

## 3. Deploy to Cloudflare Pages

### Option A — Direct upload (simplest)

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Enter a project name (e.g. `beta-black-lotus`).
3. Drag the **contents** of the `dist/` folder into the upload zone (not the folder itself — the files inside it).
4. Click **Deploy site**.

### Option B — Wrangler CLI

```bash
npx wrangler pages deploy dist --project-name=beta-black-lotus
```

If you haven't used Wrangler before, you'll be prompted to log in to Cloudflare via browser. After the first deploy, subsequent runs reuse the same project.

### Option C — Git integration (automatic deploys)

1. Push your project to a GitHub or GitLab repository.
2. In the Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select your repository.
4. Set the build configuration:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**. Every future push to your main branch triggers an automatic rebuild and deploy.

---

## 4. Add your custom domain

1. In the Cloudflare Pages dashboard, select your project → **Custom domains** → **Set up a custom domain**.
2. Enter `betablacklotus.com`. Click **Continue**.
3. If your domain is already on Cloudflare DNS, the required CNAME record is added automatically.
4. If your domain is on a different registrar, Cloudflare will show you the CNAME record to add:
   - **Type:** CNAME
   - **Name:** `@` (or leave blank for apex)
   - **Target:** `beta-black-lotus.pages.dev` (or the target shown)
5. Repeat for `www.betablacklotus.com` if you want the www subdomain.
6. DNS propagation typically takes a few minutes to an hour.

### SSL/TLS

Cloudflare provides free SSL automatically. In the dashboard under **SSL/TLS**, set the mode to **Full** (or **Full (strict)** if your origin supports it). For a Pages-only setup, this is handled for you.

---

## 5. URL routing

This site uses the **History API** for clean URLs (`/post/slug`, `/music`, `/archive`, etc.). The `public/_redirects` file contains:

```
/* /index.html 200
```

Cloudflare Pages reads this file automatically and serves `index.html` for all paths, so client-side routing works without any server configuration.

---

## 6. Security & caching headers

The `public/_headers` file is included in the build and Cloudflare Pages applies it automatically. It sets:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Plus long-lived caching for hashed Vite assets (1 year, immutable), and shorter caches for the RSS feed (1 hour), images (30 days), favicon (1 day), and service worker (always revalidate).

---

## 7. Secure the admin panel

The admin panel lives at the obscured path `/backstage-3k9mxf2p7qw4`. Client-side security (password hashing, rate limiting, IP blocking) is implemented, but **for true security**:

1. **Change the default password** — Log in at `https://betablacklotus.com/backstage-3k9mxf2p7qw4` and change it immediately through Security settings.
2. **Consider Cloudflare Access** — For an additional server-side layer, set up Cloudflare Zero Trust (free tier) with an Access policy that requires email authentication before reaching the admin path. This is the strongest option and costs nothing.

---

## 8. Domain configuration checklist

The following files contain the site URL. They are already set to `https://www.betablacklotus.com` — verify before deploying:

| File | Setting |
|------|---------|
| `src/seo.ts` | `SITE_URL` |
| `src/rss.ts` | `SITE_URL` |
| `public/feed.xml` | All `<link>` and `<atom:link>` URLs |

---

## 9. RSS feed

A pre-built `feed.xml` is included in `public/` and copied to `dist/` on build. After editing posts in the admin panel, use the **Download RSS** button to generate an updated `feed.xml` and upload it to your server (or rebuild and redeploy).

The feed is served at `https://www.betablacklotus.com/feed.xml` with a 1-hour cache.

---

## 10. Bunny Stream media configuration

Posts support Bunny Stream video and audio embeds via custom markdown syntax:

```
:::bunny-video LIBRARY_ID VIDEO_ID
:::bunny-audio LIBRARY_ID AUDIO_ID
```

### Token authentication (recommended)

1. In your **Bunny Stream** dashboard, open your library.
2. Enable **Token Authentication**.
3. Set **Allowed Referrers / Domain Restrictions** to `betablacklotus.com`.
4. The iframe embeds use Bunny's player, which handles token auth server-side.

---

## 11. Media protection notes

Client-side protections implemented:
- Right-click (context menu) disabled on images, video, and audio
- Image drag-to-save disabled
- `user-select: none` on media containers
- Keyboard shortcuts (Ctrl+S, Ctrl+U) blocked while media is focused

Client-side protection is a deterrent only. For real protection:
- Use **Bunny Stream token authentication** for audio/video
- Enable **hotlink protection** via Cloudflare's Scrape Shield settings
- Consider watermarking sensitive images

---

## 12. After-deploy checklist

- [ ] Visit `https://www.betablacklotus.com` — site loads
- [ ] Navigate to a post (e.g. `/welcome-to-the-terminal`) — page loads (not 404)
- [ ] Check `https://www.betablacklotus.com/feed.xml` — RSS feed is valid
- [ ] Test on mobile — hamburger menu and responsive layout work
- [ ] Visit `/backstage-3k9mxf2p7qw4` — admin login appears
- [ ] Change the default admin password
- [ ] Verify security headers at [securityheaders.com](https://securityheaders.com/?q=betablacklotus.com)
- [ ] Test social sharing — OG meta tags resolve to correct title/description/image

---

## 13. Project structure

```
src/
  App.tsx              — main app + router switch
  router.ts            — History API router
  types.ts             — TypeScript types
  markdown.ts          — lightweight markdown parser
  postStore.ts         — post storage (localStorage)
  pageStore.ts         — standalone page storage
  samplePosts.ts       — sample post content
  security.ts          — auth, rate limiting, IP blocking
  adminAuth.ts         — admin login/session
  seo.ts               — Open Graph + Twitter meta tags
  rss.ts               — RSS feed generator
  index.css            — global styles (IBM Plex Mono theme)
  components/
    Header.tsx         — fixed header with nav + search
    PostCard.tsx       — post preview card
    MediaProtect.tsx   — media protection wrapper
    MarkdownEditor.tsx — admin markdown editor
    GalleryBuilder.tsx — gallery layout tool
    Lightbox.tsx       — image lightbox
    EditFab.tsx        — floating edit button (admin)
  pages/
    HomePage.tsx       — infinite scroll feed
    PostPage.tsx       — individual post
    VideosPage.tsx     — video posts
    MusicPage.tsx      — music posts
    ArchivePage.tsx    — archive by year
    TagPage.tsx        — posts by tag
    StandalonePage.tsx — standalone pages (EPK, Contact, etc.)
    GalleryPreviewPage.tsx — gallery preview
    AdminLoginPage.tsx — admin login (rate-limited)
    AdminPanel.tsx     — post management + security
public/
  _redirects           — SPA catch-all for Cloudflare Pages
  _headers             — security + caching headers
  feed.xml             — RSS feed
  favicon.svg          — site icon
  sw.js                — service worker
```

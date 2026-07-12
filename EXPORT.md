# The Terminal — Export & Deployment Guide

A lightweight, retro-styled personal blog built with React + Vite. This guide covers exporting the site for static hosting (e.g. GoDaddy Deluxe shared hosting), adding Disqus comments, and configuring Bunny Stream media.

---

## 1. Build the static site

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
  assets/
    *.js
    *.css
```

Upload everything inside `dist/` to your hosting provider's `public_html/` (or equivalent) directory.

---

## 2. Deploy to GoDaddy Deluxe shared hosting

1. Log in to your GoDaddy hosting control panel (cPanel).
2. Open **File Manager** → `public_html`.
3. Upload all files from the `dist/` directory into `public_html/`.
   - You can zip `dist/`, upload the zip, and use cPanel's "Extract" feature.
4. The site should be live at your domain immediately.

### URL routing note

This site uses **hash-based routing** (`#/post/slug`, `#/about`, etc.) so it works on any static host without server-side configuration. No `.htaccess` rewrite rules are needed for routing.

---

## 3. Secure the admin panel

The admin panel lives at the obscured path `#/backstage-3k9mxf2p7qw4`. Client-side security (password hashing, rate limiting, IP blocking) is implemented, but for **true security on shared hosting**, add HTTP Basic Auth via `.htaccess`:

### Step A: Create a password file

In cPanel, go to **Directory Privacy** or use the **htpasswd** tool. Alternatively, create a `.htpasswd` file manually:

```bash
htpasswd -c .htpasswd adminuser
```

Upload `.htpasswd` to a directory **above** `public_html` if possible (e.g. your home directory), so it is not web-accessible.

### Step B: Protect the admin route

Because this site uses hash routing, the admin panel is served from `index.html` like every other route. To add an extra server-side layer, you can:

- **Option 1 (recommended):** Move the admin to a separate subdomain (e.g. `admin.yourdomain.com`) protected by cPanel's Directory Privacy.
- **Option 2:** Add a JavaScript-based gate before the admin route (already implemented — the login screen).

### Step C: Change the default password

The default admin password is `ChangeMe!Str0ngP@ss`. **Change it immediately** after first login:

1. Go to `https://yourdomain.com/#/backstage-3k9mxf2p7qw4`
2. Log in with the default password.
3. Click **Security** → **Change password**.
4. Choose a strong password (12+ characters, upper/lower/number/symbol).

---

## 4. Configure your domain

Update the site URL in these files before building:

- `src/seo.ts` — change `SITE_URL` to your domain
- `src/rss.ts` — change `SITE_URL` to your domain
- `public/feed.xml` — change all `https://example.com` references to your domain
- `src/pages/ContactPage.tsx` — change the email address

---

## 5. Adding Disqus comments (future)

The post template already includes a clearly marked placeholder. To activate Disqus:

1. Create an account at [disqus.com](https://disqus.com) and register your site.
2. Copy your **Disqus shortname** from the admin dashboard.
3. Open `src/pages/PostPage.tsx` and find the section marked `DISQUS_PLACEHOLDER`.
4. Replace the placeholder `<div id="disqus_thread">…</div>` with:

```html
<div id="disqus_thread"></div>
<script>
  var disqus_config = function () {
    this.page.url = window.location.href;
    this.page.identifier = "{post.slug}";
  };
  (function() {
    var d = document, s = d.createElement('script');
    s.src = 'https://YOUR-SHORTNAME.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  })();
</script>
```

5. Replace `YOUR-SHORTNAME` with your actual Disqus shortname.
6. Rebuild and redeploy: `npm run build`.

---

## 6. Bunny Stream media configuration

### Video and audio embeds

Posts support Bunny Stream video and audio embeds via custom markdown syntax:

```
:::bunny-video LIBRARY_ID VIDEO_ID
:::bunny-audio LIBRARY_ID AUDIO_ID
```

The markdown parser converts these into clean iframe embeds using Bunny's player.

### Token authentication (recommended for protection)

1. In your **Bunny Stream** dashboard, open your library.
2. Enable **Token Authentication**.
3. Set **Allowed Referrers / Domain Restrictions** to your site's domain (e.g. `yourdomain.com`).
4. Generate signed URLs with expiration for any direct media links.
5. The iframe embeds use Bunny's player, which handles token auth server-side — no extra configuration needed in the embed code.

### Admin panel fields

In the admin panel's **Media** tab for each post, you can set:
- Bunny Stream Library ID
- Bunny Stream Video ID
- Bunny Stream Audio ID

These are for reference. The actual embeds are placed in the markdown content using the `:::bunny-video` and `:::bunny-audio` syntax above.

---

## 7. Media protection notes

Client-side protections implemented:
- Right-click (context menu) disabled on images, video, and audio
- Image drag-to-save disabled
- `user-select: none` on media containers
- Keyboard shortcuts (Ctrl+S, Ctrl+U) blocked while media is focused

**Important:** Client-side protection is a deterrent only and can be bypassed. For real protection:
- Use **Bunny Stream token authentication** for audio/video (server-side protection)
- Enable **hotlink protection** in your hosting control panel for images
- Consider watermarking sensitive images

---

## 8. RSS feed

A pre-built `feed.xml` is included in `public/` and copied to `dist/` on build. After editing posts in the admin panel, use the **Download RSS** button to generate an updated `feed.xml` and upload it to your server.

The feed includes:
- Post title
- Description/excerpt
- Publish date
- Full link
- Featured image (via `<media:content>`)

---

## 9. Editing content

### Edit existing pages

| Page | File |
|------|------|
| Home | `src/pages/HomePage.tsx` |
| About | `src/pages/AboutPage.tsx` |
| Archive | `src/pages/ArchivePage.tsx` |
| Contact | `src/pages/ContactPage.tsx` |
| All Posts | `src/pages/AllPostsPage.tsx` |

### Add a new post

Posts are defined in `src/samplePosts.ts`. Copy an existing post object and change:
- `slug` — unique URL identifier
- `title` — post title
- `date` — ISO date string (YYYY-MM-DD)
- `content` — markdown body
- `excerpt` — short description
- `tags` — array of tag strings
- `featuredImage` — image URL
- `pinned` — set to `true` to pin to top

### Markdown support

The built-in parser supports:
- Headings (`#`, `##`, etc.)
- Bold (`**text**`), italic (`*text*`), inline code (`` `code` ``)
- Links (`[text](url)`) and images (`![alt](url)`)
- Code blocks (triple backticks)
- Ordered and unordered lists
- Blockquotes (`>`)
- Horizontal rules (`---`)
- Galleries (consecutive image lines)
- Bunny Stream embeds (`:::bunny-video`, `:::bunny-audio`)

---

## 10. Project structure

```
src/
  App.tsx              — main app + router
  router.ts            — hash-based router
  types.ts             — TypeScript types
  markdown.ts          — lightweight markdown parser
  postStore.ts         — post storage (localStorage)
  samplePosts.ts       — sample post content
  security.ts          — auth, rate limiting, IP blocking
  adminAuth.ts         — admin login/session
  seo.ts               — Open Graph + Twitter meta tags
  rss.ts               — RSS feed generator
  index.css            — global styles (IBM Plex Mono, retro theme)
  components/
    Header.tsx         — fixed header with nav + search
    PostCard.tsx       — post preview card
    MediaProtect.tsx   — media protection wrapper
  pages/
    HomePage.tsx       — infinite scroll feed
    PostPage.tsx       — individual post + Disqus placeholder
    AllPostsPage.tsx   — all posts list
    AboutPage.tsx      — about page
    ArchivePage.tsx    — archive by year
    ContactPage.tsx    — contact form
    TagPage.tsx        — posts by tag
    AdminLoginPage.tsx — admin login (rate-limited)
    AdminPanel.tsx     — post management + security
public/
  feed.xml             — RSS feed
  favicon.svg          — site icon
```

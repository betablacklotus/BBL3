<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title><xsl:value-of select="/rss/channel/title" /> — RSS Feed</title>
        <style>
          :root {
            --bg: #f5f5f0;
            --paper: #ffffff;
            --ink: #1a1a1a;
            --muted: #6b6657;
            --border: #d9d6ce;
            --accent: #1a4e8a;
            --mono: 'IBM Plex Mono', 'Courier New', monospace;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: var(--mono);
            background: var(--bg);
            color: var(--ink);
            line-height: 1.6;
            padding: 0 16px 48px;
          }
          .header {
            max-width: 640px;
            margin: 0 auto;
            padding: 48px 0 32px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 32px;
          }
          .badge {
            display: inline-block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--muted);
            border: 1px solid var(--border);
            padding: 3px 10px;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 1.6rem;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .header p {
            color: var(--muted);
            font-size: 14px;
          }
          .info {
            background: var(--paper);
            border: 1px solid var(--border);
            padding: 16px 20px;
            margin-bottom: 32px;
            font-size: 13px;
            color: var(--muted);
            line-height: 1.7;
          }
          .info strong { color: var(--ink); }
          .info code {
            background: var(--bg);
            padding: 1px 6px;
            font-size: 12px;
            border: 1px solid var(--border);
          }
          .feed-url {
            word-break: break-all;
          }
          .items {
            max-width: 640px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 0;
          }
          .item {
            border-bottom: 1px solid var(--border);
            padding: 20px 0;
          }
          .item:first-child { padding-top: 0; }
          .item:last-child { border-bottom: none; }
          .item-title {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .item-title a {
            color: var(--ink);
            text-decoration: none;
          }
          .item-title a:hover {
            color: var(--accent);
            text-decoration: underline;
          }
          .item-date {
            font-size: 12px;
            color: var(--muted);
            margin-bottom: 8px;
          }
          .item-desc {
            font-size: 13px;
            color: var(--muted);
            line-height: 1.6;
          }
          .item-thumb {
            width: 100%;
            max-height: 180px;
            object-fit: cover;
            margin-top: 12px;
            border: 1px solid var(--border);
            display: block;
          }
          @media (max-width: 480px) {
            h1 { font-size: 1.3rem; }
            .header { padding-top: 32px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="badge">RSS Feed</span>
          <h1><xsl:value-of select="/rss/channel/title" /></h1>
          <p><xsl:value-of select="/rss/channel/description" /></p>
        </div>

        <div class="info">
          <strong>This is an RSS feed.</strong>
          Copy the URL below and paste it into your favorite feed reader (NetNewsWire, Feedly, Inoreader, etc.) to subscribe and get new posts delivered automatically.
          <br /><br />
          <code class="feed-url"><xsl:value-of select="/rss/channel/atom:link/@href" /></code>
        </div>

        <div class="items">
          <xsl:for-each select="/rss/channel/item">
            <div class="item">
              <div class="item-title">
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="link" /></xsl:attribute>
                  <xsl:value-of select="title" />
                </a>
              </div>
              <div class="item-date"><xsl:value-of select="pubDate" /></div>
              <div class="item-desc"><xsl:value-of select="description" /></div>
              <xsl:if test="media:content">
                <img class="item-thumb">
                  <xsl:attribute name="src"><xsl:value-of select="media:content/@url" /></xsl:attribute>
                  <xsl:attribute name="alt"><xsl:value-of select="title" /></xsl:attribute>
                </img>
              </xsl:if>
            </div>
          </xsl:for-each>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

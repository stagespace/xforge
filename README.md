# XForge

**X articles, marked down.**

XForge is a self-hosted workspace for the **X Articles → Markdown** workflow: paste an X Article URL, strip logged-out chrome, add YAML frontmatter, summarize, chat with the content, and download a note-ready `.md`.

## Open Source

This project is MIT licensed and intended for public use. Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

Report security issues privately via [SECURITY.md](SECURITY.md).

**Live demo:** https://forge.stagespace.ai

## What It Does

- Accepts a public **X Article URL** (`x.com` or `twitter.com` only).
- Calls Firecrawl server-side to extract Markdown.
- Cleans common logged-out X/Twitter chrome (cookie banners, signup blocks, metric rows, footers).
- Extracts author and publish date when present in the scrape.
- Builds note-ready Markdown with YAML frontmatter (`title`, `author`, `source`, `date`, `tags: [x-article]`).
- **Public tier:** summarize and chat with daily rate limits (optional in production).
- **Signed-in tier:** same features with a token for higher daily limits.

API keys never go to the browser.

## Quick Start (local)

```bash
git clone https://github.com/stagespace/xforge.git
cd xforge
npm install
cd client/xforge && npm install && cd ../..
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

Open `http://localhost:3107`.

## UI (shadcn + React)

The browser UI lives in `client/xforge/` — a Vite + React SPA using **shadcn/ui** with the **Lyra** preset on **Base UI** (compact, editorial typography suited to a dark reading tool). Warm neutral tokens and IBM Plex fonts carry over the prior XForge look; gold `--primary` replaces the old accent.

- **Build:** `npm run build` (or `npm run build:client`)
- **API server:** `npm run dev` — serves `client/xforge/dist` (built by `predev`)
- **UI dev (HMR):** run the API on `:3107`, then `npm run dev:ui` — Vite proxies `/api/*` to the backend

The Express server serves the built client from `client/xforge/dist`. If no build is present it runs API-only and logs a hint to run `npm run build`.

## Configuration

Copy `.env.example` to `.env`. Required keys depend on which features you enable:

| Variable | Purpose |
| --- | --- |
| `FIRECRAWL_API_URL` | Firecrawl base URL (`https://api.firecrawl.dev` or self-hosted) |
| `FIRECRAWL_API_KEY` | Firecrawl API key |
| `FIREWORKS_API` | Server-side AI for summarize + chat |
| `FIREWORKS_MODEL_FLASH` | Model ID for summarize + chat |
| `GEMINI_API_KEY` | Reserved — not used by default |
| `APP_AUTH_TOKEN` | Gate signed-in tier; required in production unless public tier enabled |
| `ALLOW_DEMO_MODE` | Set `true` to allow unauthenticated access in production |

### Production deployment

Set `NODE_ENV=production`. The server **refuses to start** unless you configure one of:

| Mode | Env vars | Behavior |
| --- | --- | --- |
| Auth-only | `APP_AUTH_TOKEN` | All API routes require a valid token |
| Public-only | `ALLOW_DEMO_MODE=true` | Unauthenticated access, rate-limited by IP |
| Hybrid | Both above | Public without token; signed-in with valid token; invalid token → 401 |

Invalid tokens are always rejected. URL scraping blocks localhost, private IPs, and cloud metadata addresses (SSRF guard).

## Deploy with Docker

```bash
cp .env.example .env
# Fill in secrets
docker compose up -d --build
curl -fsS http://127.0.0.1:3107/healthz
```

Bind to localhost in `docker-compose.yml` and reverse-proxy HTTPS from nginx, Caddy, or **Cloudflare Tunnel**.

**Production guide:** [docs/DEPLOY.md](docs/DEPLOY.md) — live demo at **https://forge.stagespace.ai**.

## Rate limits

Defaults (override in `.env`):

| Action | Public (per IP / day) | Signed-in (per token / day) |
| --- | ---: | ---: |
| Scrape | 10 | 200 |
| Summarize | 10 | 100 |
| Chat | 20 | 300 |

## Validation

```bash
npm test
npm run build
```

Live Firecrawl and AI calls require valid keys in `.env`.

## Works with

Obsidian, Logseq, Notion, Bear, and any app that accepts Markdown.

## License

MIT — see [LICENSE](LICENSE).

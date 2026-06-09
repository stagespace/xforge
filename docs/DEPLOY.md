# Production deployment

XForge runs as a single Node process (Express + built React UI). Typical setup: Docker on a VPS, HTTPS via a reverse proxy or Cloudflare Tunnel.

Public demo: https://forge.stagespace.ai

## 1. Configure environment

Copy `.env.example` to `.env` and set:

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `PUBLIC_BASE_URL` | yes | Public URL, e.g. `https://forge.example.com` |
| `FIRECRAWL_API_URL` | yes | Firecrawl base URL |
| `FIRECRAWL_API_KEY` | yes | Firecrawl API key |
| `FIREWORKS_API` | for AI | Summarize + chat |
| `APP_AUTH_TOKEN` | prod | Long random secret for private tier |
| `ALLOW_DEMO_MODE` | optional | `true` for rate-limited public access |

The server **refuses to start** in production unless `APP_AUTH_TOKEN` and/or `ALLOW_DEMO_MODE=true` is set.

## 2. Docker

```bash
docker compose up -d --build
curl -fsS http://127.0.0.1:3107/healthz
```

Bind to `127.0.0.1` in `docker-compose.yml` and terminate TLS in front (nginx, Caddy, or Cloudflare Tunnel).

## 3. Reverse proxy (nginx example)

```nginx
server {
    listen 443 ssl http2;
    server_name forge.example.com;

    location / {
        proxy_pass http://127.0.0.1:3107;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

If you use `ALLOW_DEMO_MODE`, ensure the proxy **overwrites** `X-Forwarded-For` so clients cannot spoof IP-based rate limits.

## 4. Cloudflare Tunnel (optional)

Point a hostname (e.g. `forge.example.com`) at `http://127.0.0.1:3107` in tunnel ingress. Add edge rate limits on `/api/*` if the instance is public.

## 5. Verify

```bash
curl -fsS https://forge.example.com/healthz
# {"ok":true,"service":"xforge"}
```

Smoke test: paste a public X Article URL in the UI, extract, download Markdown.

## Rate limits

Defaults are per-IP (demo) or per-token (private), in-memory per process. Restart clears counters. For multi-instance deploys, limits apply per container unless you add shared storage later.

See [SECURITY.md](../SECURITY.md) for hardening notes.

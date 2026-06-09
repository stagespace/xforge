# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting a Vulnerability

If you discover a security issue in XForge (`article-md-tool`), please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Email **rajko@stagespace.ai** with:

- A description of the issue and potential impact
- Steps to reproduce
- Any proof-of-concept or suggested fix (optional)

We aim to acknowledge reports within **72 hours** and will work with you on a fix and coordinated disclosure timeline.

## Deployment Hardening

When exposing this app on a public VPS:

1. Set `NODE_ENV=production`.
2. Choose one of:
   - **Auth-only:** set `APP_AUTH_TOKEN` to a long random secret (no `ALLOW_DEMO_MODE`).
   - **Public demo:** set `ALLOW_DEMO_MODE=true` and keep strict daily rate limits.
   - **Hybrid:** set both `APP_AUTH_TOKEN` and `ALLOW_DEMO_MODE=true` for demo + private tiers.
3. Terminate TLS at a reverse proxy (nginx, Caddy, etc.) and bind the container to localhost.
4. Configure your proxy to set or sanitize `X-Forwarded-For`; clients can spoof this header if the proxy does not overwrite it.
5. Keep Firecrawl, Fireworks, and Gemini API keys in server-side `.env` only — never in the browser.

## Known Threat Model Notes

- **SSRF:** `/api/scrape` validates URLs and blocks localhost, private, link-local, and common metadata addresses before calling Firecrawl.
- **Auth:** Invalid tokens are always rejected. In production without `ALLOW_DEMO_MODE`, unauthenticated API access is denied.
- **Rate limits:** Enforced in-memory per process; restart clears counters. Use a single instance or accept per-instance limits.

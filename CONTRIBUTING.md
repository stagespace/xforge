# Contributing

Thanks for your interest in XForge!

## Getting Started

```bash
git clone https://github.com/stagespace/xforge.git
cd xforge
npm install
cd client/xforge && npm install && cd ../..
cp .env.example .env
# Fill in API keys, then:
npm run dev
```

Open `http://localhost:3107`.

For UI hot reload: run `npm run dev` in one terminal and `npm run dev:ui` in `client/xforge/`.

## Development

- **Stack:** Node.js 20+, Express 5, React + Vite + shadcn in `client/xforge/`.
- **Tests:** `npm test` (Node built-in test runner).
- **Build:** `npm run build` (client + server serves `client/xforge/dist`).
- **Style:** Match existing code — minimal dependencies, clear errors, no secrets in client code.

## Pull Requests

1. Fork the repo and create a feature branch.
2. Keep changes focused; avoid unrelated refactors.
3. Run `npm test` and `npm run build` before opening a PR.
4. Describe what changed and how you tested it.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting. Do not commit `.env` files or API keys.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

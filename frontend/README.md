# TrustShield 254 web app (React + Vite + Tailwind CSS)

```bash
nvm use            # Node 22 (see .nvmrc)
npm install
npm run dev        # http://127.0.0.1:5173, forwards /api to Django on 127.0.0.1:8254
npm run build
```

Start the Django API first (see `../backend/README.md`). To work on the UI
without the backend, run with `VITE_USE_MOCK=true npm run dev`; an in-browser
mock implementing the same API contract is used instead.

- `src/lib/api.js` is the only place that talks to the backend.
- `src/components/scan/` renders checks and results; `src/pages/app/` holds the dashboard screens.
- Design tokens (colors, shadows, animations) live in `src/index.css`. No gradients or emojis.

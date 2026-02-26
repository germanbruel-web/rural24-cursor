# Rural24 Localhost Runbook

## Prerequisites
- Node.js `20.x`
- npm `10.x`

## Environment files
- `frontend/.env.local`
  - `VITE_API_URL=http://localhost:3001`
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_KEY=...` (preferred)
  - `VITE_CLOUDINARY_CLOUD_NAME=...` (optional)
- `backend/.env.local`
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
  - `FRONTEND_URL=http://localhost:5173`
  - `NODE_ENV=development`
  - `CRON_SECRET=dev-local-cron-secret`

## Start services
- `.\dev.ps1`
- Smoke test completo: `npm run smoke:localhost`

## Switch env profile
- Local profile: `npm run env:local`
- Staging profile: `npm run env:staging`

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Health: `http://localhost:3001/api/health`

## Stop / Status
- Stop all: `.\dev.ps1 -Stop`
- Check status: `.\dev.ps1 -Status`

## Quick diagnostics
- Port in use: run `.\dev.ps1 -Stop` and start again.
- Missing env files: confirm both `.env.local` files exist.
- Health returns `503`: verify backend Supabase credentials.
- Frontend crashes on boot: verify `VITE_SUPABASE_URL` + `VITE_SUPABASE_KEY`.
- Upload errors: complete Cloudinary values in `backend/.env.local`.

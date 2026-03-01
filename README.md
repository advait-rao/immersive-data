# StatStage MVP (Next.js + Convex-Ready)

StatStage is a sports-data storytelling web app. This MVP includes:
- Landing page with two choices:
  - Upload your own CSV
  - Explore sample `6000 Run Club` data
- Exact legacy immersive page for the 6000 Run Club sample
- Upload-to-immersive flow that maps arbitrary CSVs into a new immersive 3D scene
- CSV parsing and automatic axis inference/projection
- Convex-ready schema and frontend provider wiring

## Tech stack
- Next.js (App Router) + TypeScript
- React
- Convex (schema scaffold + client provider)

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## Convex notes
- Add `NEXT_PUBLIC_CONVEX_URL` to `.env.local` when backend is ready.
- See `convex/README.md` for setup notes.

## Current behavior
- Sample button opens `/immersive-6000-run-club/index.html` (exact main-branch immersive experience).
- Upload button stores parsed CSV + inferred projection in session storage and opens `/immersive-upload/index.html?session=...`.
- Upload immersive scene reuses the same immersive interaction model (tour, search, isolate, focus, volume toggles).

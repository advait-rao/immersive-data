# Convex Setup (Backend-Ready)

This project is scaffolded for a Convex backend.

## What is included
- `schema.ts` with tables for `datasets` and `chartConfigs`.
- Frontend provider wiring in `components/ConvexProvider.tsx`.

## Next steps when you are ready to connect backend
1. Install dependencies: `npm install`
2. Start Convex dev environment: `npx convex dev`
3. Add your Convex deployment URL to `.env.local` as `NEXT_PUBLIC_CONVEX_URL`
4. Add Convex functions for dataset upload persistence and chart configuration management.

The current MVP keeps uploaded datasets in session storage so the studio flow works before backend setup.

# mineking

A custom Minesweeper web game with RPG-style meta progression.

**▶ Play: https://mineking.netlify.app/**

## Features

- Classic Minesweeper with chording and first-click safety
- Two input modes (open / flag) with a magnifier loupe for precise tapping
- Pinch-friendly zoom, installable PWA (offline ready)
- 9 preset themes plus a custom theme editor (colors, flag shape, image upload, on-device drawing)
- Whole-app UI reskins with the active theme
- RPG meta: coins, XP and leveling, tiered achievements, equippable cards, daily quests, profile page
- Coin sink: unlock themes with coins in the shop
- Cloud login (username + password) syncs progress across devices

## Tech

React, TypeScript, Vite, HTML Canvas, vite-plugin-pwa, Supabase (auth + cloud save).

## Local development

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests
npm run build    # production build to dist/
```

Optional `.env` for cloud features:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

If these are absent, the app runs in local-only mode (no login, progress saved in the browser).

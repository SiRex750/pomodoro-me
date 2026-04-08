# Pomodoro Me

A minimalist Pomodoro timer with Picture-in-Picture support, theme backgrounds, and backend-ready deployment on Vercel.

## Features

- 25/5 default timer with editable session lengths
- PiP workflow with video/canvas fallback behavior
- Theme support: Solid, Planets, Marble
- Local assets support (works without internet for backgrounds)
- Backend-ready API routes for future LLM/API endpoints

## Project Structure

- `index.html` - UI structure
- `styles.css` - styling and themes
- `app.js` - timer + PiP + UI interactions
- `server.js` - local Node server for development
- `api/health.js` - Vercel serverless API example route
- `vercel.json` - Vercel routing/runtime config

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open:

`http://localhost:3000`

## Optional PiP Video Sources

For smoother PiP, place these files in `assets/`:

- `assets/focus.mp4`
- `assets/short-break.mp4`
- `assets/long-break.mp4`

If they are missing, the app falls back to canvas rendering.

## Deploy Online With Vercel

This repo is configured for Vercel with static frontend + serverless API routes.

1. Push this repo to GitHub.
2. Open Vercel and click `Add New...` -> `Project`.
3. Import `SiRex750/pomodoro-me`.
4. Keep defaults (Framework Preset: `Other`).
5. Click `Deploy`.

After deploy you will get a public URL like `https://your-project.vercel.app`.

## Connect Your Domain

After deploy on Vercel:

1. Open your Vercel project.
2. Go to `Settings` -> `Domains`.
3. Add your domain (for example `pomodoro.yourdomain.com`).
4. Add the DNS record Vercel shows (usually a CNAME for subdomains).
5. Wait for DNS propagation and SSL issuance.

## Future Backend / LLM Integration

Use files under `api/` for backend logic on Vercel.

Example health endpoint already included:

- `GET /api/health`

You can later add:

- LLM proxy endpoints
- Auth/session endpoints
- User data persistence endpoints

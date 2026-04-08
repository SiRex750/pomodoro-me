# Pomodoro Me

A minimalist Pomodoro timer with Picture-in-Picture support, theme backgrounds, and a backend-ready Node deployment setup.

## Features

- 25/5 default timer with editable session lengths
- PiP workflow with video/canvas fallback behavior
- Theme support: Solid, Planets, Marble
- Local assets support (works without internet for backgrounds)
- Backend-ready server (`Express`) for future LLM/API endpoints

## Project Structure

- `index.html` - UI structure
- `styles.css` - styling and themes
- `app.js` - timer + PiP + UI interactions
- `server.js` - production server and API entry point
- `render.yaml` - one-click Render deployment config

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

## Deploy Online (Backend-Ready)

This repo is configured for Render, which supports both frontend and backend logic.

1. Push repo to GitHub.
2. In Render, choose `New +` -> `Blueprint`.
3. Select this repository.
4. Render reads `render.yaml` and creates the web service automatically.
5. Your app goes live on a public URL.

## Connect Your Domain

After deploy:

1. Open your Render service.
2. Go to `Settings` -> `Custom Domains`.
3. Add your domain (for example `pomodoro.yourdomain.com`).
4. Add the DNS record Render shows (usually a CNAME).
5. Wait for DNS propagation and SSL issuance.

## Future Backend / LLM Integration

Use `server.js` routes under `/api` for backend logic.

Example health endpoint already included:

- `GET /api/health`

You can later add:

- LLM proxy endpoints
- Auth/session endpoints
- User data persistence endpoints

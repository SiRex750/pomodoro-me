# Pomodoro Me

A minimalist Pomodoro timer with Picture-in-Picture support, theme backgrounds, and static deployment on Vercel.

## Features

- 25/5 default timer with editable session lengths
- PiP workflow with video/canvas fallback behavior
- Theme support: Solid, Planets, Marble
- Local assets support (works without internet for backgrounds)
- Optional serverless API route support on Vercel
- Google sign-in with cloud stats sync
- Daily, weekly, and lifetime stats

## Project Structure

- `index.html` - UI structure
- `styles.css` - styling and themes
- `app.js` - timer + PiP + UI interactions
- `api/health.js` - Vercel serverless API example route

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

## PiP Behavior Notes

- Chrome/Edge/Safari: app can programmatically re-open PiP while running.
- Firefox: browser controls the PiP window "Always on top" setting.
- In Firefox, right-click the PiP window and enable `Always on top`.

## Google Sign-In + Cloud Stats Setup

To enable Google sign-in and sync stats across devices:

1. Create a Firebase project.
2. In Firebase Console -> Build -> Authentication -> Sign-in method, enable `Google`.
3. In Firebase Console -> Build -> Firestore Database, create a database in production or test mode.
4. In Firebase Console -> Project settings -> General -> Your apps, add a Web app and copy config values.
5. Open `firebase-config.js` and fill:

```js
window.POMODORO_FIREBASE_CONFIG = {
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_PROJECT.firebaseapp.com",
	projectId: "YOUR_PROJECT_ID",
	appId: "YOUR_APP_ID",
};
```

6. In Firebase Authentication -> Settings -> Authorized domains, add your Vercel domain (for example `your-project.vercel.app`) and any custom domain.
7. Deploy again.

If `firebase-config.js` is left empty, app still works with local-only stats.

## Deploy Online With Vercel

This repo is now configured in the simplest stable way for:

- Static frontend from project root
- Serverless functions from `api/`
- SPA-safe fallback (non-file routes go to `index.html`)

### One-time setup

1. Push this repository to GitHub.
2. Sign in to Vercel with GitHub.
3. In Vercel, click Add New -> Project.
4. Import this repository.
5. Keep Framework Preset as Other.
6. Keep Root Directory as .
7. Build Command: leave empty.
8. Output Directory: leave empty.
9. Install Command: npm install (default is fine).
10. Click Deploy.

After deploy, you will get a URL like:

- https://your-project-name.vercel.app

### Every update after that

1. Commit and push changes to your GitHub branch.
2. Vercel auto-builds and deploys.
3. Open the latest deployment from Vercel Dashboard -> your project.

### Verify deployment

1. Open the root URL and make sure the timer UI loads.
2. Open `/api/health` and confirm JSON response:

```json
{"ok":true,"service":"pomodoro-me"}
```

### If deployment fails

Check these first:

1. Node version is 20.x in `package.json` engines.
2. `vercel.json` is valid JSON (no trailing commas).
3. `api/health.js` exists and exports a handler.
4. No blocked large files were pushed accidentally.
5. In Vercel Project Settings -> General, Root Directory is `.`.

### Optional: deploy using Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

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

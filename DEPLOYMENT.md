# CodeTogether — Production Deployment Guide

A complete, production-grade guide for deploying **CodeTogether** to public infrastructure (Vercel + Railway/Render + MongoDB Atlas).

---

## Architecture Overview

```
 ┌─────────────────────────┐
 │   Vercel Edge Network   │
 │   React 18 + Vite SPA   │  <── Users / Teammates Browser
 │   (Monaco + Yjs Client) │
 └────────────┬────────────┘
              │ HTTPS API & WSS WebSockets
              ▼
 ┌────────────────────────────────────────────────────────┐
 │   Persistent Backend (Railway / Render / Fly.io / VPS) │
 │   Node.js 20 + Express + Socket.IO + Yjs CRDT Engine   │
 └────────────┬─────────────────────────────┬─────────────┘
              │                             │
              ▼                             ▼
 ┌──────────────────────────┐  ┌──────────────────────────┐
 │      MongoDB Atlas       │  │ Isolated Docker Sandbox  │
 │  Users, Rooms, Metadata, │  │ Ephemeral containerized  │
 │  File Docs, Chat History │  │ execution of user code   │
 └──────────────────────────┘  └──────────────────────────┘
```

---

## 1. MongoDB Atlas Setup

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a new cluster (Shared / Free M0 tier is supported).
3. Under **Security → Database Access**, create a user with read/write privileges (e.g. `codetogether_admin`).
4. Under **Security → Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere) so cloud providers (Railway/Render) can connect.
5. Under **Database → Clusters → Connect → Drivers (Node.js)**, copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/codetogether?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user credentials.

---

## 2. Backend Deployment (Railway or Render)

> **Important:** Vercel Serverless Functions do not support long-lived WebSocket connections required by Socket.IO and Yjs. Deploy the backend to a persistent Node.js service such as Railway, Render, Fly.io, or a VPS.

### Option A: Railway (Recommended — 2-minute setup)

1. Log in to [railway.app](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo** and pick `rudraarora12/code-together`.
3. Go to **Settings**:
   - **Build Command:** `npm ci`
   - **Start Command:** `node server/server.js`
   - **Root Directory:** `/` (repo root)
4. Under **Variables**, add the following environment variables:
   | Variable | Value | Description |
   |---|---|---|
   | `PORT` | `5001` (or let Railway assign) | Backend port |
   | `NODE_ENV` | `production` | Production mode |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | Vercel domain for CORS & WebSockets |
   | `SESSION_SECRET` | `<32_character_random_string>` | Session encryption secret |
5. Under **Settings → Networking**, click **Generate Domain** to get a public URL (e.g. `https://codetogether-production.up.railway.app`).

### Option B: Render

1. Log in to [render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure:
   - **Runtime:** `Node`
   - **Build Command:** `npm ci`
   - **Start Command:** `node server/server.js`
   - **Plan:** Free or Starter
4. Add the same Environment Variables listed above.
5. Copy your Render service URL (e.g. `https://codetogether-backend.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

1. Log in to [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repository: `rudraarora12/code-together`.
3. Configure the Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-backend.up.railway.app` |
   | `VITE_SOCKET_URL` | `https://your-backend.up.railway.app` |
5. Click **Deploy**. Vercel will build and assign a public URL (e.g. `https://code-together-tau.vercel.app`).
6. Copy this Vercel domain and update the `FRONTEND_URL` variable in your Railway/Render backend dashboard.

---

## 4. Docker Isolated Code Execution Setup

Code execution runs isolated user projects without granting host filesystem access:

- **Local & VPS Deployments:** If Docker is installed on the host machine, `server/sandboxRunner.js` automatically routes project runs into isolated containers with non-root user, CPU caps, memory limits (512MB), and a 30-minute timeout.
- **Docker Compose:** Run the full stack with 1 command:
  ```bash
  docker compose up -d --build
  ```
- **PaaS (Railway / Render):** If Docker daemon socket is not available, the backend automatically uses the hardened **Process Sandbox Runner** with stripped environment variables (`AWS_*`, `TOKEN_*`, etc. removed), isolated temporary working directories, and process tree termination (`tree-kill`).

---

## 5. Verification & Health Monitoring

Test that your deployed production environment is operating cleanly:

1. **Backend Health Check:**
   Visit: `https://your-backend.up.railway.app/api/health`
   Expected response:
   ```json
   {
     "status": "ok",
     "uptime": 120.5,
     "database": {
       "connected": true,
       "state": "connected",
       "mode": "mongodb_atlas"
     },
     "activeRooms": 1,
     "environment": "production"
   }
   ```

2. **Frontend SPA Navigation:**
   Visit `https://your-frontend.vercel.app/dashboard`, refresh the page, and ensure it loads without 404 errors (handled by `vercel.json` SPA rewrites).

3. **Multi-User Real-Time Sync:**
   - Open your Vercel URL in two separate browser sessions (or share the room link with a teammate).
   - Edit files simultaneously: live colored cursors and document characters should synchronize instantly via Yjs and Socket.IO.
   - Send chat messages and verify real-time delivery and MongoDB persistence.

---

## 6. Environment Variables Reference

| Variable | Required In | Purpose | Example |
|---|---|---|---|
| `PORT` | Backend | Port for HTTP & Socket server | `5001` |
| `NODE_ENV` | Backend | Runtime environment | `production` |
| `FRONTEND_URL` | Backend | Whitelist Vercel domain for CORS | `https://your-app.vercel.app` |
| `MONGODB_URI` | Backend | Atlas database connection string | `mongodb+srv://...` |
| `SESSION_SECRET` | Backend | Encryption key for auth tokens | `a-very-long-secret-key` |
| `VITE_API_URL` | Frontend | Backend REST API endpoint | `https://your-backend.up.railway.app` |
| `VITE_SOCKET_URL` | Frontend | Backend Socket.IO endpoint | `https://your-backend.up.railway.app` |
| `MAX_PROJECT_SIZE_MB` | Backend | Max allowed upload size | `50` |
| `MAX_FILES_COUNT` | Backend | Max allowed files per room | `500` |
| `SANDBOX_TIMEOUT_MS` | Backend | Max execution duration | `1800000` (30 min) |

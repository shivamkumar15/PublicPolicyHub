# Public Policy Hub

Public Policy Hub is a civic reporting platform where users can publish public issues, support posts, discuss solutions, bookmark reports, and follow profiles.

## Tech Stack

- React 19 + Parcel
- Tailwind CSS
- Firebase Authentication (frontend)
- Node.js + Express (backend)
- MongoDB + Mongoose

## Project Structure

- `src/` - frontend application
- `backend/` - API server, DB models, and seed script
- `backend/uploads/` - runtime upload files (gitignored)

## Prerequisites

Install these before setup:

- Node.js 20+ and npm 10+
- MongoDB (local service) or Docker
- Git
- Optional: `ffmpeg` (for generating extra video quality variants)

## Setup (Important)

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd PublicPolicyHub
npm install
cd backend
npm install
cd ..
```

### 2. Create backend environment file

Create `backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/publicpolicyhub
PORT=5000
JWT_SECRET=change_this_to_a_long_random_string

# Optional (AI summary fallback works even if not set):
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Note: `127.0.0.1` is used to avoid localhost/IPv6 issues some Linux setups can hit.

### 3. Start MongoDB

Use one method:

- Local service (Linux): start your MongoDB service (`mongod` or `mongodb`, depending on install).
- Docker:

```bash
docker run -d --name publicpolicyhub-mongo -p 27017:27017 mongo:7
```

### 4. Start frontend + backend together

From project root:

```bash
npm run dev
```

This starts:

- Frontend: `http://localhost:1234`
- Backend: `http://localhost:5000`

Important: `npm start` runs only frontend. For full app, use `npm run dev`.

## Verify Backend Connection

After starting, confirm these work:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/posts
```

Expected for health: `{"status":"ok"}`

## Why Frontend Sometimes Cannot Connect to Backend

The frontend calls relative paths like `/api/...` and relies on Parcel proxy config in `.proxyrc`:

- `/api` -> `http://localhost:5000`
- `/uploads` -> `http://localhost:5000`

If backend is down, wrong port is used, or MongoDB is not running, API calls fail.

## Troubleshooting (CachyOS/Linux)

1. Check backend is running and not crashing:
```bash
cd backend
npm run dev
```
If MongoDB is unreachable, backend exits with a DB connection error.

2. Make sure MongoDB is actually listening on `27017`.

3. Use `npm run dev` from project root (not `npm start`).

4. If you changed backend `PORT`, update `.proxyrc` target to the same port, then restart frontend.

5. If port `5000` is busy, choose a free port in `backend/.env` and match `.proxyrc`.

## Available Scripts

From project root:

- `npm run dev` - run frontend and backend together
- `npm run dev:frontend` - run frontend only
- `npm run dev:backend` - run backend only
- `npm run build` - production frontend build
- `npm run lint` - lint frontend code

From `backend/`:

- `npm run dev` - backend with nodemon
- `npm start` - backend with node
- `node seed.js` - seed DB with sample data

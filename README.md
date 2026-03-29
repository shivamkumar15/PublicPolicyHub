# Public Policy Hub

Public Policy Hub is a social-style civic reporting platform where users can publish public issue reports, support posts, share solutions, bookmark important threads, and follow contributor profiles.

## Features

- React frontend with a feed, post detail views, bookmarks, and profile pages
- Firebase-based sign-in flow connected to a Node/Express backend
- MongoDB persistence for posts, user profiles, follows, bookmarks, and profile photos
- Media uploads with image/video support and backend-served uploads
- Real-time post updates over Server-Sent Events
- Clean left-rail category ranking with feed filtering

## Tech Stack

- React 19
- Parcel
- Tailwind CSS
- Firebase Authentication
- Node.js + Express
- MongoDB + Mongoose

## Project Structure

- `src/` - frontend app
- `backend/` - API server, database models, and seed scripts
- `backend/uploads/` - runtime upload storage (ignored in git)

## Getting Started

### 1. Install dependencies

```bash
npm install
cd backend && npm install
```

### 2. Configure environment

Create `backend/.env` with:

```env
MONGODB_URI=mongodb://localhost:27017/publicpolicyhub
PORT=5000
JWT_SECRET=better_india_secret_key_123
```

If you use Firebase, also make sure the frontend Firebase config in `src/firebase.js` matches your project credentials.

### 3. Run the app

From the project root:

```bash
npm run dev
```

This starts:

- Frontend on Parcel dev server
- Backend on `http://localhost:5000`

## Available Scripts

- `npm run dev` - run frontend and backend together
- `npm run dev:frontend` - run only the frontend
- `npm run dev:backend` - run only the backend
- `npm run build` - production frontend build
- `npm run lint` - lint frontend code

## Backend Notes

- Posts are available at `/api/posts`
- Real-time updates stream from `/api/events`
- User profile data is available at `/api/users/profile` and `/api/users/:username`
- Bookmarks, follows, and profile photo uploads are persisted in MongoDB

## Repository Notes

- `node_modules`, build artifacts, uploads, and local env files are ignored
- Test media and local scratch upload scripts are not committed

## Status

Current verified checks:

- `npm run build`
- `npm run lint` with 2 existing React hook warnings in `src/App.jsx`
- `node --check backend/server.js`

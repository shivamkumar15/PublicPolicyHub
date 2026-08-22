# Public Policy Hub

Public Policy Hub is a civic engagement platform where people can report issues, share policy updates, follow communities, bookmark useful posts, and discuss solutions with others.

## Overview

This project combines:

- a React frontend for browsing and creating civic content
- an Express backend API for authentication, posts, follow logic, notifications, and messaging
- Firebase for authentication and web app configuration
- Supabase for app data persistence and storage

## Features

- Create and browse public policy posts
- Support or react to community issues
- Follow users and profiles
- Bookmark important reports
- Messaging and notifications between users
- City and location-aware civic content
- Admin-friendly setup and demo data seeding

## Tech stack

- Frontend: React + Parcel
- Backend: Node.js + Express
- Database: Supabase
- Auth: Firebase Authentication
- Styling: Tailwind CSS

## Local development

Install dependencies and start both apps together:

```bash
npm install
npm run setup          # scaffolds backend/.env and optional root .env
npm run seed           # optional: loads demo content into Supabase
npm run dev            # frontend on :1234 and backend on :5000
```

Check environment configuration without printing secrets:

```bash
npm run setup:check
```

## Project configuration

### 1. Frontend Firebase config

Create a `.env` file in the project root with the public Firebase web config values.

| Variable | Example |
| --- | --- |
| `FIREBASE_API_KEY` | public API key from Firebase web app config |
| `FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | your Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | `your-project.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | sender ID from Firebase config |
| `FIREBASE_APP_ID` | Firebase web app ID |
| `FIREBASE_MEASUREMENT_ID` | analytics measurement ID |

These values are public by design and are used by the browser. The file is gitignored.

In Firebase Console, enable the sign-in methods you want, especially:

- Email/Password
- Google
- Phone (optional)

For local Google sign-in, add `http://localhost:1234` to the authorized domains list.

### 2. Backend Supabase config

Create `backend/.env` with:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key used by the backend |
| `SUPABASE_ANON_KEY` | Optional anon key fallback |

Then run the SQL schema from `backend/schema.sql` in the Supabase SQL editor. This creates the core tables and functions required by the app.

### 3. Backend Firebase Admin config

The backend verifies Firebase ID tokens using a service account.

Add these values to `backend/.env`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Generate the service account JSON from Firebase Console > Project settings > Service accounts.

### 4. Optional environment variables

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables AI-powered summaries |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| `PORT` | Backend port, default `5000` |

> The backend reads `backend/.env` only. If the required environment is missing, API routes may return a `503` configuration error.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run setup
npm run setup:check
npm run seed
```

## Screenshots

![Public Policy Hub screenshot](https://github.com/user-attachments/assets/1b4aaca1-f12e-4af7-8245-1f73c2ec1684)
![Public Policy Hub screenshot](https://github.com/user-attachments/assets/7542ac46-fc54-4fc0-906a-742e72c65dd7)
![Public Policy Hub screenshot](https://github.com/user-attachments/assets/48d6c138-bf4d-4909-9c04-e3a938c856e5)

## Notes

This project is intended for local development and demo use. Keep secrets out of source control and store them only in environment files that are ignored by Git.

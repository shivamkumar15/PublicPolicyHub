# Public Policy Hub

Public Policy Hub is a civic reporting platform where users can publish public issues, support posts, discuss solutions, bookmark reports, follow profiles, and chat with other users.

## Features

- Publish and discuss public issues
- Support posts and solutions
- Bookmark reports
- Follow user profiles
- Chat with other users
- Firebase Authentication
- Real-time notifications
- Supabase Integration (PostgreSQL)

## Tech Stack

- React 19 + Parcel
- Tailwind CSS
- Firebase Authentication (frontend)
- Node.js + Express (backend)
- Supabase (PostgreSQL)

## Project Structure

- `src/` - frontend application
- `backend/` - API server, database configuration, and seed script
- `backend/uploads/` - runtime upload files (gitignored)

## Prerequisites

Install these before setup:

- Node.js 20+ and npm 10+
- A Supabase project (URL and Anon Key)
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
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=5000
JWT_SECRET=change_this_to_a_long_random_string

# Optional (AI summary fallback works even if not set):
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

### 3. Database Setup (Supabase)

1.  Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Open the **SQL Editor**.
3.  Create a **New Query**.
4.  Copy the contents of `backend/schema.sql` and click **Run**. 
    *This will create the necessary tables and disable RLS for local development.*

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

## Troubleshooting

1. **Database Connection**: If the backend fails to start, ensure your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in `backend/.env`.
2. **Missing Data**: If the home page is empty, ensure you have successfully run the `schema.sql` in the Supabase SQL Editor. The backend will auto-seed data on its first successful run once tables are created.
3. **RLS Errors**: If you see "Row Level Security" errors in the backend logs, ensure you ran the entire `schema.sql`, including the `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` lines at the bottom.

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

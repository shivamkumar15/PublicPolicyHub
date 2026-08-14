# Public Policy Hub

Public Policy Hub is a civic reporting platform where users can publish public issues, support posts, discuss solutions, bookmark reports, follow profiles, and chat with other users.

## Local development

```bash
npm install
npm run setup          # guided: writes backend/.env (Supabase + Firebase Admin) and optionally .env (frontend Firebase web config)
npm run seed           # optional: load demo posts/cities/notifications into Supabase
npm run dev            # frontend on :1234 (proxies /api + /uploads to :5000), backend on :5000
```

Check what is configured at any time (prints status only, never secrets):

```bash
npm run setup:check
```

### 1. Frontend — Firebase web app (root `.env`)

The root `.env` holds the **public** Firebase *web* config that Parcel inlines for `src/firebase.js`:

| Variable | Where to find it |
| --- | --- |
| `FIREBASE_API_KEY` | Firebase Console > Project settings > General > Your apps > your web app |
| `FIREBASE_AUTH_DOMAIN` | same section (e.g. `<project-id>.firebaseapp.com`) |
| `FIREBASE_PROJECT_ID` | same section |
| `FIREBASE_STORAGE_BUCKET` | same section (e.g. `<project-id>.firebasestorage.app` or `<project-id>.appspot.com`) |
| `FIREBASE_MESSAGING_SENDER_ID` | same section |
| `FIREBASE_APP_ID` | same section |
| `FIREBASE_MEASUREMENT_ID` | same section |

Steps: create a Firebase project → **Add app** → choose **Web** → register the app → copy the `firebaseConfig` values into `.env`. These values are public by design (they ship in the browser bundle) — the file is not a secret, but it is still gitignored.

Then enable sign-in providers: Firebase Console > **Authentication > Sign-in method** — turn on **Email/Password**, **Google**, and (optional) **Phone**. For Google/redirect sign-in during local dev, add `http://localhost:1234` under **Authentication > Settings > Authorized domains**.

### 2. Backend — Supabase (`backend/.env`)

1. Create a project at [supabase.com](https://supabase.com).
2. Supabase Dashboard > **Project Settings > API**: copy the **Project URL** and the **service_role key**.
3. Run `backend/schema.sql` in the Supabase SQL editor (Dashboard > **SQL** > New query > paste > Run). It creates the tables (`users`, `posts`, `cities`, `notifications`, `messages`), indexes, RLS policies, and the `rename_user_following` / `rename_user_participants` RPC functions the backend calls when a user renames their username.
4. (Optional) `npm run seed` to load demo posts, cities, and notifications.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — server-side, bypasses RLS |
| `SUPABASE_ANON_KEY` | optional fallback (anon key) if you don't use the service-role key |

### 3. Backend — Firebase Admin SDK (`backend/.env`)

Used to verify the ID tokens the frontend sends.

1. Firebase Console > **Project settings > Service accounts** > **Generate new private key** — downloads a JSON file.
2. Copy these three values into `backend/.env`:
   - `FIREBASE_PROJECT_ID` → `project_id` from the JSON
   - `FIREBASE_CLIENT_EMAIL` → `client_email`
   - `FIREBASE_PRIVATE_KEY` → `private_key` — paste the whole PEM block, keeping the `\n` escapes as-is (or run `npm run setup`, which normalizes it for you)

### 4. Optional variables

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | AI solution summaries (falls back to a local summary when unset) |
| `OPENAI_MODEL` | default `gpt-4o-mini` |
| `PORT` | backend port, default `5000` |

> The backend reads **`backend/.env`** only. It starts even when Supabase/Firebase Admin are unset, but `/api/*` returns `503 Server configuration error` until `backend/.env` is populated. The frontend shows an empty feed instead of crashing in that case.

# Screenshot
<img width="1546" height="916" alt="2026-05-22-151444" src="https://github.com/user-attachments/assets/1b4aaca1-f12e-4af7-8245-1f73c2ec1684" />
<img width="1555" height="895" alt="2026-05-22-151423" src="https://github.com/user-attachments/assets/7542ac46-fc54-4fc0-906a-742e72c65dd7" />
<img width="1572" height="908" alt="2026-05-22-151411" src="https://github.com/user-attachments/assets/48d6c138-bf4d-4909-9c04-e3a938c856e5" />
# Guys its sad to announce that PPH will no longer be available yo use as there is too much risk with this project 

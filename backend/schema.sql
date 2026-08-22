-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT DEFAULT '',
    firebase_uid TEXT UNIQUE,
    email TEXT UNIQUE,
    gender TEXT DEFAULT '',
    phone_number TEXT UNIQUE,
    role TEXT DEFAULT 'User',
    password_hash TEXT,
    profile_photo_url TEXT DEFAULT '',
    personal_description TEXT DEFAULT '',
    bookmarked_post_ids TEXT[] DEFAULT '{}',
    reported_post_ids TEXT[] DEFAULT '{}',
    following TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city TEXT UNIQUE NOT NULL,
    issues INTEGER DEFAULT 0,
    topic TEXT
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY, -- Using the custom string ID from the app
    location TEXT NOT NULL,
    department TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT REFERENCES users(username) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    time TEXT,
    support INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    solutions INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    supporters TEXT[] DEFAULT '{}',
    comments_list JSONB DEFAULT '[]',
    solutions_list JSONB DEFAULT '[]',
    media TEXT DEFAULT 'IMAGE',
    media_list JSONB DEFAULT '[]',
    verified BOOLEAN DEFAULT false,
    nearby BOOLEAN DEFAULT false,
    tag TEXT,
    accent TEXT,
    fixes TEXT[] DEFAULT '{}'
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_username TEXT NOT NULL,
    actor_username TEXT DEFAULT '',
    type TEXT DEFAULT 'generic',
    message TEXT NOT NULL,
    post_id TEXT,
    post_title TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_username TEXT NOT NULL,
    recipient_username TEXT NOT NULL,
    participants TEXT[] NOT NULL,
    text TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_username);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- RPC functions used by the backend when a user renames their username.
-- They replace the old username inside TEXT[] arrays (users.following,
-- messages.participants) across all rows that reference it.
CREATE OR REPLACE FUNCTION rename_user_following(old_username TEXT, new_username TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
     SET following = array_replace(following, old_username, new_username)
   WHERE old_username = ANY(following);
END;
$$;

CREATE OR REPLACE FUNCTION rename_user_participants(old_username TEXT, new_username TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE messages
     SET participants = array_replace(participants, old_username, new_username)
   WHERE old_username = ANY(participants);
END;
$$;

-- Disable RLS for all tables to allow the backend to function without complex policies for now
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Fallback: If RLS is forced to be enabled, allow everything
DO $$ 
BEGIN
    -- users
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        DROP POLICY IF EXISTS "Allow all" ON users;
        CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
    END IF;
    -- posts
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'posts') THEN
        DROP POLICY IF EXISTS "Allow all" ON posts;
        CREATE POLICY "Allow all" ON posts FOR ALL USING (true) WITH CHECK (true);
    END IF;
    -- cities
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cities') THEN
        DROP POLICY IF EXISTS "Allow all" ON cities;
        CREATE POLICY "Allow all" ON cities FOR ALL USING (true) WITH CHECK (true);
    END IF;
    -- notifications
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications') THEN
        DROP POLICY IF EXISTS "Allow all" ON notifications;
        CREATE POLICY "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);
    END IF;
    -- messages
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages') THEN
        DROP POLICY IF EXISTS "Allow all" ON messages;
        CREATE POLICY "Allow all" ON messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(100) PRIMARY KEY,
    role VARCHAR(50) DEFAULT 'User',
    password_hash VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(100) PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    author VARCHAR(100) REFERENCES users(username),
    time VARCHAR(50),
    support VARCHAR(50) DEFAULT '0',
    comments VARCHAR(50) DEFAULT '0',
    solutions VARCHAR(50) DEFAULT '0',
    media VARCHAR(50) DEFAULT 'IMAGE',
    verified BOOLEAN DEFAULT false,
    nearby BOOLEAN DEFAULT false,
    tag VARCHAR(100),
    accent VARCHAR(100),
    fixes JSONB
);

CREATE TABLE IF NOT EXISTS cities (
    city VARCHAR(100) PRIMARY KEY,
    issues INTEGER DEFAULT 0,
    topic VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

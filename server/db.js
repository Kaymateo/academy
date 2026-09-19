import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const UPLOAD_DIR = path.join(ROOT, 'uploads');
export const VIDEOS_DIR = path.join(UPLOAD_DIR, 'videos');
export const PREVIEWS_DIR = path.join(UPLOAD_DIR, 'previews');
export const COVERS_DIR = path.join(UPLOAD_DIR, 'covers');

for (const d of [DATA_DIR, VIDEOS_DIR, PREVIEWS_DIR, COVERS_DIR]) {
  fs.mkdirSync(d, { recursive: true });
}

export const db = new Database(path.join(DATA_DIR, 'academy.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category_id INTEGER,
  description TEXT NOT NULL DEFAULT '',
  video_path TEXT,
  preview_path TEXT,
  cover_path TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  course_id INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'unused',
  batch TEXT NOT NULL DEFAULT '',
  device TEXT,
  ip TEXT,
  used_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  course_id INTEGER NOT NULL DEFAULT 0,
  device TEXT,
  ip TEXT,
  unlocked_until TEXT,
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_codes_status ON codes(status);
CREATE INDEX IF NOT EXISTS idx_codes_course ON codes(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_cat ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON redemptions(code_id);
`);

-- Run once against the production database:
--   npx dotenv -e .env.local -- npx drizzle-kit push
-- OR apply this SQL directly:

CREATE TABLE IF NOT EXISTS nail_styles (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL,
  prompt           TEXT NOT NULL,
  thumbnail_url    TEXT,
  color            TEXT,
  acabado          TEXT,
  forma            TEXT,
  estilo           TEXT,
  badge            TEXT,
  discount_percent INTEGER,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If the table already exists, add the new columns:
ALTER TABLE nail_styles ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE nail_styles ADD COLUMN IF NOT EXISTS acabado TEXT;
ALTER TABLE nail_styles ADD COLUMN IF NOT EXISTS forma TEXT;
ALTER TABLE nail_styles ADD COLUMN IF NOT EXISTS estilo TEXT;
ALTER TABLE nail_styles ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE nail_styles ADD COLUMN IF NOT EXISTS discount_percent INTEGER;

-- Hand photo column on user_profiles:
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hand_photo_url TEXT;

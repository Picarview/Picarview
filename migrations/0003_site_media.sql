CREATE TABLE IF NOT EXISTS site_media (
  slot TEXT PRIMARY KEY CHECK (
    slot IN ('hero', 'expression-1', 'expression-2', 'expression-3', 'expression-4')
  ),
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  title TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

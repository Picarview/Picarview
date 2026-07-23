ALTER TABLE content_items
  ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1));

CREATE INDEX IF NOT EXISTS idx_content_items_archive
  ON content_items (type, archived, created_at);

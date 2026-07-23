ALTER TABLE content_items
  ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1));

CREATE INDEX IF NOT EXISTS idx_content_items_public_pinned
  ON content_items (type, published, archived, pinned, sort_order, created_at);

ALTER TABLE content_items ADD COLUMN industry TEXT NOT NULL DEFAULT '';

UPDATE content_items
SET industry = 'General'
WHERE type = 'project' AND industry = '';

CREATE INDEX IF NOT EXISTS idx_content_items_industry
  ON content_items (type, published, industry);

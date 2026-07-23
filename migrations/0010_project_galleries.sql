CREATE TABLE IF NOT EXISTS project_images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES content_items(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO project_images (id, project_id, object_key, alt_text, sort_order)
SELECT id || '-primary', id, object_key, alt_text, 0
FROM content_items
WHERE type = 'project';

CREATE INDEX IF NOT EXISTS idx_project_images_project
  ON project_images (project_id, sort_order, created_at);

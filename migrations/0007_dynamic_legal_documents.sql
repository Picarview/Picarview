CREATE TABLE legal_pages_dynamic (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  introduction TEXT NOT NULL DEFAULT '',
  sections_json TEXT NOT NULL DEFAULT '[]',
  effective_date TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO legal_pages_dynamic
  (slug, title, introduction, sections_json, effective_date, published, updated_at)
SELECT slug, title, introduction, sections_json, effective_date, published, updated_at
FROM legal_pages;

DROP TABLE legal_pages;
ALTER TABLE legal_pages_dynamic RENAME TO legal_pages;
CREATE INDEX idx_legal_pages_public ON legal_pages (published, title);

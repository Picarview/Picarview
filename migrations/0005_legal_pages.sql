CREATE TABLE IF NOT EXISTS legal_pages (
  slug TEXT PRIMARY KEY CHECK (slug IN ('privacy', 'terms')),
  title TEXT NOT NULL,
  introduction TEXT NOT NULL DEFAULT '',
  sections_json TEXT NOT NULL DEFAULT '[]',
  effective_date TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO legal_pages (slug, title) VALUES ('privacy', 'Privacy Policy');
INSERT OR IGNORE INTO legal_pages (slug, title) VALUES ('terms', 'Terms & Conditions');

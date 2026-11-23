-- Case-study detail for projects, edited in the admin and shown on /projects/<id>.
-- services and deliverables are comma-separated lists; outcomes_json is a JSON array
-- of up to three { "title": string, "body": string } results.
ALTER TABLE content_items ADD COLUMN year TEXT NOT NULL DEFAULT '';
ALTER TABLE content_items ADD COLUMN services TEXT NOT NULL DEFAULT '';
ALTER TABLE content_items ADD COLUMN deliverables TEXT NOT NULL DEFAULT '';
ALTER TABLE content_items ADD COLUMN challenge TEXT NOT NULL DEFAULT '';
ALTER TABLE content_items ADD COLUMN approach TEXT NOT NULL DEFAULT '';
ALTER TABLE content_items ADD COLUMN outcomes_json TEXT NOT NULL DEFAULT '[]';

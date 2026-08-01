-- harness/scripts/migrations/010_create_blacklisted_tokens_table.sql
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    token TEXT PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires_at ON blacklisted_tokens(expires_at);

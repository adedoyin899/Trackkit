-- Phase 3: AI chat response cache. Keyed by user + a hash of the question
-- (plus any product/time-range context), so asking the same thing twice
-- within a week reuses the cached response instead of paying for another
-- Claude call. See PHASE-3-AI.md's Database Schema section.

CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_hash TEXT NOT NULL,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE (user_id, query_hash)
);

CREATE INDEX idx_ai_cache_user_created ON ai_cache(user_id, created_at DESC);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);

ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own ai_cache rows"
ON ai_cache
FOR ALL
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

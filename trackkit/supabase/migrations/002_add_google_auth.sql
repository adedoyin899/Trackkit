-- Adds Google OAuth as a secondary sign-in method alongside phone OTP.
-- Google-authenticated users may have no phone number at all, so
-- phone_number can no longer be required — email (already a column since
-- 001, just never NOT NULL/UNIQUE) fills that role instead for those
-- accounts. auth_provider records which method created the account,
-- mainly for support/debugging, not for access control (RLS still keys
-- off auth.uid()).

ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'phone'
  CHECK (auth_provider IN ('phone', 'google'));
ALTER TABLE users ADD CONSTRAINT users_identity_present
  CHECK (phone_number IS NOT NULL OR email IS NOT NULL);

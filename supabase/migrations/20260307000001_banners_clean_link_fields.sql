-- Sprint 3G: Add link_name and link_target to banners_clean (Hero VIP navigation links)
ALTER TABLE banners_clean
  ADD COLUMN IF NOT EXISTS link_name   TEXT,
  ADD COLUMN IF NOT EXISTS link_target TEXT CHECK (link_target IN ('_self', '_blank')) DEFAULT '_self';

COMMENT ON COLUMN banners_clean.link_name   IS 'Display text for the navigation link (falls back to client_name if null)';
COMMENT ON COLUMN banners_clean.link_target IS 'Link target: _self (same tab) or _blank (new tab)';

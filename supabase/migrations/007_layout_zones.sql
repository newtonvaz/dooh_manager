-- Add direct content_id reference to layout_areas for zone-based layouts

alter table if exists layout_areas
  add column if not exists content_id text;

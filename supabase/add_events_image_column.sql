-- Adds a nullable Image column to Events for storing event image URLs.
-- Safe to run multiple times.

alter table if exists public."Events"
  add column if not exists "Image" text;

-- Optional: if you want to enforce URL-ish data later, do it via application validation.
-- Keeping it nullable avoids breaking existing inserts/updates.

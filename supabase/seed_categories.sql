-- seed_categories.sql
-- Insert commonly used categories if they don't already exist
-- Run in Supabase SQL editor or via psql

BEGIN;

INSERT INTO public."Categories" ("Name")
SELECT 'Eğitim'
WHERE NOT EXISTS (SELECT 1 FROM public."Categories" WHERE "Name" = 'Eğitim');

INSERT INTO public."Categories" ("Name")
SELECT 'Konser'
WHERE NOT EXISTS (SELECT 1 FROM public."Categories" WHERE "Name" = 'Konser');

INSERT INTO public."Categories" ("Name")
SELECT 'Sosyal'
WHERE NOT EXISTS (SELECT 1 FROM public."Categories" WHERE "Name" = 'Sosyal');

INSERT INTO public."Categories" ("Name")
SELECT 'Kariyer'
WHERE NOT EXISTS (SELECT 1 FROM public."Categories" WHERE "Name" = 'Kariyer');

INSERT INTO public."Categories" ("Name")
SELECT 'Teknoloji ve Yazılım'
WHERE NOT EXISTS (SELECT 1 FROM public."Categories" WHERE "Name" = 'Teknoloji ve Yazılım');

INSERT INTO public."Categories" ("Name")
SELECT 'Müzik ve Eğlence'
WHERE NOT EXISTS (SELECT 1 FROM public."Categories" WHERE "Name" = 'Müzik ve Eğlence');

INSERT INTO public."Categories" ("Name")
SELECT 'Spor ve Outdoor'
WHERE NOT EXISTS (SELECT 1 FROM public."Categories" WHERE "Name" = 'Spor ve Outdoor');

INSERT INTO public."Categories" ("Name")
SELECT 'Girişimcilik'
WHERE NOT EXISTS (SELECT 1 FROM public."Categories" WHERE "Name" = 'Girişimcilik');

COMMIT;

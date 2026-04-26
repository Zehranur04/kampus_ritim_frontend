-- Seed Rooms
-- Safe to run multiple times: uses WHERE NOT EXISTS check by Id.

INSERT INTO "public"."Rooms" ("Id", "Name", "Capacity", "Location", "HasProjector")
SELECT v."Id", v."Name", v."Capacity", v."Location", v."HasProjector"
FROM (
  VALUES
    (1,  'Ana Konferans Salonu',      300, 'Rektörlük Binası',            true),
    (2,  'Z-25',                      50, 'Mühendislik Fakültesi 1. Kat', true),
    (3,  'Kütüphane',                 30, 'Kütüphane',                    false),

    -- Event.Location ile birebir eşleşecek odalar (eski etkinlikleri bağlamak için)
    (4,  'Konferans Salonu A',       250, 'Rektörlük Binası',             true),
    (5,  'Konferans Salonu B',       250, 'Rektörlük Binası',             true),
    (6,  'Festival Alanı',           800, 'Açık Alan',                    false),
    (7,  'Orman Girişi',             100, 'Kampüs Dışı',                  false),
    (8,  'Seminer Odası 1',           60, 'İktisadi ve İdari Bilimler',    true),
    (9,  'Seminer Odası 3',           60, 'İktisadi ve İdari Bilimler',    true),
    (10, 'Kuluçka Merkezi',          120, 'Teknoloji Merkezi',            true),
    (11, 'Tasarım Stüdyosu',          40, 'Güzel Sanatlar',               true),
    (12, 'Kampüs Çim Alanı',         300, 'Açık Alan',                    false),
    (13, 'Amfi Tiyatro',             700, 'Açık Alan',                    false),
    (14, 'Bilgisayar Laboratuvarı',  120, 'Mühendislik Fakültesi',        true),
    (15, 'Bilgisayar Lab 2',          60, 'Mühendislik Fakültesi',        true),
    (16, 'Teknoloji Merkezi',        200, 'Teknoloji Merkezi',            true),
    (17, 'Öğrenci Merkezi',          200, 'Öğrenci Merkezi',              true),
    (18, 'Sergi Salonu',             200, 'Kültür Merkezi',               true),
    (19, 'Sinema Salonu',            200, 'Kültür Merkezi',               true),
    (20, 'Siber Laboratuvar',        150, 'Mühendislik Fakültesi',        true),
    (21, 'Kariyer Ofisi',            100, 'Kariyer Merkezi',              true),
    (22, 'Fuaye Alanı',              400, 'Ana Bina',                    false),
    (23, 'Hukuk Fakültesi',          120, 'Hukuk Fakültesi',              true),
    (24, 'Müzik Stüdyosu',            80, 'Kültür Merkezi',               true),
    (25, 'B1 Konferans Salonu',      150, 'Ana Bina',                     true)
) AS v ("Id", "Name", "Capacity", "Location", "HasProjector")
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."Rooms" r WHERE r."Id" = v."Id"
);

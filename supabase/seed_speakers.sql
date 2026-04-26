-- seed_speakers.sql
-- Insert sample speakers if they don't already exist
-- Run in Supabase SQL editor or via psql

BEGIN;

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Ahmet', 'Yılmaz', 'Yapay zeka üzerine çalışan kıdemli mühendis', 'default_profile.png', 'Yazılım Uzmanı', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Ahmet' AND "Surname" = 'Yılmaz');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Ayşe', 'Demir', 'UX tasarım ve kullanıcı deneyimi uzmanı', 'default_profile.png', 'UX Uzmanı', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Ayşe' AND "Surname" = 'Demir');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Mehmet', 'Kaya', 'Girişimcilik ve startup mentorluğu yapıyor', 'default_profile.png', 'Girişimci ve Mentor', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Mehmet' AND "Surname" = 'Kaya');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Elif', 'Şahin', 'Mobil uygulama geliştirme eğitmeni', 'default_profile.png', 'Mobil Geliştirici', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Elif' AND "Surname" = 'Şahin');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Deniz', 'Köse', 'Müzik prodüksiyon ve sahne performansı eğitmeni', 'default_profile.png', 'Müzik Eğitmeni', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Deniz' AND "Surname" = 'Köse');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Pelin', 'Akın', 'Veri bilimi ve makine öğrenimi konusunda eğitmen', 'default_profile.png', 'Veri Bilimi Uzmanı', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Pelin' AND "Surname" = 'Akın');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Emre', 'Çelik', 'Oyun geliştirme ve Unity uzmanı', 'default_profile.png', 'Oyun Geliştirici', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Emre' AND "Surname" = 'Çelik');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Zeynep', 'Arslan', 'Sosyal sorumluluk projeleri koordinatörü', 'default_profile.png', 'Proje Koordinatörü', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Zeynep' AND "Surname" = 'Arslan');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Can', 'Doğan', 'Blockchain ve kripto alanında araştırmacı', 'default_profile.png', 'Araştırmacı', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Can' AND "Surname" = 'Doğan');

INSERT INTO public."Speakers" ("Name", "Surname", "Bio", "ProfileImageUrl", "Title", "CreatedAt")
SELECT 'Bora', 'Yıldız', 'Sahne ve etkinlik organizasyonu uzmanı', 'default_profile.png', 'Etkinlik Organizatörü', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public."Speakers" WHERE "Name" = 'Bora' AND "Surname" = 'Yıldız');

COMMIT;

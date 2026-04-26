-- seed_event_images.sql
-- Fills Events.Image for already-existing rows (idempotent).
-- Run this after adding the "Image" column.

begin;

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Yapay Zeka Zirvesi 2025' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Kampüs Rock Festivali' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Doğa Yürüyüşü ve Kamp' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'CV Hazırlama ve Mülakat Teknikleri' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1503038411-156ec17c2f9f?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Girişimcilik ve Startup Günü' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Tasarım Thinking Workshop' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
where "Title" = 'Kampüs Fotoğrafçılık Buluşması' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1672166765742-6f32f9865902?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
where "Title" = 'Yılbaşı Konseri 2025' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Kodlama Bootcamp - Başlangıç' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Doğuş Game Jam 2026' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Açık Mikrofon Gecesi' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Sosyal Sorumluluk Projesi Tanıtımı' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'UX Tasarım Sergisi' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Python ile Veri Bilimi' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Kariyer Zirvesi - Yazılım' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Blockchain ve Kripto Paneli' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Film Gösterimi: Belgesel Akşamı' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Siber Güvenlik CTF' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Mobil Uygulama Geliştirme' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1502767089025-6572583495b0?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Kampüs Pazarı' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Mentorluk Günü' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1581093588401-3a5f5b3b5a5b?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Halkla İlişkiler Workshop' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1495433324511-bf8e92934d90?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Fotoğraf Sergisi Açılışı' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1515165562835-c3b3f4d5c9e6?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Kariyer Günleri: Staj Fırsatları' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Topluluk Tanışma Gecesi' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Yaz Okulu Tanıtımı' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Startuplar İçin Hukuk' and ("Image" is null or "Image" = '');

update public."Events" set "Image" = 'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&q=80&w=1200'
where "Title" = 'Müzik Atölyesi: DJ Deneyimi' and ("Image" is null or "Image" = '');

commit;

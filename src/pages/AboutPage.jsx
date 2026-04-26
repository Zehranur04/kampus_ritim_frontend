// src/pages/AboutPage.jsx
import React from "react";

const AboutPage = () => {
  return (
    <div className="about-shell">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="tag">Hakkımızda</span>
          <h1>Kampüs Ritmi ile kampüs hayatını tek yerden yönet.</h1>
          <p>
            Kampüs Ritmi, öğrencilerin kulüpleri, etkinlikleri ve kampüs
            topluluklarını daha kolay keşfetmesi için tasarlanmış modern bir
            etkinlik takip platformudur. Hem kulüplerin hem öğrencilerin
            hayatını kolaylaştırmayı amaçlıyoruz.
          </p>

          <div className="about-hero-meta">
            <div>
              <h3>2025</h3>
              <p>Projenin başlangıç yılı</p>
            </div>
            <div>
              <h3>+10</h3>
              <p>Hedeflenen üniversite</p>
            </div>
            <div>
              <h3>+1000</h3>
              <p>Etkinlik hedefi</p>
            </div>
          </div>
        </div>

        <div className="about-hero-card">
          <h2>Neden bu projeyi yaptık?</h2>
          <p>
            Farklı WhatsApp grupları, afişler, Instagram postları… 
            Kampüs hayatı çok dağınık. Kampüs Ritmi, tüm bu bilgi
            karmaşasını tek bir modern platformda birleştirmeyi hedefliyor.
          </p>
          <ul>
            <li>🎯 Etkinlik keşfini kolaylaştırmak</li>
            <li>🤝 Kulüpler ve öğrenciler arasında köprü olmak</li>
            <li>📊 Katılım verilerini görünür hale getirmek</li>
          </ul>
        </div>
      </section>

      {/* Misyon / Vizyon */}
      <section className="about-section grid-2">
        <div className="about-card">
          <h2>Misyonumuz</h2>
          <p>
            Öğrencilerin kampüs yaşamına daha aktif katılmasını sağlayan,
            erişilebilir ve kullanıcı dostu bir dijital ortam yaratmak.
          </p>
          <p>
            Hem yeni başlayan öğrenciler hem de aktif kulüp üyeleri için
            basit, anlaşılır ve hızlı bir deneyim sunmak istiyoruz.
          </p>
        </div>

        <div className="about-card">
          <h2>Vizyonumuz</h2>
          <p>
            Türkiye&apos;deki ve sonrasında Avrupa&apos;daki üniversiteler
            arasında kullanılan, standart bir kampüs etkinlik platformu
            haline gelmek.
          </p>
          <p>
            Uzun vadede, öğrencilere kişiselleştirilmiş etkinlik önerileri
            sunan, veri odaklı bir kampüs asistanı olmak istiyoruz.
          </p>
        </div>
      </section>

      {/* Özellikler */}
      <section className="about-section">
        <h2>Kampüs Ritmi neler sunacak?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Akıllı Etkinlik Keşfi</h3>
            <p>
              İlgi alanlarına, bölüme ve kulüplere göre filtrelenmiş
              etkinlik önerileri.
            </p>
          </div>
          <div className="feature-card">
            <h3>Kulüp Yönetimi</h3>
            <p>
              Kulüpler için etkinlik oluşturma, katılımcı takibi ve duyuru
              yönetimi paneli.
            </p>
          </div>
          <div className="feature-card">
            <h3>Kişisel Takvim</h3>
            <p>
              Katıldığın etkinlikleri kendi profilinde ve takvim görünümünde
              toplu halde görebilme.
            </p>
          </div>
          <div className="feature-card">
            <h3>Geri Bildirim & Analitik</h3>
            <p>
              Etkinlik sonrası anketler, katılım istatistikleri ve kulüpler için
              öngörüler.
            </p>
          </div>
        </div>
      </section>

            {/* Team */}
      <section className="about-section">
        <h2>Ekibimiz</h2>
        <p className="about-section-sub">
          Kampüs Ritmi, farklı alanlardan gelen öğrencilerin ortak çalışmasıyla geliştirilmiş bir projedir.
        </p>

        <div className="team-grid">
          {/* Üye 1 */}
          <div className="team-card">
            <div className="avatar">Z</div>
            <div className="team-info">
              <h3>Zehranur Burmaoğlu</h3>
              <p className="role">Backend & DATABASE</p>
              <p className="desc">
                .NET backend, veritabanı tasarımında görev aldı.
              </p>
              <div className="chip-row">
                <span className="chip">.NET</span>
                <span className="chip">SQL</span>
                <span className="chip">Entity Framework</span>
              </div>
            </div>
          </div>

          {/* Üye 2 */}
          <div className="team-card">
            <div className="avatar">S</div>
            <div className="team-info">
              <h3>Sude Dereli</h3>
              <p className="role">Backend & API</p>
              <p className="desc">
                .NET backend, REST API entegrasyonlarının geliştirilmesinde görev aldı.
              </p>
              <div className="chip-row">
                <span className="chip">.NET</span>
                <span className="chip">SQL</span>
                <span className="chip">API</span>
              </div>
            </div>
          </div>

          {/* Üye 3 */}
          <div className="team-card">
            <div className="avatar">O</div>
            <div className="team-info">
              <h3>Onur Kaya</h3>
              <p className="role">BACKEND & AI</p>
              <p className="desc">
                .NET backend, AI entegrasyonları ve veri analitiği üzerinde çalıştı.
              </p>
              <div className="chip-row">
                <span className="chip">.NET</span>
                <span className="chip">SQL</span>
                <span className="chip">AI</span>
              </div>
            </div>
          </div>

            {/* Üye 4 */}
          <div className="team-card">
            <div className="avatar">B</div>
            <div className="team-info">
              <h3>Bilge Erol</h3>
              <p className="role">Frontend & UX</p>
              <p className="desc">
                React frontend geliştirme, UI/UX tasarımı ve kullanıcı deneyimi optimizasyonunda görev aldı.
              </p>
              <div className="chip-row">
                <span className="chip">React</span>
                <span className="chip">Tailwind / CSS</span>
                <span className="chip">UI/UX</span>
              </div>
            </div>
          </div>

          {/* Üye 5 */}
          <div className="team-card">
            <div className="avatar">Ö</div>
            <div className="team-info">
              <h3>Ömer Can Ünlü</h3>
              <p className="role">Frontend & UX</p>
              <p className="desc">
                React frontend geliştirme, UI/UX tasarımı ve kullanıcı deneyimi optimizasyonunda görev aldı.
              </p>
              <div className="chip-row">
                <span className="chip">React</span>
                <span className="chip">Tailwind / CSS</span>
                <span className="chip">UI/UX</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Zaman Çizelgesi */}
      <section className="about-section">
        <h2>Kısa zaman çizelgesi</h2>
        <div className="timeline">
          <div className="timeline-item">
            <span className="dot" />
            <div className="timeline-content">
              <h3>Fikir & Analiz</h3>
              <p>
                Öğrencilerin gerçek problemleri üzerinden ihtiyaç analizi,
                personelar ve senaryolar oluşturuldu.
              </p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="dot" />
            <div className="timeline-content">
              <h3>Tasarım & Prototip</h3>
              <p>
                Modern, karanlık temalı bir arayüz tasarımı ve temel akışlar
                için prototip hazırlandı.
              </p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="dot" />
            <div className="timeline-content">
              <h3>Geliştirme</h3>
              <p>
                .NET backend ve React frontend ile kimlik doğrulama, kulüp
                yönetimi ve etkinlik listeleme modülleri geliştirildi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* İletişim / Son blok */}
      <section className="about-section about-final">
        <div>
          <h2>Geri bildirimin bizim için önemli</h2>
          <p>
            Kampüs Ritmi şu an geliştirme aşamasında. Kullanıcı deneyimi,
            eksik gördüğün özellikler veya fikirlerin için bize mutlaka
            yazabilirsin.
          </p>
        </div>
        <div className="about-final-box">
          <p>Proje ekibiyle iletişime geçmek için:</p>
          <ul>
            <li>📧 E-posta: <span>info@kampusritmi.com</span></li>
            <li>🐙 GitHub repo: <span>github.com/kampus-etkinlik-takip-sistemi-web/kampus-ritmi</span></li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

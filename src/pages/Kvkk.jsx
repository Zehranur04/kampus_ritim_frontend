import React from "react";

export default function Kvkk() {
  return (
    <div className="static-page">
      <div className="container">
        <div className="static-card">
          <header className="static-header">
            <div>
              <h1>KVKK Aydınlatma Metni</h1>
              <p className="static-subtitle">
                6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında bilgilendirme (geçici metin).
              </p>
            </div>
          </header>

          <div className="static-body">
            <h2>Veri Sorumlusu</h2>
            <p>
              Kampüs Ritmi (demo proje) – Bu metin, proje sunumu için örnek içeriktir ve hukuki danışmanlık yerine geçmez.
            </p>

            <h2>İşlenen Kişisel Veriler</h2>
            <ul>
              <li>Kimlik ve iletişim bilgileri (ad-soyad, e-posta)</li>
              <li>Profil bilgileri (bölüm, sınıf, ilgi alanları)</li>
              <li>Kullanım ve işlem kayıtları (sayfa görüntüleme, katılım işlemleri)</li>
            </ul>

            <h2>İşleme Amaçları</h2>
            <ul>
              <li>Hizmetlerin sunulması ve geliştirilmesi</li>
              <li>Güvenlik ve suistimal önleme</li>
              <li>Destek taleplerinin yanıtlanması</li>
            </ul>

            <h2>Hakların</h2>
            <p>
              KVKK kapsamında; bilgi talep etme, düzeltme, silme, itiraz gibi haklara sahipsin. Talepler için İletişim sayfasını kullanabilirsin.
            </p>
          </div>

          <div className="static-footer">
            <a className="static-btn" href="/contact">İletişime Geç</a>
          </div>
        </div>
      </div>
    </div>
  );
}

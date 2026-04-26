import React from "react";

export default function Help() {
  return (
    <div className="static-page">
      <div className="container">
        <div className="static-card">
          <header className="static-header">
            <div>
              <h1>Yardım Merkezi</h1>
              <p className="static-subtitle">
                Hızlı başlangıç, rehberler ve sık karşılaşılan işlemler. İçerikler şimdilik geçicidir.
              </p>
            </div>
          </header>

          <div className="static-body">
            <h2>Hızlı Başlangıç</h2>
            <ul>
              <li>Hesap oluştur: Kayıt sayfasından profilini tamamla.</li>
              <li>Etkinlikleri keşfet: Etkinlikler sayfasından kategoriye göre göz at.</li>
              <li>Kulüpleri takip et: Kulüp sayfasından kulüpleri incele ve katıl.</li>
              <li>Randevu al: Uygun hocaların takviminden saat seç (varsa).</li>
            </ul>

            <h2>Sık Yapılan İşlemler</h2>
            <div className="static-kv">
              <div className="static-kv-row">
                <strong>Şifremi unuttum</strong>
                <span>Demo sürümde şifre sıfırlama akışı sınırlı olabilir. İletişim sayfasından destek alabilirsin.</span>
              </div>
              <div className="static-kv-row">
                <strong>Bildirim ayarları</strong>
                <span>Bildirimler sayfasından duyuruları takip edebilirsin. Ayarlar bölümü geliştiriliyor olabilir.</span>
              </div>
              <div className="static-kv-row">
                <strong>Etkinlik iptali/değişikliği</strong>
                <span>Etkinliği düzenleyen kulüp/organizasyon tarafından güncellenir. Güncel bilgiler etkinlik detayında yer alır.</span>
              </div>
            </div>

            <h2>SSS</h2>
            <p>En çok sorulan sorular için SSS sayfasına göz atabilirsin.</p>
          </div>

          <div className="static-footer">
            <a className="static-btn" href="/faq">
              SSS’ye Git
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

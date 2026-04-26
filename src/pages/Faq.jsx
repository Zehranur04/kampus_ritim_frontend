import React from "react";

export default function Faq() {
  const faqs = [
    {
      q: "Kampüs Ritmi nedir?",
      a: "Kampüs Ritmi; etkinlikleri keşfetmen, kulüpleri takip etmen ve kampüs yaşamını tek yerden yönetmen için tasarlanmış bir platformdur (şimdilik demo içerik).",
    },
    {
      q: "Etkinliklere nasıl katılırım?",
      a: "Etkinlik detay sayfasında yer alan katılım/rezervasyon aksiyonları üzerinden ilerleyebilirsin. Bazı etkinlikler kayıt gerektirebilir.",
    },
    {
      q: "Kulüplere nasıl üye olurum?",
      a: "Kulüp detay sayfasından üyelik talebi/katıl butonu ile kulübe katılabilirsin. Kulüp yöneticileri talebini onaylayabilir.",
    },
    {
      q: "Bildirimleri nereden yönetebilirim?",
      a: "Bildirimler sayfasından yeni duyuruları ve sistem mesajlarını görebilirsin. (Özellikler geliştirme aşamasında olabilir.)",
    },
    {
      q: "Hesabımı silebilir miyim?",
      a: "Şimdilik demo sürümde hesap silme ekranı bulunmuyor. Talebin için İletişim sayfasından bize yazabilirsin.",
    },
  ];

  return (
    <div className="static-page">
      <div className="container">
        <div className="static-card">
          <header className="static-header">
            <div>
              <h1>SSS (Sıkça Sorulan Sorular)</h1>
              <p className="static-subtitle">
                En çok gelen sorular ve kısa cevaplar. Metinler geçici demo içeriğidir.
              </p>
            </div>
          </header>

          <div className="static-body">
            {faqs.map((item) => (
              <div key={item.q} style={{ padding: "0.75rem 0" }}>
                <h2 style={{ marginTop: 0 }}>{item.q}</h2>
                <p style={{ margin: "0.35rem 0 0" }}>{item.a}</p>
              </div>
            ))}

            <h2>Daha fazla yardıma mı ihtiyacın var?</h2>
            <p>
              Yardım Merkezi sayfasını ziyaret edebilir veya İletişim sayfasından bize ulaşabilirsin.
            </p>
          </div>

          <div className="static-footer">
            <a className="static-btn" href="/help">
              Yardım Merkezine Git
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

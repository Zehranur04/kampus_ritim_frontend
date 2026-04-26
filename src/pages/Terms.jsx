import React from "react";
import { useNavigate } from "react-router-dom";
import "./legal.css";

export default function Terms() {
  const nav = useNavigate();

  return (
    <div className="legal-overlay" onClick={() => nav(-1)}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <header className="legal-header">
          <h2>Kullanım Koşulları</h2>
          <button className="legal-close" onClick={() => nav(-1)} aria-label="Kapat">✕</button>
        </header>

        <div className="legal-body">
          <p>
            Bu belge uygulamanın kullanım koşullarını içerir. Lütfen kayıt
            olmadan veya hizmetleri kullanmadan önce dikkatlice okuyun. Aşağıda
            örnek metin yer almaktadır; gerçek proje için hukuki metinle
            değiştirin.
          </p>

          <h3>1. Hizmet Tanımı</h3>
          <p>
            Kampüs Ritmi, üniversite etkinliklerini, kulüpleri ve profilleri
            yönetmenizi sağlayan bir platformdur. Kullanıcılar etkinliklere katılabilir,
            kulüplere üye olabilir ve içerik paylaşabilir.
          </p>

          <h3>2. Kullanıcı Sorumlulukları</h3>
          <p>
            Kullanıcılar doğru bilgi sağlamakla, diğer kullanıcıların haklarına
            saygı göstermekle ve yerel yasalara uymakla yükümlüdür.
          </p>

          <h3>3. Veri ve Gizlilik</h3>
          <p>
            Kişisel verilerinizin işlendiği yöntemler için Gizlilik Politikasını
            inceleyin. Bu koşullar Taahhütlerimizi, veri saklama politikalarını ve
            iletişim yönergelerini kapsar.
          </p>
        </div>

        <footer className="legal-footer">
          <button className="btn-next" onClick={() => nav(-1)}>Kapat
          </button>
        </footer>
      </div>
    </div>
  );
}

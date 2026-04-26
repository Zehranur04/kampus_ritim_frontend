import React from "react";
import { useNavigate } from "react-router-dom";
import "./legal.css";

export default function Privacy() {
  const nav = useNavigate();

  return (
    <div className="legal-overlay" onClick={() => nav(-1)}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <header className="legal-header">
          <h2>Gizlilik Politikası</h2>
          <button className="legal-close" onClick={() => nav(-1)} aria-label="Kapat">✕</button>
        </header>

        <div className="legal-body">
          <p>
            Gizlilik politikamız, kişisel verilerinizin nasıl toplandığını,
            işlendiğini ve korunduğunu açıklar. Lütfen devam etmeden önce okuyun.
          </p>

          <h3>Toplanan Veriler</h3>
          <p>
            Kayıt sırasında sağladığınız ad, soyad, e-posta adresi ve profil
            bilgileri toplanır. Ayrıca kullanım bilgileri ve çerezler toplanabilir.
          </p>

          <h3>Veri Kullanımı</h3>
          <p>
            Toplanan veriler hizmetin sağlanması, güvenlik, destek ve
            iyileştirme amaçlarıyla kullanılacaktır. Üçüncü taraflarla paylaşım
            yalnızca hukuki zorunluluk veya hizmet sağlayıcılarla sınırlı olacaktır.
          </p>
        </div>

        <footer className="legal-footer">
          <button className="btn-next" onClick={() => nav(-1)}>Kapat</button>
        </footer>
      </div>
    </div>
  );
}

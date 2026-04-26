import React from "react";

export default function Cookies() {
  return (
    <div className="static-page">
      <div className="container">
        <div className="static-card">
          <header className="static-header">
            <div>
              <h1>Çerez Politikası</h1>
              <p className="static-subtitle">
                Çerezlerin nasıl kullanıldığına dair bilgilendirme (geçici metin).
              </p>
            </div>
          </header>

          <div className="static-body">
            <h2>Çerez nedir?</h2>
            <p>
              Çerezler, web sitesinin tarayıcında küçük veri parçaları saklamasına olanak veren dosyalardır. Demo sürümde sınırlı kullanım olabilir.
            </p>

            <h2>Kullandığımız çerez türleri (örnek)</h2>
            <ul>
              <li>Zorunlu çerezler: Oturum ve güvenlik için</li>
              <li>Tercih çerezleri: Tema/dil gibi tercihlerin hatırlanması için</li>
              <li>Analitik çerezler: Kullanımı anonim olarak anlamak için</li>
            </ul>

            <h2>Kontrol</h2>
            <p>
              Çerezleri tarayıcı ayarlarından silebilir veya engelleyebilirsin. Bazı özellikler düzgün çalışmayabilir.
            </p>
          </div>

          <div className="static-footer">
            <a className="static-btn" href="/privacy">Gizlilik Politikasına Git</a>
          </div>
        </div>
      </div>
    </div>
  );
}

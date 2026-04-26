import React, { useState } from "react";

export default function Feedback() {
  const [form, setForm] = useState({ type: "Öneri", detail: "", email: "" });
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setForm({ type: "Öneri", detail: "", email: "" });
  };

  return (
    <div className="static-page">
      <div className="container">
        <div className="static-card">
          <header className="static-header">
            <div>
              <h1>Geri Bildirim</h1>
              <p className="static-subtitle">
                Kampüs Ritmi’ni geliştirmemize yardımcı ol. Bu ekran geçici demo içeriği kullanır.
              </p>
            </div>
          </header>

          <div className="static-body">
            <h2>Ne tür bir geri bildirim göndermek istiyorsun?</h2>
            <form className="static-form" onSubmit={onSubmit}>
              <select
                className="static-input"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option>Öneri</option>
                <option>Hata Bildirimi</option>
                <option>İçerik Düzeltme</option>
                <option>Diğer</option>
              </select>

              <textarea
                className="static-textarea"
                placeholder="Detaylar (ne oldu / ne bekliyordun?)"
                value={form.detail}
                onChange={(e) => setForm((p) => ({ ...p, detail: e.target.value }))}
                required
              />

              <input
                className="static-input"
                type="email"
                placeholder="Geri dönüş için e-posta (opsiyonel)"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />

              <button className="static-btn" type="submit" style={{ justifySelf: "end" }}>
                {sent ? "Alındı (demo)" : "Gönder"}
              </button>
            </form>

            <h2>Not</h2>
            <p>
              Bu form şu an gerçek bir API’ye bağlı değil. İstersen sonra backend’e bağlayıp kayıt altına alabiliriz.
            </p>
          </div>

          <div className="static-footer">
            <a className="static-btn" href="/contact">
              İletişim Sayfası
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

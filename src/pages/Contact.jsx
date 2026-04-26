import React, { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="static-page">
      <div className="container">
        <div className="static-card">
          <header className="static-header">
            <div>
              <h1>İletişim</h1>
              <p className="static-subtitle">
                Görüş, öneri veya hata bildirimi için bize yaz. Form şimdilik demo amaçlıdır.
              </p>
            </div>
          </header>

          <div className="static-body">
            <h2>İletişim Bilgileri</h2>
            <div className="static-kv">
              <div className="static-kv-row">
                <strong>E-posta</strong>
                <span>info@kampusritmi.com</span>
              </div>
              <div className="static-kv-row">
                <strong>Telefon</strong>
                <span>+90 (212) 000 00 00 (geçici)</span>
              </div>
              <div className="static-kv-row">
                <strong>Adres</strong>
                <span>İstanbul / Türkiye (geçici)</span>
              </div>
              <div className="static-kv-row">
                <strong>GitHub</strong>
                <span>github.com/Zehranur04/kampus-etkinlik-takip-sistemi-web</span>
              </div>
            </div>

            <h2>Bize Mesaj Gönder</h2>
            <form className="static-form" onSubmit={onSubmit}>
              <input
                className="static-input"
                name="name"
                placeholder="Ad Soyad"
                value={form.name}
                onChange={onChange}
                required
              />
              <input
                className="static-input"
                type="email"
                name="email"
                placeholder="E-posta"
                value={form.email}
                onChange={onChange}
                required
              />
              <input
                className="static-input"
                name="subject"
                placeholder="Konu"
                value={form.subject}
                onChange={onChange}
                required
              />
              <textarea
                className="static-textarea"
                name="message"
                placeholder="Mesajın"
                value={form.message}
                onChange={onChange}
                required
              />

              <button className="static-btn" type="submit" style={{ justifySelf: "end" }}>
                {sent ? "Gönderildi (demo)" : "Gönder"}
              </button>
            </form>
          </div>

          <div className="static-footer">
            <a className="static-btn" href="/feedback">
              Geri Bildirim Sayfası
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

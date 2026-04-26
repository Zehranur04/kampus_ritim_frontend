import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./footer.css";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: "Ana Sayfa", to: "/" },
      { label: "Etkinlikler", to: "/events" },
      { label: "Kulüpler", to: "/clubs" },
      { label: "Hakkımızda", to: "/about" },
    ],
    support: [
      { label: "Yardım Merkezi", to: "/help" },
      { label: "SSS", to: "/faq" },
      { label: "İletişim", to: "/contact" },
      { label: "Geri Bildirim", to: "/feedback" },
    ],
    legal: [
      { label: "Gizlilik Politikası", to: "/privacy" },
      { label: "Kullanım Koşulları", to: "/terms" },
      { label: "KVKK", to: "/kvkk" },
      { label: "Çerez Politikası", to: "/cookies" },
    ],
  };

  const socialLinks = [
    {
      name: "Instagram",
      url: "https://instagram.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      name: "Twitter",
      url: "https://twitter.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 5.92c-.7.31-1.46.52-2.26.61a3.96 3.96 0 0 0-6.76 3.6A11.25 11.25 0 0 1 3.15 4.9a4 4 0 0 0-.54 2 3.96 3.96 0 0 0 1.77 3.3c-.6 0-1.16-.18-1.65-.44v.04c0 1.9 1.35 3.5 3.14 3.86-.33.09-.67.14-1.02.14-.25 0-.5-.02-.74-.07.5 1.6 2 2.76 3.76 2.8A8 8 0 0 1 2 19.54 11.3 11.3 0 0 0 8.29 21c7.55 0 11.69-6.26 11.69-11.69v-.53c.8-.6 1.5-1.35 2-2.2-.72.32-1.5.54-2.3.63z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      url: "https://linkedin.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.98 3.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM0 8h5v13H0zM8 8h5v2h.08c.7-1.2 2.4-2 4.92-2 5.26 0 6 3.5 6 8V21h-5v-6c0-1.5 0-3.5-2.1-3.5C13.2 11.5 13 13.5 13 15.5V21H8V8z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      url: "https://youtube.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="3" />
          <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      url: "https://github.com/Zehranur04/kampus-etkinlik-takip-sistemi-web",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.31.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4 1.02.01 2.05.14 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.19.69.8.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="footer">
      {/* Top decoration */}
      <div className="footer-decoration">
        <div className="footer-wave">
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path
              d="M0,50 C360,100 720,0 1080,50 C1260,75 1380,60 1440,50 L1440,100 L0,100 Z"
              fill="var(--surface)"
            />
          </svg>
        </div>
      </div>

      <div className="footer-main">
        <div className="container footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img
                src="/kr_logo-256.png"
                srcSet="/kr_logo-256.png 1x, /kr_logo-512.png 2x"
                alt="Kampüs Ritmi"
                decoding="async"
              />
              <div className="logo-text">
                <span className="logo-name">Kampüs Ritmi</span>
                <span className="logo-tagline">Doğuş Üniversitesi</span>
              </div>
            </Link>
            <p className="footer-description">
              Üniversite kampüsündeki tüm etkinlikleri keşfet, kulüplere katıl 
              ve kampüs hayatını tek platformdan yönet.
            </p>

            {/* Newsletter */}
            <div className="footer-newsletter">
              <h4>Bültenimize Abone Ol</h4>
              <p>Yeni etkinliklerden ve duyurulardan haberdar ol. </p>
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <div className="newsletter-input-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    placeholder="E-posta adresin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="newsletter-btn">
                  {isSubscribed ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Abone Olundu! </span>
                    </>
                  ) : (
                    <>
                      <span>Abone Ol</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Links Columns */}
          <div className="footer-links-group">
            <div className="footer-links-column">
              <h4>Platform</h4>
              <ul>
                {footerLinks.platform.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links-column">
              <h4>Destek</h4>
              <ul>
                {footerLinks.support.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links-column">
              <h4>Yasal</h4>
              <ul>
                {footerLinks.legal.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <div className="footer-copyright">
            <p>© {currentYear} Kampüs Ritmi. Tüm hakları saklıdır. </p>
          </div>

          <div className="footer-social">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Background elements */}
      <div className="footer-bg-elements">
        <div className="footer-glow glow-1" />
        <div className="footer-glow glow-2" />
      </div>
    </footer>
  );
}
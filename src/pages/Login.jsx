import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { sendMagicLink } from "../lib/auth";
import { isAllowedSchoolEmail } from "../utils/validators";
import "./auth.css";

export default function Login() {
  const nav = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!isAllowedSchoolEmail(email)) errors.email = "Lütfen okul e-postanızı kullanın. ";
    if (! password) errors.password = "Şifre gereklidir.";
    setErr(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    const { data, error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      let msg = error.message || "Giriş başarısız.";
      // Map common backend English message to Turkish for clarity
      const lower = msg.toLowerCase();
      if (lower.includes("invalid login credentials") || (lower.includes("invalid") && lower.includes("credentials"))) {
        msg = "Şifre veya Eposta yanlış";
      }
      setErr({ form: msg });
      if (msg.toLowerCase().includes("email not confirmed") || msg.toLowerCase().includes("confirm")) {
        setResendSent(false);
      }
      return;
    }
    nav("/");
  };

  const handleResend = async () => {
    setResendSent(false);
    try {
      const { data, error } = await sendMagicLink(email);
      if (error) {
        setErr({ form: error.message || "Onay maili gönderilemedi." });
        return;
      }
      setResendSent(true);
      setErr({ form: "Onay / giriş linki e-posta adresinize gönderildi." });
    } catch (e) {
      setErr({ form: "İşlem sırasında hata oluştu." });
    }
  };

  return (
    <main className="auth-page">
      {/* Background */}
      <div className="auth-bg">
        <div className="auth-bg-gradient" />
        <div className="auth-bg-grid" />
        <div className="auth-blob blob-1" />
        <div className="auth-blob blob-2" />
        <div className="auth-blob blob-3" />
      </div>

      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <Link to="/" className="auth-logo">
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

          <div className="branding-content">
            <h1>
              Kampüs hayatına
              <span className="text-gradient"> hoş geldin! </span>
            </h1>
            <p>
              Etkinlikleri keşfet, kulüplere katıl ve üniversite deneyimini 
              bir üst seviyeye taşı. 
            </p>

            <div className="branding-features">
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Tüm kampüs etkinliklerini takip et</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Kulüplere kolayca üye ol</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Yeni insanlarla tanış</span>
              </div>
            </div>
          </div>

          <div className="branding-footer">
            <p>Güvenli giriş · Okul e-postası ile</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-wrapper">
          <form className="auth-form" onSubmit={submit}>
            <div className="form-header">
              <h2>Giriş Yap</h2>
              <p>Hesabına giriş yaparak devam et</p>
            </div>

            {/* Error Message */}
            {err.form && (
              <div className="form-alert form-alert-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span>{err.form}</span>
                </div>
            )}

            {/* Resend Button */}
            {err.form && (err.form.toLowerCase().includes("confirm") || err.form.toLowerCase().includes("email not confirmed")) && (
              <button
                type="button"
                className="btn-resend"
                onClick={handleResend}
                disabled={resendSent}
              >
                {resendSent ?  "✓ Tekrar gönderildi" : "Onay linkini tekrar gönder"}
              </button>
            )}

            {/* Email Field */}
            <div className={`form-field ${err.email ?  "has-error" : ""}`}>
              <label>Okul E-postası</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  placeholder="numara@dogus.edu.tr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {err.email && <span className="field-error">{err.email}</span>}
            </div>

            {/* Password Field */}
            <div className={`form-field ${err.password ? "has-error" : ""}`}>
              <div className="field-header">
                <label>Şifre</label>
                <Link to="/forgot-password" className="forgot-link">
                  Şifremi unuttum
                </Link>
              </div>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPwd(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {err.password && <span className="field-error">{err.password}</span>}
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-action btn-login" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner" />
                  <span className="btn-label">Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <span className="btn-label">Giriş Yap</span>
                  <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            {/* Switch to Register */}
            <p className="form-switch">
              Hesabın yok mu? {" "}
              <Link to="/register">Ücretsiz Kayıt Ol</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../lib/auth";
import { isAllowedSchoolEmail } from "../utils/validators";
import "./auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errors = {};
    
    if (!email.trim()) {
      errors.email = "E-posta adresi gereklidir.";
    } else if (!isAllowedSchoolEmail(email)) {
      errors.email = "Lütfen okul e-postanızı kullanın.";
    }
    
    setErr(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    setErr({});
    
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await resetPassword(email, redirectUrl);
      
      if (error) {
        setErr({ form: error.message || "Şifre sıfırlama linki gönderilemedi." });
      } else {
        setSuccess(true);
      }
    } catch (e) {
      setErr({ form: "İşlem sırasında hata oluştu." });
    } finally {
      setLoading(false);
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
              Şifreni mi
              <span className="text-gradient"> unuttun? </span>
            </h1>
            <p>
              Endişelenme! E-posta adresini gir, sana şifre sıfırlama 
              linki gönderelim.
            </p>

            <div className="branding-features">
              <div className="feature-item">
                <div className="feature-icon">📧</div>
                <span>Okul e-postanı gir</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔗</div>
                <span>Sıfırlama linkini al</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔐</div>
                <span>Yeni şifreni belirle</span>
              </div>
            </div>
          </div>

          <div className="branding-footer">
            <p>Güvenli şifre sıfırlama · Okul e-postası ile</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-wrapper">
          <form className="auth-form" onSubmit={submit}>
            <div className="form-header">
              <h2>Şifremi Unuttum</h2>
              <p>Şifre sıfırlama linkini e-postana gönderelim</p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="form-alert form-alert-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div>
                  <strong>E-posta gönderildi!</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.9em", opacity: 0.9 }}>
                    Şifre sıfırlama linki <strong>{email}</strong> adresine gönderildi. 
                    Lütfen gelen kutunu kontrol et.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {err.form && !success && (
              <div className="form-alert form-alert-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{err.form}</span>
              </div>
            )}

            {!success && (
              <>
                {/* Email Field */}
                <div className={`form-field ${err.email ? "has-error" : ""}`}>
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

                {/* Submit Button */}
                <button type="submit" className="btn-action btn-login" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="btn-spinner" />
                      <span className="btn-label">Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-label">Sıfırlama Linki Gönder</span>
                      <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Back to Login Link */}
            <p className="form-switch">
              Şifreni hatırladın mı?{" "}
              <Link to="/login">Giriş Yap</Link>
            </p>

            {/* Register Link */}
            <p className="form-switch" style={{ marginTop: "0.5rem" }}>
              Hesabın yok mu?{" "}
              <Link to="/register">Ücretsiz Kayıt Ol</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

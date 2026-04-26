import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { isAllowedSchoolEmail, strongPassword } from "../utils/validators";


const FACULTIES = {
  "Mühendislik Fakültesi": [
    "Bilgisayar Mühendisliği (İngilizce)",
    "Yazılım Mühendisliği",
    "Endüstri Mühendisliği (Türkçe)",
    "Endüstri Mühendisliği (İngilizce)",
    "Elektrik-Elektronik Mühendisliği",
    "Makine Mühendisliği (Türkçe)",
    "Makine Mühendisliği (İngilizce)",
    "İnşaat Mühendisliği",
  ],
  "İktisadi ve İdari Bilimler Fakültesi": [
    "İşletme (Türkçe)",
    "İşletme (İngilizce)",
    "Ekonomi (Türkçe)",
    "Ekonomi (İngilizce)",
    "Siyaset Bilimi ve Kamu Yönetimi",
    "Uluslararası İlişkiler",
    "Uluslararası Ticaret ve İşletmecilik",
    "Yönetim Bilişim Sistemleri",
  ],
  "Fen-Edebiyat Fakültesi": [
    "İletişim Bilimleri",
    "İngiliz Dili ve Edebiyatı",
    "İngilizce Mütercim-Tercümanlık",
    "Psikoloji",
    "Psikoloji (İngilizce)",
    "Sosyoloji",
    "Türk Dili ve Edebiyatı",
  ],
  "Hukuk Fakültesi": ["Hukuk"],
  "Güzel Sanatlar ve Tasarım Fakültesi": [
    "Mimarlık",
    "İç Mimarlık",
    "Görsel İletişim Tasarımı",
    "Grafik Tasarımı",
    "Endüstri Ürünleri Tasarımı",
    "Dijital Oyun Tasarımı",
    "Tekstil ve Moda Tasarımı",
    "Gastronomi ve Mutfak Sanatları",
    "Oyunculuk",
  ],
  "Sağlık Bilimleri Fakültesi": ["Hemşirelik"],
};

const STEPS = [
  { id: 1, title: "Kişisel Bilgiler", icon: "👤" },
  { id: 2, title: "Akademik Bilgiler", icon: "🎓" },
  { id: 3, title: "Güvenlik", icon: "🔐" },
];

export default function Register() {
  const nav = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
    faculty: "",
    department: "",
    year: "",
  });

  const [err, setErr] = useState({});

  const up = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleFacultyChange = (e) => {
    const faculty = e.target.value;
    setForm((s) => ({ ... s, faculty, department: "" }));
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!form.firstName.trim()) errors.firstName = "Ad zorunludur.";
      if (!form.lastName.trim()) errors. lastName = "Soyad zorunludur.";
      if (!isAllowedSchoolEmail(form.email))
        errors.email = "Sadece okul e-postası kabul edilir.";
    }

    if (step === 2) {
      if (!form.faculty.trim()) errors. faculty = "Lütfen fakülte seçin. ";
      if (! form.department.trim()) errors.department = "Lütfen bölüm seçin. ";
      if (!form.year.toString().trim()) errors.year = "Lütfen sınıf seçin.";
    }

    if (step === 3) {
      if (!strongPassword(form.password))
        errors.password = "En az 8 karakter, harf ve rakam içermeli.";
      if (form.password !== form.confirm)
        errors.confirm = "Şifreler eşleşmiyor.";
    }

    setErr(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1,3));
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1,1));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (! validateStep(3)) return;

    setLoading(true);
    const { data, error } = await register({
      firstName: form.firstName. trim(),
      lastName: form.lastName. trim(),
      email: form.email. trim(),
      password: form.password,
      faculty: form.faculty.trim(),
      department: form.department.trim(),
      year: form.year.toString(). trim(),
    });

    setLoading(false);

    if (error) {
      setErr({ form: error.message || "Kayıt başarısız." });
      return;
    }
    nav("/");
  };

  const facultyKeys = Object.keys(FACULTIES);
  const departmentOptions = form.faculty ?  FACULTIES[form.faculty] : [];

  // Password strength indicator
  const getPasswordStrength = () => {
    const pwd = form.password;
    if (! pwd) return { level: 0, text: "", color: "" };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, text: "Zayıf", color: "#ef4444" };
    if (score === 2) return { level: 2, text: "Orta", color: "#f59e0b" };
    if (score === 3) return { level: 3, text: "İyi", color: "#22d3ee" };
    return { level: 4, text: "Güçlü", color: "#10b981" };
  };

  const passwordStrength = getPasswordStrength();

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
              Kampüse
              <span className="text-gradient"> katıl! </span>
            </h1>
            <p>
              Hesabını oluştur, kulüplere katıl, etkinlikleri keşfet ve 
              üniversite hayatını dolu dolu yaşa. 
            </p>

            <div className="branding-features">
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Ücretsiz hesap oluştur</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Okul e-postası ile güvenli kayıt</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Anında erişim</span>
              </div>
            </div>
          </div>

          <div className="branding-footer">
            <p>Güvenli kayıt · Sadece okul e-postası</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-wrapper">
          <form className="auth-form auth-form-register" onSubmit={submit}>
            <div className="form-header">
              <h2>Hesap Oluştur</h2>
              <p>Bilgilerini girerek başla</p>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`step-item ${currentStep === step.id ? "active" : ""} ${
                      currentStep > step.id ? "completed" : ""
                    }`}
                    onClick={() => currentStep > step.id && setCurrentStep(step. id)}
                  >
                    <div className="step-circle">
                      {currentStep > step.id ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span>{step.icon}</span>
                      )}
                    </div>
                    <span className="step-title">{step.title}</span>
                  </div>
                  {index < STEPS.length - 1 && <div className="step-line" />}
                </React.Fragment>
              ))}
            </div>

            {/* Error Message */}
            {err.form && (
              <div className="form-alert form-alert-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h. 01" />
                </svg>
                <span>{err. form}</span>
              </div>
            )}

            {/* Step 1: Personal Info */}
            <div className={`form-step ${currentStep === 1 ? "active" : ""}`}>
              <div className="form-row">
                <div className={`form-field ${err.firstName ? "has-error" : ""}`}>
                  <label>Ad</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Adınız"
                      value={form.firstName}
                      onChange={up("firstName")}
                    />
                  </div>
                  {err.firstName && <span className="field-error">{err.firstName}</span>}
                </div>

                <div className={`form-field ${err.lastName ? "has-error" : ""}`}>
                  <label>Soyad</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Soyadınız"
                      value={form.lastName}
                      onChange={up("lastName")}
                    />
                  </div>
                  {err.lastName && <span className="field-error">{err.lastName}</span>}
                </div>
              </div>

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
                    value={form.email}
                    onChange={up("email")}
                    autoComplete="email"
                  />
                </div>
                {err.email && <span className="field-error">{err. email}</span>}
              </div>
            </div>

            {/* Step 2: Academic Info */}
            <div className={`form-step ${currentStep === 2 ? "active" : ""}`}>
              <div className={`form-field ${err.faculty ? "has-error" : ""}`}>
                <label>Fakülte</label>
                <div className="input-wrapper select-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                  <select value={form.faculty} onChange={handleFacultyChange}>
                    <option value="">Fakülte seçin</option>
                    {facultyKeys.map((fak) => (
                      <option key={fak} value={fak}>{fak}</option>
                    ))}
                  </select>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                {err.faculty && <span className="field-error">{err.faculty}</span>}
              </div>

              <div className={`form-field ${err.department ? "has-error" : ""}`}>
                <label>Bölüm</label>
                <div className="input-wrapper select-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19. 5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <select
                    value={form.department}
                    onChange={up("department")}
                    disabled={!form.faculty}
                  >
                    {! form.faculty ?  (
                      <option value="">Önce fakülte seçin</option>
                    ) : (
                      <>
                        <option value="">Bölüm seçin</option>
                        {departmentOptions.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                {err.department && <span className="field-error">{err.department}</span>}
              </div>

              <div className={`form-field ${err. year ? "has-error" : ""}`}>
                <label>Sınıf</label>
                <div className="input-wrapper select-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <select value={form.year} onChange={up("year")}>
                    <option value="">Sınıf seçin</option>
                    <option value="Hazırlık">Hazırlık</option>
                    <option value="1">1. Sınıf</option>
                    <option value="2">2. Sınıf</option>
                    <option value="3">3. Sınıf</option>
                    <option value="4">4. Sınıf</option>
                    <option value="Lisansüstü">Lisansüstü</option>
                  </select>
                  <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                {err.year && <span className="field-error">{err. year}</span>}
              </div>
            </div>

            {/* Step 3: Security */}
            <div className={`form-step ${currentStep === 3 ?  "active" : ""}`}>
              <div className={`form-field ${err.password ? "has-error" : ""}`}>
                <label>Şifre</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="En az 8 karakter"
                    value={form.password}
                    onChange={up("password")}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17. 94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9. 9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
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
                
                {/* Password Strength */}
                {form.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      {[1, 2, 3, 4]. map((level) => (
                        <div
                          key={level}
                          className={`strength-segment ${passwordStrength. level >= level ? "active" : ""}`}
                          style={{ backgroundColor: passwordStrength. level >= level ? passwordStrength.color : "" }}
                        />
                      ))}
                    </div>
                    <span style={{ color: passwordStrength. color }}>{passwordStrength. text}</span>
                  </div>
                )}
                {err.password && <span className="field-error">{err. password}</span>}
              </div>

              <div className={`form-field ${err.confirm ?  "has-error" : ""}`}>
                <label>Şifre Tekrar</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Şifrenizi tekrar girin"
                    value={form.confirm}
                    onChange={up("confirm")}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10. 07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18. 45 0 0 1 5. 06-5.94M9.9 4.24A9.12 9. 12 0 0 1 12 4c7 0 11 8 11 8a18.5 18. 5 0 0 1-2. 16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
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
                {err.confirm && <span className="field-error">{err. confirm}</span>}
              </div>

              {/* Terms */}
              <div className="terms-checkbox">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  <Link to="/terms" state={{ background: location }}>Kullanım Koşullarını</Link> ve{" "}
                  <Link to="/privacy" state={{ background: location }}>Gizlilik Politikasını</Link> kabul ediyorum.
                </label>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button type="button" className="btn-prev" onClick={prevStep}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  <span>Geri</span>
                </button>
              )}

              {currentStep < 3 ?  (
                <button type="button" className="btn-next" onClick={nextStep}>
                  <span>İleri</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button type="submit" className="btn-action btn-register" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Hesap oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Hesap Oluştur</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Switch to Login */}
            <p className="form-switch">
              Zaten hesabın var mı? {" "}
              <Link to="/login">Giriş Yap</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
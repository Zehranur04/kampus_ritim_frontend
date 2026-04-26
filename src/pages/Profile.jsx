import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { profileApi, clubApi, userEventApi } from "../api/apiService";
import supabase from "../config/supabaseClient";
import { getMyAppointments, cancelAppointment } from "../services/appointmentsApi";
import { formatDateKey, formatDisplayDate, extractTimeFromISO } from "../utils/date";
import "../styles/clubModal.css";

const classLevelOptions = [
  { value: "Hazirlik", label: "Hazırlık" },
  { value: "BirinciSinif", label: "1.  Sınıf" },
  { value: "IkinciSinif", label: "2.  Sınıf" },
  { value: "UcuncuSinif", label: "3.  Sınıf" },
  { value: "DorduncuSinif", label: "4.  Sınıf" },
  { value: "Mezun", label: "Mezun" },
];

const tabs = [
  { id: "profile", label: "Profil Bilgileri", icon: "👤" },
  { id: "events", label: "Etkinliklerim", icon: "📅" },
  { id: "clubs", label: "Kulüplerim", icon: "🏛️" },
  { id: "appointments", label: "Randevularım", icon: "📋" },
  { id: "settings", label: "Ayarlar", icon: "⚙️" },
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [myClubs, setMyClubs] = useState([]);
  const [myClubsLoading, setMyClubsLoading] = useState(false);
  const [myClubsError, setMyClubsError] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);
  const [myAppointmentsLoading, setMyAppointmentsLoading] = useState(false);
  const [myAppointmentsError, setMyAppointmentsError] = useState(null);
  const [cancellingIds, setCancellingIds] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsLoading, setMyEventsLoading] = useState(false);
  const [myEventsError, setMyEventsError] = useState(null);

  const fetchMyClubs = async (isMounted = () => true) => {
    // Only try when backend token exists; otherwise keep silent.
    const token = localStorage.getItem('token');
    if (!token) {
      if (isMounted()) {
        setMyClubs([]);
        setMyClubsError(null);
        setMyClubsLoading(false);
      }
      return;
    }

    if (isMounted()) setMyClubsLoading(true);
    try {
      const res = await clubApi.myClubs();
      const data = res.data?.clubs ?? res.data?.Clubs ?? res.data ?? [];
      if (!isMounted()) return;
      setMyClubs(Array.isArray(data) ? data : []);
      setMyClubsError(null);
    } catch (err) {
      console.error("Failed to load my clubs", err);
      if (!isMounted()) return;
      const msg = err?.response?.data?.message || err?.response?.data?.Message || err.message || "Kulüpler alınamadı.";
      setMyClubsError(msg);
    } finally {
      if (isMounted()) setMyClubsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Debug: Check token
    const token = localStorage.getItem('token');
    console.log('Profile component mounted. Token in localStorage:', token ? 'YES' : 'NO');

    const fetchProfile = async () => {
      try {
        const res = await profileApi.get();
        if (!mounted) return;
        console.log('Profile API response:', res);
        const data = res.data?.profile ?? res.data;
        console.log('Profile data extracted:', data);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile', err);
        console.log('Error details:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // initial fetch
    fetchProfile();
    fetchMyClubs(() => mounted);

    // if backend token becomes available after login, re-fetch
    const onTokenUpdated = () => {
      console.log('tokenUpdated event received, refetching profile');
      fetchProfile();
      fetchMyClubs(() => mounted);
    };
    window.addEventListener('tokenUpdated', onTokenUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('tokenUpdated', onTokenUpdated);
    };
  }, []);

  const handleChange = (field, value) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const payload = {
        Name: profile.name ??  profile.Name ?? "",
        Surname: profile.surname ?? profile.Surname ?? "",
        Faculty: profile.faculty ??  profile.Faculty ?? null,
        Department: profile.department ?? profile.Department ?? null,
        ClassLevel: profile.classLevel ??  profile.ClassLevel ??  null,
        Bio: profile.bio ??  profile.Bio ?? "",
        ProfileImageUrl: profile.profileImageUrl ?? profile.ProfileImageUrl ?? null,
      };

      const res = await profileApi. update(payload);
      const updated = res.data?.profile ??  res.data;
      setProfile(updated);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Kaydetme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // Helper functions
  const getValue = (field) => {
    const lower = field.charAt(0).toLowerCase() + field.slice(1);
    return profile?.[lower] ?? profile?.[field] ?? "";
  };

  const getClassLevelLabel = (value) => {
    const found = classLevelOptions.find((c) => c.value === value);
    return found?. label ?? value ??  "Belirtilmemiş";
  };

  // Üye olunan kulüpleri, kulüpler sekmesi açıldığında backend'den çek
  useEffect(() => {
    if (activeTab !== "clubs") return;

    let mounted = true;
    fetchMyClubs(() => mounted);
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  // My Appointments tab
  useEffect(() => {
    if (activeTab !== "appointments") return;
    let mounted = true;

    const fetchMyAppointments = async () => {
      setMyAppointmentsLoading(true);
      try {
        const res = await getMyAppointments();
        // API may return { Appointments: [...] } or an array
        const data = res?.Appointments ?? res?.appointments ?? res ?? [];
        if (!mounted) return;
        setMyAppointments(Array.isArray(data) ? data : []);
        setMyAppointmentsError(null);
      } catch (err) {
        console.error("Failed to load my appointments", err);
        if (!mounted) return;
        const msg = err?.response?.data?.message || err.message || "Randevular alınamadı.";
        setMyAppointmentsError(msg);
      } finally {
        if (mounted) setMyAppointmentsLoading(false);
      }
    };

    fetchMyAppointments();

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  // My Events tab
  useEffect(() => {
    if (activeTab !== "events") return;
    let mounted = true;

    const fetchMyEvents = async () => {
      setMyEventsLoading(true);
      try {
        const res = await userEventApi.mine();
        const ids = res?.data?.eventIds ?? res?.data?.EventIds ?? [];
        const eventIds = Array.isArray(ids) ? ids.filter((x) => x != null).map((x) => Number(x)) : [];

        if (!eventIds.length) {
          if (!mounted) return;
          setMyEvents([]);
          setMyEventsError(null);
          return;
        }

        // Fetch event details from Supabase (Events table)
        // Try "Id" first (project uses PascalCase), fallback to "id"
        let rows = [];
        const r1 = await supabase.from("Events").select("*").in("Id", eventIds);
        if (!r1.error && Array.isArray(r1.data)) rows = r1.data;
        if ((!rows || rows.length === 0) && eventIds.length) {
          const r2 = await supabase.from("Events").select("*").in("id", eventIds);
          if (!r2.error && Array.isArray(r2.data)) rows = r2.data;
        }

        const mapped = (rows || []).map((row) => {
          const id = row.Id ?? row.id;
          const title = row.Title ?? row.title ?? row.name ?? "Etkinlik";
          const ts = row.Time ?? row.time ?? row.Date ?? row.date ?? null;
          const location = row.Location ?? row.location ?? "";
          const imageUrl = row.Image ?? row.imageUrl ?? row.image ?? null;
          let dateText = "";
          if (ts) {
            try {
              dateText = new Date(ts).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
            } catch {
              dateText = String(ts);
            }
          }
          return { id, title, dateText, location, imageUrl };
        });

        // Keep same order as ids when possible
        const byId = new Map(mapped.map((e) => [Number(e.id), e]));
        const ordered = eventIds.map((eid) => byId.get(Number(eid))).filter(Boolean);

        if (!mounted) return;
        setMyEvents(ordered);
        setMyEventsError(null);
      } catch (err) {
        console.error("Failed to load my events", err);
        if (!mounted) return;
        const msg = err?.response?.data?.message || err?.response?.data?.Message || err.message || "Etkinlikler alınamadı.";
        setMyEventsError(msg);
      } finally {
        if (mounted) setMyEventsLoading(false);
      }
    };

    fetchMyEvents();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const handleCancelAppointment = async (appointmentId) => {
    if (!appointmentId) return;
    setCancellingIds((s) => [...s, appointmentId]);
    try {
      await cancelAppointment(appointmentId);
      // remove from list optimistically
      setMyAppointments((prev) => (Array.isArray(prev) ? prev.filter((a) => a.Id !== appointmentId && a.id !== appointmentId) : []));
    } catch (err) {
      console.error("Cancel appointment failed", err);
      alert(err?.response?.data?.message || err.message || "Randevu iptal edilemedi.");
    } finally {
      setCancellingIds((s) => s.filter((id) => id !== appointmentId));
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="loading-spinner" />
          <span>Profil yükleniyor... </span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <div className="error-icon">😕</div>
          <h2>Profil Bulunamadı</h2>
          <p>Profilinize erişirken bir sorun oluştu. </p>
          <Link to="/" className="btn-back-home">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const name = getValue("Name");
  const surname = getValue("Surname");
  const fullName = `${name} ${surname}`. trim() || "İsimsiz Kullanıcı";
  const email = getValue("Email");
  const faculty = getValue("Faculty");
  const department = getValue("Department");
  const bio = getValue("Bio");
  const classLevel = getValue("ClassLevel");
  const profileImageUrl = getValue("ProfileImageUrl");
  const attending = profile.attendingEventsCount ?? profile.AttendingEventsCount ?? 0;
  const profileClubsCount = profile.clubsCount ?? profile.ClubsCount ?? 0;
  const clubsCount = myClubsLoading && myClubs.length === 0 && !profileClubsCount
    ? '...'
    : (myClubs.length || profileClubsCount || 0);

  const initials = `${name.charAt(0)}${surname.charAt(0)}`. toUpperCase() || "KR";

  return (
    <div className="profile-page">
      {/* Background Elements */}
      <div className="profile-bg">
        <div className="profile-bg-gradient" />
        <div className="profile-bg-pattern" />
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="save-toast">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11. 08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14. 01 9 11.01" />
          </svg>
          <span>Profil başarıyla güncellendi!</span>
        </div>
      )}

      <div className="container">
        {/* Profile Header */}
        <header className="profile-header">
          <div className="profile-cover">
            <div className="cover-gradient" />
            <div className="cover-pattern" />
          </div>

          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {profileImageUrl ?  (
                  <img src={profileImageUrl} alt={fullName} />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
                <div className="avatar-status" />
                {isEditing && (
                  <button className="avatar-edit-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="profile-info">
                <h1 className="profile-name">{fullName}</h1>
                <p className="profile-email">{email}</p>
                <div className="profile-badges">
                  {faculty && (
                    <span className="profile-badge badge-faculty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                      </svg>
                      {faculty}
                    </span>
                  )}
                  {classLevel && (
                    <span className="profile-badge badge-class">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {getClassLevelLabel(classLevel)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-actions">
              {! isEditing ?  (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18. 5 2.5a2. 121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Profili Düzenle</span>
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                    İptal
                  </button>
                  <button className="btn-save" onClick={save} disabled={saving}>
                    {saving ?  (
                      <>
                        <div className="btn-spinner" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{attending}</span>
              <span className="stat-label">Katılınan Etkinlik</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">{clubsCount}</span>
              <span className="stat-label">Üye Olunan Kulüp</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">
                <span className="stat-icon">⭐</span>
              </span>
              <span className="stat-label">Aktif Üye</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="profile-content">
            {activeTab === "appointments" && (
              <div className="tab-panel">
                <section className="content-section">
                  <div className="section-header">
                    <h2>
                      <span className="section-icon">📋</span>
                      Randevularım
                    </h2>
                  </div>
                  <div className="section-body">
                    {myAppointmentsLoading ? (
                      <div className="profile-appointments-state">
                        <div className="loading-spinner" />
                        <span>Yükleniyor...</span>
                      </div>
                    ) : myAppointmentsError ? (
                      <div className="profile-appointments-error">
                        {myAppointmentsError}
                      </div>
                    ) : myAppointments.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">📋</div>
                          <h3>Henüz bir randevunuz yok</h3>
                          <p>Randevularınız burada görünecek.</p>
                          <Link to="/appointments" className="btn-explore">
                            Randevu Al
                          </Link>
                        </div>
                    ) : (
                      <ul className="profile-appointments-list">
                        {myAppointments.map((a) => {
                          const id = a.Id ?? a.id;
                          const date = a.Date ?? a.date ?? a.DateTime ?? a.dateTime ?? a.StartTime ?? a.startTime;
                          const dt = date ? new Date(date) : null;
                          return (
                            <li key={id} className="profile-appointment-item">
                              <div className="profile-appointment-info">
                                <div className="profile-appointment-prof">
                                  {a.ProfessorName ?? a.professorName ?? a.professor ?? "-"}
                                </div>
                                <div className="profile-appointment-datetime">
                                  {dt ? `${formatDisplayDate(dt)} ${extractTimeFromISO(dt.toISOString())}` : "Tarih bilinmiyor"}
                                </div>
                              </div>
                              <div className="profile-appointment-actions">
                                <button
                                    className="btn-danger profile-appointment-cancel"
                                  onClick={() => handleCancelAppointment(id)}
                                  disabled={cancellingIds.includes(id)}
                                >
                                  {cancellingIds.includes(id) ? "İptal ediliyor..." : "İptal Et"}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </section>
              </div>
            )}
          {activeTab === "profile" && (
            <div className="tab-panel">
              {/* Bio Section */}
              <section className="content-section">
                <div className="section-header">
                  <h2>
                    <span className="section-icon">📝</span>
                    Hakkımda
                  </h2>
                </div>
                <div className="section-body">
                  {isEditing ? (
                    <textarea
                      className="bio-textarea"
                      value={bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      placeholder="Kendiniz hakkında birkaç cümle yazın..."
                      rows={4}
                    />
                  ) : (
                    <p className="bio-text">
                      {bio || "Henüz bir biyografi eklenmemiş."}
                    </p>
                  )}
                </div>
              </section>

              {/* Personal Info */}
              <section className="content-section">
                <div className="section-header">
                  <h2>
                    <span className="section-icon">👤</span>
                    Kişisel Bilgiler
                  </h2>
                </div>
                <div className="section-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Ad</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleChange("name", e.target. value)}
                          placeholder="Adınız"
                        />
                      ) : (
                        <span className="info-value">{name || "Belirtilmemiş"}</span>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Soyad</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={surname}
                          onChange={(e) => handleChange("surname", e.target.value)}
                          placeholder="Soyadınız"
                        />
                      ) : (
                        <span className="info-value">{surname || "Belirtilmemiş"}</span>
                      )}
                    </div>

                    <div className="info-item">
                      <label>E-posta</label>
                      <span className="info-value info-readonly">
                        {email}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                    </div>

                    <div className="info-item">
                      <label>Sınıf Seviyesi</label>
                      {isEditing ? (
                        <select
                          value={classLevel}
                          onChange={(e) => handleChange("classLevel", e.target. value)}
                        >
                          <option value="">Seçiniz</option>
                          {classLevelOptions.map((c) => (
                            <option key={c. value} value={c.value}>
                              {c. label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="info-value">
                          {getClassLevelLabel(classLevel)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Academic Info */}
              <section className="content-section">
                <div className="section-header">
                  <h2>
                    <span className="section-icon">🎓</span>
                    Akademik Bilgiler
                  </h2>
                </div>
                <div className="section-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Fakülte</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={faculty}
                          onChange={(e) => handleChange("faculty", e.target.value)}
                          placeholder="Fakülteniz"
                        />
                      ) : (
                        <span className="info-value">{faculty || "Belirtilmemiş"}</span>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Bölüm</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => handleChange("department", e.target.value)}
                          placeholder="Bölümünüz"
                        />
                      ) : (
                        <span className="info-value">{department || "Belirtilmemiş"}</span>
                      )}
                    </div>

                    {isEditing && (
                      <div className="info-item full-width">
                        <label>Profil Resmi URL</label>
                        <input
                          type="url"
                          value={profileImageUrl}
                          onChange={(e) => handleChange("profileImageUrl", e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "events" && (
            <div className="tab-panel">
              <section className="content-section">
                <div className="section-header">
                  <h2>
                    <span className="section-icon">📅</span>
                    Katıldığım Etkinlikler
                  </h2>
                </div>
                <div className="section-body">
                  {myEventsLoading ? (
                    <div className="profile-appointments-state">
                      <div className="loading-spinner" />
                      <span>Etkinlikleriniz yükleniyor...</span>
                    </div>
                  ) : myEventsError ? (
                    <div className="profile-appointments-error">
                      {myEventsError}
                    </div>
                  ) : myEvents.length > 0 ? (
                    <div className="clubs-list">
                      <p className="list-summary">{myEvents.length} etkinliğe katıldınız</p>
                      <div className="clubs-grid">
                        {myEvents.map((e) => (
                          <Link key={e.id} to={`/events/${e.id}`} className="club-card-mini">
                            {e.imageUrl && <img src={e.imageUrl} alt={e.title} className="club-card-mini-image" />}
                            <div className="club-card-mini-content">
                              <div className="club-card-mini-title-row">
                                <h3>{e.title}</h3>
                              </div>
                              {(e.dateText || e.location) && (
                                <span className="club-card-mini-meta">
                                  {e.dateText}{e.location ? ` • ${e.location}` : ""}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link to="/events" className="btn-explore">
                        Yeni Etkinlikler Keşfet
                      </Link>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <h3>Henüz etkinliğe katılmadınız</h3>
                      <p>Kampüsteki etkinlikleri keşfedin ve katılın! </p>
                      <Link to="/events" className="btn-explore">
                        Etkinlikleri Keşfet
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "clubs" && (
            <div className="tab-panel">
              <section className="content-section">
                <div className="section-header">
                  <h2>
                    <span className="section-icon">🏛️</span>
                    Üye Olduğum Kulüpler
                  </h2>
                </div>
                <div className="section-body">
                  {myClubsLoading ? (
                    <div className="profile-appointments-state">
                      <div className="loading-spinner" />
                      <span>Kulüpleriniz yükleniyor...</span>
                    </div>
                  ) : myClubsError ? (
                    <div className="profile-appointments-error">
                      {myClubsError}
                    </div>
                  ) : myClubs.length > 0 ? (
                    <div className="clubs-list">
                      <p className="list-summary">{myClubs.length} kulübe üyesiniz</p>
                      <div className="clubs-grid">
                        {myClubs.map((c) => {
                          const id = c.clubId ?? c.ClubId ?? c.id ?? c.Id;
                          const name = c.clubName ?? c.ClubName ?? c.name ?? c.Name ?? "Kulüp";
                          const description = c.clubDescription ?? c.ClubDescription ?? c.description ?? c.Description ?? "";
                          const role = c.clubRole ?? c.ClubRole ?? "Member";
                          const img = c.clubProfileImageUrl ?? c.ClubProfileImageUrl ?? null;
                          const joinDateRaw = c.joinDate ?? c.JoinDate ?? null;
                          let joinDateText = "";
                          if (joinDateRaw) {
                            try {
                              joinDateText = new Date(joinDateRaw).toLocaleDateString("tr-TR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              });
                            } catch {
                              joinDateText = String(joinDateRaw);
                            }
                          }
                          return (
                            <Link key={id} to={`/clubs/${id}`} className="club-card-mini">
                              {img && <img src={img} alt={name} className="club-card-mini-image" />}
                              <div className="club-card-mini-content">
                                <div className="club-card-mini-title-row">
                                  <h3>{name}</h3>
                                  <span className="club-role-badge">{role}</span>
                                </div>
                                {description && <p className="club-card-mini-description">{description}</p>}
                                {joinDateText && (
                                  <span className="club-card-mini-meta">Üyelik tarihi: {joinDateText}</span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <Link to="/clubs" className="btn-explore">
                        Yeni Kulüpler Keşfet
                      </Link>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🏛️</div>
                      <h3>Henüz bir kulübe üye değilsiniz</h3>
                      <p>İlgi alanlarınıza uygun kulüpleri keşfedin!</p>
                      <Link to="/clubs" className="btn-explore">
                        Kulüpleri Keşfet
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="tab-panel">
              <section className="content-section">
                <div className="section-header">
                  <h2>
                    <span className="section-icon">⚙️</span>
                    Hesap Ayarları
                  </h2>
                </div>
                <div className="section-body">
                  <div className="settings-list">
                    <div className="settings-item">
                      <div className="settings-info">
                        <h4>E-posta Bildirimleri</h4>
                        <p>Etkinlik ve kulüp güncellemelerinden haberdar ol</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    <div className="settings-item">
                      <div className="settings-info">
                        <h4>Profili Herkese Açık Yap</h4>
                        <p>Diğer kullanıcılar profilini görebilir</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    <div className="settings-item settings-danger">
                      <div className="settings-info">
                        <h4>Hesabı Sil</h4>
                        <p>Hesabınız ve tüm verileriniz kalıcı olarak silinir</p>
                      </div>
                      <button className="btn-danger">
                        Hesabı Sil
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
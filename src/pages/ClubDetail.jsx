import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import supabase from '../config/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { clubApi } from '../api/apiService';
import '../styles/ClubDetail.css';

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [toast, setToast] = useState(null);

  // Toast göster
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [club, setClub] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const categoryQueries = {
      1: 'technology,software',
      2: 'music,entertainment',
      3: 'sports,outdoor',
      4: 'career,entrepreneurship',
      5: 'education,learning',
      6: 'concert,music',
      7: 'community,social',
      8: 'career,job',
      9: 'startup,entrepreneurship',
    }

    const getFallbackCover = (categoryId, clubId) => {
      const q = categoryQueries[Number(categoryId)] || 'university,student';
      return `https://source.unsplash.com/1200x600/?${encodeURIComponent(q)}`;
    }

    const getFallbackLogo = (categoryId, clubId) => {
      const q = categoryQueries[Number(categoryId)] || 'badge,logo';
      return `https://source.unsplash.com/200x200/?${encodeURIComponent(q)}`;
    }
    const getFallbackOverlay = (categoryId, clubId) => {
      // narrower, decorative strip for hero overlay
      const overlayQueries = {
        1: 'coding,computer,developer',
        2: 'musician,instrument,concert',
        3: 'running,team,sports-stadium',
        4: 'startup,meeting,networking',
        5: 'classroom,books,students',
        6: 'stage,lights,concert-crowd',
        7: 'community,volunteer,people',
        8: 'office,career,job-interview',
        9: 'pitch,startup,innovation',
      }
      const q = overlayQueries[Number(categoryId)] || 'university,student';
      return `https://source.unsplash.com/1600x300/?${encodeURIComponent(q)}`;
    }
    const fetchDetail = async () => {
      try {
        setLoading(true);
        // Try numeric Id first, then string fields if numeric yields nothing
        const numericId = Number(id);

        let res = await supabase.from('Clubs').select('*').eq('Id', numericId).limit(1);
        if (!res.data || res.data.length === 0) {
          // try string-keyed id fields
          res = await supabase.from('Clubs').select('*').or(`Id.eq.${id},id.eq.${id}`).limit(1);
        }

        if (res.error) throw res.error;
        if (!res.data || res.data.length === 0) {
          setError('Kulüp bulunamadı');
          return;
        }

        const c = res.data[0];
        const mapped = {
          id: c.Id ?? c.id,
          name: c.Name ?? c.name,
          slogan: c.Slogan ?? c.slogan ?? '',
          description: c.Description ?? c.description ?? '',
          logo: c.LogoUrl ?? c.ProfileImageUrl ?? c.profileImageUrl ?? getFallbackLogo(c.CategoryId ?? c.Category ?? c.category ?? 'genel', c.Id ?? c.id),
          coverImage: c.CoverImageUrl ?? c.CoverUrl ?? c.coverImageUrl ?? getFallbackCover(c.CategoryId ?? c.Category ?? c.category ?? 'genel', c.Id ?? c.id),
          overlayImage: c.OverlayImageUrl ?? getFallbackOverlay(c.CategoryId ?? c.Category ?? c.category ?? 'genel', c.Id ?? c.id),
          tags: c.Tags ? (Array.isArray(c.Tags) ? c.Tags : String(c.Tags).split(',')) : [],
        };

        if (mounted) setClub(mapped);

        // fetch recent events for this club based on CategoryId (Events doesn't have ClubId)
        try {
          const clubCategoryId = c.CategoryId ?? c.categoryId ?? c.Category ?? c.category;
          const eventsRes = await supabase
            .from('Events')
            .select('*')
            .eq('CategoryId', clubCategoryId)
            .order('Time', { ascending: false })
            .limit(5);
          
          if (!eventsRes.error && eventsRes.data) {
            const evs = (eventsRes.data || []).map(e => {
              // Format the date nicely
              const eventDate = e.Time ?? e.time ?? e.EventDate ?? e.eventDate ?? e.CreatedAt ?? '';
              let formattedDate = '';
              if (eventDate) {
                try {
                  formattedDate = new Date(eventDate).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                } catch {
                  formattedDate = eventDate;
                }
              }
              return {
                id: e.Id ?? e.id,
                title: e.Title ?? e.title ?? '',
                date: formattedDate,
                location: e.Location ?? e.location ?? ''
              };
            });
            if (mounted) setRecentEvents(evs);
          }
        } catch (evErr) {
          // ignore event fetch failure for now
          console.warn('Events fetch failed', evErr);
        }

      } catch (err) {
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => { mounted = false };
  }, [id]);

  // Sayfa açıldığında backend'den bu kulübe üyelik var mı kontrol et
  useEffect(() => {
    if (!id) {
      setIsMember(false);
      return;
    }

    // Login değilse üyelik olamaz, direkt false'a çek
    if (!user) {
      setIsMember(false);
      return;
    }

    let mounted = true;

    const checkMembership = async () => {
      try {
        const res = await clubApi.myClubs();
        const data = res.data?.clubs ?? res.data?.Clubs ?? res.data ?? [];
        const numericId = Number(id);

        const isMemberNow = Array.isArray(data) && data.some((c) => {
          const cid = c.clubId ?? c.ClubId ?? c.id ?? c.Id;
          return Number(cid) === numericId;
        });

        if (mounted) setIsMember(isMemberNow);
      } catch (err) {
        console.warn('Failed to check club membership', err);
      }
    };

    checkMembership();

    return () => {
      mounted = false;
    };
  }, [id, user]);

  if (loading) return <div className="club-detail-container">Yükleniyor...</div>;
  if (error) return <div className="club-detail-container">Hata: {error}</div>;
  if (!club) return <div className="club-detail-container">Kulüp bulunamadı.</div>;

  return (
    <div className="club-detail-container">
      {/* HERO ALANI */}
      <div className="club-hero" style={{ backgroundImage: `url(${club.coverImage})` }}>
        <div className="hero-overlay">
          {/* decorative overlay image (category-specific) */}
          {club.overlayImage && (
            <div
              className="hero-overlay-image"
              style={{ backgroundImage: `url(${club.overlayImage})` }}
            />
          )}

          <div className="club-identity">
            <img src={club.logo} alt="Club Logo" className="club-logo" />
            <div className="club-text">
              <h1>{club.name}</h1>
              <p className="slogan">{club.slogan}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        {/* GERİ DÖN */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Geri Dön
        </button>

        {/* ÜST KISIM */}
        <div className="top-section">
          <div className="tags-container">
            {club.tags && club.tags.length > 0 ? (
              club.tags.map((tag, index) => (
                <span key={index} className="tag-badge">#{tag.trim()}</span>
              ))
            ) : null}
          </div>
          <div className="action-buttons">
            <button 
              className={`join-btn ${isMember ? 'leave' : 'join'}`} 
              disabled={saving}
              onClick={() => {
                if (!user) {
                  setShowLoginWarning(true);
                  return;
                }
                if (isMember) {
                  setShowLeaveModal(true);
                } else {
                  setShowConfirmModal(true);
                }
              }}
            >
              {saving
                ? 'İşleniyor...'
                : isMember
                  ? 'Kulüpten Ayrıl'
                  : 'Kulübe Katıl'}
            </button>
            <div className="toggle-wrapper">
              <span className={`bell-icon ${notificationsEnabled ? 'active' : ''}`}>
                {notificationsEnabled ? '🔔' : '🔕'}
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notificationsEnabled} 
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* HAKKIMİZDA + İSTATİSTİKLER (yan yana) */}
        <div className="main-content-row">
          <div className="section-block about-section">
            <h3>📚 Hakkımızda</h3>
            <p>{club.description}</p>
          </div>

          <aside className="sidebar">
            <div className="section-block stats-card">
              <h3>📊 Kulüp İstatistikleri</h3>
              <div className="stats-grid">
                <div><b>1.2k</b><small>Üye</small></div>
                <div><b>{recentEvents.length}</b><small>Etkinlik</small></div>
                <div><b>8</b><small>Proje</small></div>
              </div>
            </div>
          </aside>
        </div>

        {/* SON ETKİNLİKLER */}
        <div className="section-block">
          <h3>📅 Son Etkinlikler</h3>
          <ul className="events-list">
            {recentEvents.length > 0 ? (
              recentEvents.map((e, i) => (
                <li key={e.id ?? i} className="event-item">
                  <Link to={`/events/${e.id}`} className="event-link">
                    <strong>{e.title}</strong>
                    <span className="event-date">📅 {e.date}</span>
                    {e.location && <span className="event-location">📍 {e.location}</span>}
                  </Link>
                </li>
              ))
            ) : (
              <li>Son etkinlik bilgisi bulunamadı.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Onay Modalı */}
      {showConfirmModal && (
        <div className="club-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal__icon">🎉</div>
            <h3 className="club-modal__title">Kulübe Katıl</h3>
            <p className="club-modal__message">
              <strong>{club?.name}</strong> kulübüne katılmak istediğinize emin misiniz?
            </p>
            <div className="club-modal__actions">
              <button 
                className="club-modal__btn club-modal__btn--cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                İptal
              </button>
              <button 
                className="club-modal__btn club-modal__btn--confirm"
                disabled={saving}
                onClick={async () => {
                  try {
                    setSaving(true);
                    await clubApi.join(club.id);
                    setIsMember(true);
                    showToast(`${club?.name} kulübüne başarıyla katıldınız! 🎉`, "success");
                  } catch (err) {
                    console.error('join club failed', err);
                    const msg = err?.response?.data?.message || err?.message || 'Kulübe katılırken hata oluştu.';
                    showToast(msg, 'error');
                  } finally {
                    setSaving(false);
                    setShowConfirmModal(false);
                  }
                }}
              >
                Evet, Katıl
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ayrılma Onay Modalı */}
      {showLeaveModal && (
        <div className="club-modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal__icon">😢</div>
            <h3 className="club-modal__title">Kulüpten Ayrıl</h3>
            <p className="club-modal__message">
              <strong>{club?.name}</strong> kulübünden ayrılmak istediğinize emin misiniz?
            </p>
            <div className="club-modal__actions">
              <button 
                className="club-modal__btn club-modal__btn--cancel"
                onClick={() => setShowLeaveModal(false)}
              >
                İptal
              </button>
              <button 
                className="club-modal__btn club-modal__btn--leave"
                disabled={saving}
                onClick={async () => {
                  try {
                    setSaving(true);
                    await clubApi.leave(club.id);
                    setIsMember(false);
                    showToast(`${club?.name} kulübünden ayrıldınız`, "error");
                  } catch (err) {
                    console.error('leave club failed', err);
                    const msg = err?.response?.data?.message || err?.message || 'Kulüpten ayrılırken hata oluştu.';
                    showToast(msg, 'error');
                  } finally {
                    setSaving(false);
                    setShowLeaveModal(false);
                  }
                }}
              >
                Evet, Ayrıl
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Giriş Yapılmamış Uyarısı */}
      {showLoginWarning && (
        <div className="club-modal-overlay" onClick={() => setShowLoginWarning(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal__icon">🔐</div>
            <h3 className="club-modal__title">Giriş Yapmalısınız</h3>
            <p className="club-modal__message">
              Kulübe katılabilmek için önce giriş yapmanız gerekmektedir.
            </p>
            <div className="club-modal__actions">
              <button 
                className="club-modal__btn club-modal__btn--cancel"
                onClick={() => setShowLoginWarning(false)}
              >
                İptal
              </button>
              <button 
                className="club-modal__btn club-modal__btn--confirm"
                onClick={() => {
                  setShowLoginWarning(false);
                  navigate('/login');
                }}
              >
                Giriş Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`club-toast club-toast--${toast.type}`}>
          <div className="club-toast__icon">
            {toast.type === "success" ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <span className="club-toast__message">{toast.message}</span>
          <button className="club-toast__close" onClick={() => setToast(null)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ClubDetail;
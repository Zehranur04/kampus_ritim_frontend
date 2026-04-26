// src/pages/EventDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
import { userEventApi } from "../api/apiService";
import { useAuth } from "../auth/AuthContext";
import "../styles/event-detail.css";
import "../styles/clubModal.css";

const EVENT_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1200";

function formatDateTime(ts) {
  if (!ts) return { date: "--", time: "--" };
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return { date: "--", time: "--" };
  return {
    date: d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function EventDetailPage({ fixedId = null, fixedSlug = null }) {
  const params = useParams();
  const routeId = params?.id;
  const id = fixedId ?? routeId;
  const navigate = useNavigate();
  const { backendUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [speaker, setSpeaker] = useState(null);
  const [category, setCategory] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [checkingJoined, setCheckingJoined] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveError, setLeaveError] = useState(null);

  // Rating (Supabase Votes)
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myVote, setMyVote] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const [submittingVote, setSubmittingVote] = useState(false);

  const getBackendUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return 0;
      const payload = JSON.parse(atob(token.split(".")[1]));
      const raw = payload?.sub ?? payload?.Sub ?? payload?.nameid ?? payload?.NameIdentifier;
      const parsed = parseInt(raw || 0, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  };

  const getCurrentBackendUserId = () => {
    const idFromCtx = backendUser?.id ? Number(backendUser.id) : 0;
    if (idFromCtx) return idFromCtx;
    return getBackendUserIdFromToken();
  };

  // Sayfa yenilenince de kullanıcı bu etkinliğe katılmış mı kontrol et
  useEffect(() => {
    let mounted = true;

    const check = async () => {
      if (!event?.id) return;
      const token = localStorage.getItem("token");
      if (!token) return;

      setCheckingJoined(true);
      try {
        const res = await userEventApi.mine();
        const ids = res?.data?.eventIds ?? res?.data?.EventIds ?? [];
        const eventIds = Array.isArray(ids) ? ids.map((x) => Number(x)) : [];
        const isJoined = eventIds.includes(Number(event.id));
        if (mounted) setJoined(isJoined);
      } catch {
        // sessiz geç (buton durumunu bozmayalım)
      } finally {
        if (mounted) setCheckingJoined(false);
      }
    };

    check();
    return () => {
      mounted = false;
    };
  }, [event?.id]);

  const handlePrimaryAction = async () => {
    if (!event?.id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    if (joined) {
      setLeaveError(null);
      setShowLeaveModal(true);
      return;
    }

    setJoinError(null);
    setShowJoinModal(true);
  };

  const confirmJoin = async () => {
    if (!event?.id) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await userEventApi.join(Number(event.id));
      const data = res?.data;
      if (data?.isSuccess === false || data?.IsSuccess === false) {
        setJoinError(data?.message || data?.Message || "Katılım başarısız.");
        return;
      }
      setJoined(true);
      setShowJoinModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.Message || err?.message || "Katılım sırasında hata oluştu.";
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  };

  const confirmLeave = async () => {
    if (!event?.id) return;
    setLeaving(true);
    setLeaveError(null);
    try {
      const res = await userEventApi.leave(Number(event.id));
      const data = res?.data;
      if (data?.isSuccess === false || data?.IsSuccess === false) {
        setLeaveError(data?.message || data?.Message || "İşlem başarısız.");
        return;
      }
      setJoined(false);
      setShowLeaveModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.Message || err?.message || "İşlem sırasında hata oluştu.";
      setLeaveError(msg);
    } finally {
      setLeaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Try to find by Id column first, then lowercase id. If no id provided,
        // and fixedSlug is present, try to find by Title ILIKE '%fixedSlug%'.
        console.debug("EventDetail: fetching event id=", id, "slug=", fixedSlug);
        let row = null;
        if (id) {
          try {
            const res = await supabase.from("Events").select("*").eq("Id", id).limit(1);
            if (!res.error && res.data && res.data[0]) row = res.data[0];
            else {
              const res2 = await supabase.from("Events").select("*").eq("id", id).limit(1);
              if (!res2.error && res2.data && res2.data[0]) row = res2.data[0];
            }
          } catch (e) {
            console.debug("EventDetail: id lookup failed", e?.message || e);
          }
        }

        // If still not found, and a slug was given, try Title ILIKE lookup
        if (!row && fixedSlug) {
          try {
            const guess = fixedSlug.replace(/-/g, ' ');
            const res = await supabase.from("Events").select("*").ilike("Title", `%${guess}%`).limit(1);
            if (!res.error && res.data && res.data[0]) row = res.data[0];
          } catch (es) {
            console.debug("EventDetail: slug lookup failed", es?.message || es);
          }
        }

        if (!row) {
          throw new Error("Etkinlik bulunamadı");
        }

        // Map basic fields
        const title = row.Title ?? row.title ?? row.name ?? "Etkinlik";
        const desc = row.Description ?? row.description ?? "";
        const ts = row.Time ?? row.time ?? row.Date ?? row.date ?? null;
        const location = row.Location ?? row.location ?? "";
        const dbImg = row.Image ?? row.imageUrl ?? row.image ?? null;
        const imageUrl = (typeof dbImg === 'string' && dbImg.trim().length > 0) ? dbImg.trim() : EVENT_IMAGE_FALLBACK;

        const certificate = row.CertificateDetails ?? row.certificateDetails ?? row.Certificate ?? row.certificate ?? null;
        const mapped = { id: row.Id ?? row.id, title, desc, ts, location, imageUrl, certificate, raw: row };
        if (mounted) setEvent(mapped);

        // Load speaker if present
        const speakerId = row.SpeakerId ?? row.speakerId ?? row.Speaker ?? row.speaker ?? null;
        if (speakerId) {
          try {
            const sp = await supabase.from("Speakers").select("*").eq("Id", speakerId).limit(1);
            if (!sp.error && sp.data && sp.data[0]) {
              if (mounted) setSpeaker(sp.data[0]);
            }
          } catch (es) {
            console.warn("Could not load speaker", es?.message || es);
          }
        }

        // Load category if present
        const categoryId = row.CategoryId ?? row.categoryId ?? row.Category ?? row.category ?? null;
        if (categoryId) {
          try {
            const cat = await supabase.from("Categories").select("*").eq("Id", categoryId).limit(1);
            if (!cat.error && cat.data && cat.data[0]) {
              if (mounted) setCategory(cat.data[0]);
            }
          } catch (ec) {
            console.warn("Could not load category", ec?.message || ec);
          }
        }

        // Load room if present (or try to match by location)
        const roomId = row.RoomId ?? row.roomId ?? null;
        if (roomId != null) {
          try {
            const rm = await supabase.from("Rooms").select("*").eq("Id", roomId).limit(1);
            if (!rm.error && rm.data && rm.data[0]) {
              if (mounted) setRoom(rm.data[0]);
            }
          } catch (er) {
            console.warn("Could not load room", er?.message || er);
          }
        } else if (location) {
          try {
            const rm2 = await supabase.from("Rooms").select("*").eq("Name", location).limit(1);
            if (!rm2.error && rm2.data && rm2.data[0]) {
              if (mounted) setRoom(rm2.data[0]);
            }
          } catch (er2) {
            // optional fallback; ignore silently
          }
        }

        if (mounted) setError(null);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false };
  }, [id, fixedSlug]);

  // Votes: load average + my vote
  useEffect(() => {
    let mounted = true;

    const loadVotes = async () => {
      if (!event?.id) return;
      setRatingLoading(true);
      setRatingError(null);

      try {
        const eventId = Number(event.id);

        // Event average
        const r = await supabase
          .from("Votes")
          .select("Score", { count: "exact" })
          .eq("EventId", eventId);

        if (r.error) throw r.error;

        const scores = Array.isArray(r.data) ? r.data.map((x) => Number(x.Score)).filter((x) => Number.isFinite(x)) : [];
        const count = scores.length;
        const avg = count ? scores.reduce((a, b) => a + b, 0) / count : 0;
        if (mounted) {
          setAvgRating(avg);
          setRatingCount(count);
        }

        // My vote (if logged in)
        const userId = getCurrentBackendUserId();
        if (!userId) {
          if (mounted) {
            setMyVote(null);
            setRating(0);
          }
          return;
        }

        const my = await supabase
          .from("Votes")
          .select("Score")
          .eq("EventId", eventId)
          .eq("UserId", userId)
          .limit(1);

        if (my.error) throw my.error;
        const existing = Array.isArray(my.data) && my.data[0] ? Number(my.data[0].Score) : null;
        if (mounted) {
          setMyVote(existing && Number.isFinite(existing) ? existing : null);
          setRating(existing && Number.isFinite(existing) ? existing : 0);
        }
      } catch (e) {
        if (!mounted) return;
        setRatingError(e?.message || "Oylama bilgileri yüklenemedi.");
      } finally {
        if (mounted) setRatingLoading(false);
      }
    };

    loadVotes();
    return () => {
      mounted = false;
    };
  }, [event?.id, backendUser?.id]);

  const handleRate = async (score) => {
    if (!event?.id) return;
    if (submittingVote) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    if (myVote != null) return; // already voted

    const userId = getCurrentBackendUserId();
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    setSubmittingVote(true);
    setRatingError(null);
    try {
      const eventId = Number(event.id);
      const payload = {
        Score: Number(score),
        VotedAt: new Date().toISOString(),
        UserId: Number(userId),
        EventId: eventId,
      };

      const ins = await supabase.from("Votes").insert([payload]);
      if (ins.error) {
        // Unique constraint: one vote per user per event
        const pgCode = ins.error?.code;
        if (pgCode === "23505") {
          setRatingError("Bu etkinliğe zaten oy verdiniz.");
        } else {
          throw ins.error;
        }
      }

      // Refresh stats + my vote
      const r = await supabase
        .from("Votes")
        .select("Score", { count: "exact" })
        .eq("EventId", eventId);
      if (r.error) throw r.error;

      const scores = Array.isArray(r.data) ? r.data.map((x) => Number(x.Score)).filter((x) => Number.isFinite(x)) : [];
      const count = scores.length;
      const avg = count ? scores.reduce((a, b) => a + b, 0) / count : 0;
      setAvgRating(avg);
      setRatingCount(count);
      setMyVote(Number(score));
      setRating(Number(score));
    } catch (e) {
      setRatingError(e?.message || "Oylama sırasında hata oluştu.");
    } finally {
      setSubmittingVote(false);
      setHover(0);
    }
  };

  if (loading) return <div className="container">Yükleniyor…</div>;
  if (error) return <div className="container">Hata: {error}</div>;
  if (!event) return <div className="container">Etkinlik bulunamadı</div>;

  const dt = formatDateTime(event.ts);

  return (
    <div className="etkinlik-sayfasi">
      <div className="container">
        <Link to="/events" className="back-link">← Etkinliklere dön</Link>

        <h2 className="sayfa-basligi">Etkinlik Detayı</h2>

        <div className="etkinlik-icerik">
          <div className="sol-sutun">
            <img className="etkinlik-gorseli" src={event.imageUrl} alt={event.title} />
            <h1 className="etkinlik-basligi">{event.title}</h1>

            <div>
              <p>{event.desc}</p>
            </div>

            {speaker && (
              <div className="ek-bolum">
                <h3 className="bolum-basligi">Konuşmacılar</h3>
                <div className="konusmaci-listesi">
                  <div className="konusmaci-profil">
                    <img src={(speaker.ProfileImageUrl ?? speaker.profileImageUrl ?? speaker.image ?? '')} alt={`${(speaker.Name ?? speaker.name ?? '')}${speaker.Surname ? ' ' + speaker.Surname : ''}`} />
                    <h4>{(speaker.Name ?? speaker.name ?? '') + (speaker.Surname ? ' ' + speaker.Surname : '')}</h4>
                    <span>{speaker.Title ?? speaker.title ?? ''}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sertifika bilgisi (Supabase) */}
            {event.certificate && (
              <div className="ek-bolum">
                <h3 className="bolum-basligi">Sertifika</h3>
                <p>{event.certificate}</p>
              </div>
            )}

          </div>  
          <aside className="sag-sutun">
            <div className="bilgi-kutusu">
              <div className="bilgi-satiri"><strong>Tarih</strong><span>{dt.date}</span></div>
              <div className="bilgi-satiri"><strong>Saat</strong><span>{dt.time}</span></div>
              <div className="bilgi-satiri"><strong>Yer</strong><span>{event.location || '—'}</span></div>
              <div className="bilgi-satiri"><strong>Oda</strong><span>{room ? (room.Name ?? room.name) : '—'}</span></div>
              <div className="bilgi-satiri"><strong>Kategori</strong><span>{category ? (category.Name ?? category.name) : (event.raw?.CategoryName ?? event.raw?.category ?? '—')}</span></div>

              <button
                className={`basvur-butonu ${joined ? "basvur-butonu--danger" : ""}`}
                onClick={handlePrimaryAction}
                disabled={checkingJoined || joining || leaving}
              >
                {checkingJoined
                  ? "Kontrol ediliyor..."
                  : joined
                    ? (leaving ? "İşleniyor..." : "Kaydı Geri Al")
                    : (joining ? "Katılıyor..." : "Başvur / Kayıt Ol")}
              </button>
            </div>

            {/* --- YILDIZ OYLAMA --- */}
            <hr style={{ border: '0.5px solid #eee', margin: '20px 0 15px 0' }} />
            <div className="rating-container" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#666', fontWeight: '500', marginBottom: '10px' }}>
                {ratingLoading
                  ? "Puanlar yükleniyor..."
                  : ratingCount > 0
                    ? `Ortalama: ${avgRating.toFixed(1)} / 5 (${ratingCount} oy)`
                    : "Henüz oy yok"}
              </div>

              <div style={{ marginBottom: '8px' }} aria-label="Etkinlik ortalama puanı">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  const filled = starValue <= Math.round(avgRating);
                  return (
                    <span
                      key={starValue}
                      style={{
                        fontSize: '18px',
                        color: filled ? '#ffb400' : '#e4e5e9',
                        margin: '0 2px',
                      }}
                    >
                      ★
                    </span>
                  );
                })}
              </div>

              <div style={{ marginBottom: '8px' }}>
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <span
                      key={starValue}
                      style={{
                        cursor: myVote != null || submittingVote ? 'not-allowed' : 'pointer',
                        fontSize: '26px',
                        color: starValue <= (hover || rating) ? '#ffb400' : '#e4e5e9',
                        transition: 'all 0.2s ease',
                        display: 'inline-block',
                        margin: '0 3px'
                      }}
                      onClick={() => {
                        if (myVote != null) return;
                        handleRate(starValue);
                      }}
                      onMouseEnter={() => {
                        if (myVote != null) return;
                        setHover(starValue);
                      }}
                      onMouseLeave={() => {
                        if (myVote != null) return;
                        setHover(0);
                      }}
                    >
                      ★
                    </span>
                  );
                })}
              </div>
              <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
                {submittingVote
                  ? "Oyunuz kaydediliyor..."
                  : myVote != null
                    ? `Sizin oyunuz: ${myVote} / 5`
                    : (rating > 0 ? `${rating} / 5 Seçtiniz` : 'Etkinliği Oylayın')}
              </span>

              {ratingError && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>
                  {ratingError}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Onay Modalı (ClubDetail ile aynı stil) */}
      {showJoinModal && (
        <div className="club-modal-overlay" onClick={() => !joining && setShowJoinModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal__icon">🎉</div>
            <h3 className="club-modal__title">Etkinliğe Katıl</h3>
            <p className="club-modal__message">
              <strong>{event?.title}</strong> etkinliğine katılmak istediğinize emin misiniz?
              {joinError && (
                <>
                  <br />
                  <br />
                  <strong style={{ color: "#ef4444" }}>{joinError}</strong>
                </>
              )}
            </p>
            <div className="club-modal__actions">
              <button
                className="club-modal__btn club-modal__btn--cancel"
                disabled={joining}
                onClick={() => setShowJoinModal(false)}
              >
                İptal
              </button>
              <button
                className="club-modal__btn club-modal__btn--confirm"
                disabled={joining}
                onClick={confirmJoin}
              >
                {joining ? "İşleniyor..." : "Evet, Katıl"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Giriş Yapılmamış Uyarısı (ClubDetail ile aynı stil) */}
      {showLoginModal && (
        <div className="club-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal__icon">🔐</div>
            <h3 className="club-modal__title">Giriş Yapmalısınız</h3>
            <p className="club-modal__message">Etkinliğe katılabilmek için önce giriş yapmanız gerekmektedir.</p>
            <div className="club-modal__actions">
              <button className="club-modal__btn club-modal__btn--cancel" onClick={() => setShowLoginModal(false)}>
                İptal
              </button>
              <button
                className="club-modal__btn club-modal__btn--confirm"
                onClick={() => {
                  setShowLoginModal(false);
                  navigate("/login");
                }}
              >
                Giriş Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kaydı Geri Alma Modalı (ClubDetail ile aynı stil) */}
      {showLeaveModal && (
        <div className="club-modal-overlay" onClick={() => !leaving && setShowLeaveModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal__icon">😢</div>
            <h3 className="club-modal__title">Kaydı Geri Al</h3>
            <p className="club-modal__message">
              <strong>{event?.title}</strong> etkinliğine katılım kaydınızı geri almak istediğinize emin misiniz?
              {leaveError && (
                <>
                  <br />
                  <br />
                  <strong style={{ color: "#ef4444" }}>{leaveError}</strong>
                </>
              )}
            </p>
            <div className="club-modal__actions">
              <button
                className="club-modal__btn club-modal__btn--cancel"
                disabled={leaving}
                onClick={() => setShowLeaveModal(false)}
              >
                İptal
              </button>
              <button
                className="club-modal__btn club-modal__btn--leave"
                disabled={leaving}
                onClick={confirmLeave}
              >
                {leaving ? "İşleniyor..." : "Evet, Geri Al"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


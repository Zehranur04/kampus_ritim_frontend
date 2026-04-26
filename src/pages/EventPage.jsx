// src/pages/EventPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Tilt from "react-parallax-tilt";
import supabase from "../config/supabaseClient";

const EVENT_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1200";

// Events and Categories will be loaded from Supabase tables.

const STATIC_ROOT_CATEGORY = { name: "Tümü", icon: "◉" };

function pickCategoryIcon(name = "") {
  const n = (name || "").toLowerCase();
  if (n.includes("konser") || n.includes("müzik")) return "🎵";
  if (n.includes("eğitim") || n.includes("workshop") || n.includes("bootcamp")) return "📚";
  if (n.includes("kariyer") || n.includes("staj") || n.includes("iş")) return "💼";
  if (n.includes("sosyal") || n.includes("tanışma") || n.includes("pazar")) return "🎉";
  return "◉";
}

// use shared image helpers from ../utils/imageHelpers

// Tarih formatlama fonksiyonu
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const options = { day: "numeric", month: "long", year: "numeric" };
  return date.toLocaleDateString("tr-TR", options);
};

const getShortDate = (dateStr) => {
  if (!dateStr) return { day: "--", month: "--" };
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "--" };
  const day = date.getDate();
  const month = date.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase();
  return { day, month };
};

function inferCategory(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('konser') || text.includes('müzik')) return 'Konser';
  if (text.includes('workshop') || text.includes('eğitim') || text.includes('çalıştay') || text.includes('bootcamp')) return 'Eğitim';
  if (text.includes('kariyer') || text.includes('staj') || text.includes('iş')) return 'Kariyer';
  if (text.includes('sosyal') || text.includes('tanışma') || text.includes('parti') || text.includes('pazar')) return 'Sosyal';
  return 'Diğer';
}

// Etkinlik yaklaşıyor mu kontrolü (7 gün içinde)
const isUpcoming = (dateStr) => {
  if (!dateStr) return false;
  const eventDate = new Date(dateStr);
  const today = new Date();
  const diffTime = eventDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

export default function EventPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const [timeFilter, setTimeFilter] = useState("all"); // "all", "upcoming", "past"
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([STATIC_ROOT_CATEGORY]);
  const [categoriesById, setCategoriesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Load events from Supabase
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('Events')
          .select('*')
          .order('Time', { ascending: true });

        if (error) throw error;

        // Map DB rows to UI shape with fallbacks
        const mapped = (data || []).map((row) => {
          const id = row.id ?? row.Id ?? row.ID ?? row.Id ?? Math.random().toString(36).slice(2, 9);
          const title = row.title ?? row.Title ?? row.name ?? 'Etkinlik';
          // Try to resolve category from CategoryId via categoriesById (may be empty at first)
          const rawCategoryCandidate = row.category ?? row.Category ?? row.CategoryName ?? null;
          const catId = row.categoryId ?? row.CategoryId ?? row.CategoryID ?? row.Category ?? null;
          const resolvedFromId = (catId && categoriesById) ? (categoriesById[String(catId)] ?? null) : null;
          const rawCategory = (
            typeof rawCategoryCandidate === 'string' && Number.isNaN(Number(rawCategoryCandidate))
          )
            ? rawCategoryCandidate
            : null;
          const category = resolvedFromId ?? rawCategory ?? inferCategory(title, row.description ?? row.Description ?? '');
          const type = row.type ?? row.Type ?? (row.isOnline ? 'Online' : 'Kampüs');

          // Time/date handling: prefer a timestamp-like column (Time, time, date, Date)
          const ts = row.time ?? row.Time ?? row.date ?? row.Date ?? row.TimeStamp ?? null;
          let date = null;
          let time = '';
          if (ts) {
            const d = new Date(ts);
            if (!Number.isNaN(d.getTime())) {
              date = d.toISOString().split('T')[0];
              time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            }
          }

          const location = row.location ?? row.Location ?? row.LocationName ?? '';
          const dbImg = row.Image ?? row.imageUrl ?? row.image ?? null;
          const imageUrl = (typeof dbImg === 'string' && dbImg.trim().length > 0) ? dbImg.trim() : EVENT_IMAGE_FALLBACK;

          return { id, title, category, type, date, time, location, imageUrl, raw: row };
        });

        if (mounted) {
          setEvents(mapped);
          setFetchError(null);
        }
      } catch (err) {
        console.error('Error loading events:', err);
        if (mounted) setFetchError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false };
  }, []);

  // Load categories from Supabase and build lookup map
  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase.from('Categories').select('*');
        if (error) throw error;
        const list = (data || [])
          .map((c) => ({ id: c.Id ?? c.id, name: c.Name ?? c.name }))
          .filter((c) => c.id != null && typeof c.name === 'string' && c.name.trim().length > 0)
          .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        const lookup = {};
        list.forEach((c) => { if (c.id != null) lookup[String(c.id)] = c.name; });
        if (mounted) {
          setCategories([STATIC_ROOT_CATEGORY, ...list.map(c => ({ name: c.name, icon: pickCategoryIcon(c.name) }))]);
          setCategoriesById(lookup);
        }
      } catch (err) {
        console.warn('Could not load categories from Supabase, will keep client-side defaults.', err);
      }
    };

    loadCategories();
    return () => { mounted = false };
  }, []);

  // When categoriesById becomes available, update already-loaded events to show category names
  useEffect(() => {
    if (!categoriesById || Object.keys(categoriesById).length === 0) return;
    setEvents((prev) => prev.map(ev => {
      const raw = ev.raw || {};
      const catId = raw.CategoryId ?? raw.categoryId ?? raw.Category ?? raw.category ?? null;
      const resolved = catId ? categoriesById[String(catId)] : null;
      if (resolved && ev.category !== resolved) return { ...ev, category: resolved };
      return ev;
    }));
  }, [categoriesById]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cloudOffset = Math.max(-40, scrollY * -0.15);
  const cloudStyle = {
    transform: `translateY(${cloudOffset}px)`
  };

  // Geçmiş veya gelecek etkinlik kontrolü
  const isPastEvent = (dateStr) => {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  // Filtreleme
  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      activeFilter === "Tümü" || event.category === activeFilter;
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Zaman filtreleme
    let matchesTime = true;
    if (timeFilter === "upcoming") {
      matchesTime = !isPastEvent(event.date);
    } else if (timeFilter === "past") {
      matchesTime = isPastEvent(event.date);
    }
    
    return matchesCategory && matchesSearch && matchesTime;
  }).sort((a, b) => {
    // Önce gelecek etkinlikler, sonra geçmiş etkinlikler
    const aIsPast = isPastEvent(a.date);
    const bIsPast = isPastEvent(b.date);
    
    // Eğer biri geçmiş, biri gelecek ise gelecek olan önce
    if (aIsPast !== bIsPast) {
      return aIsPast ? 1 : -1;
    }
    
    // İkisi de gelecek ise tarihe göre artan sıra (yakın olan önce)
    // İkisi de geçmiş ise tarihe göre azalan sıra (en son biten önce)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return aIsPast ? (dateB - dateA) : (dateA - dateB);
  });

  // İstatistikler için sayımlar
  const upcomingCount = events.filter(e => !isPastEvent(e.date)).length;
  const pastCount = events.filter(e => isPastEvent(e.date)).length;

  return (
    <div className="events-page">
      {/* HERO */}
      <section className="events-hero">
        <div className="events-hero-inner container">
          <div className="events-hero-text">
            <div className="events-hero-badge">
              <span className="badge-pulse" />
              <span>Canlı Etkinlikler</span>
            </div>
            <h1>Kampüsteki Tüm Etkinlikler Tek Yerde</h1>
            <p>
              DOÜ'de olup bitenleri kaçırma! Konserlerden kariyer zirvelerine
              kadar yaklaşan tüm etkinlikleri burada görebilir, detaylarını
              inceleyip sana en uygun olanları seçebilirsin.
            </p>
            
            {/* Hero Stats */}
            <div className="hero-quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-number">{loading ? '…' : events.length}</span>
                <span className="quick-stat-label">ETKİNLİK</span>
              </div>
              <div className="quick-stat-divider" />
              <div className="quick-stat">
                <span className="quick-stat-number">{loading ? '…' : events.filter(e => isUpcoming(e.date)).length}</span>
                <span className="quick-stat-label">Bu Hafta</span>
              </div>
              <div className="quick-stat-divider" />
              <div className="quick-stat">
                <span className="quick-stat-number">{loading ? '…' : Object.keys(categoriesById || {}).length}</span>
                <span className="quick-stat-label">KAREGORİ</span>
              </div>
            </div>
          </div>

          {/* Sağdaki şekiller */}
          <div className="events-hero-illustration">
            <div className="hero-hand-circle" />
            <div className="hero-hand-outline hero-hand-outline-1" />
            <div className="hero-hand-outline hero-hand-outline-2" />
            {/* Takvim ikonu */}
            <div className="hero-calendar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bulut katmanı */}
        <div className="hero-cloud-wrapper" style={cloudStyle}>
          <svg
            className="hero-cloud-svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              d="
                M0,256
                L60,240
                C120,224,240,192,360,176
                C480,160,600,160,720,170.7
                C840,181,960,203,1080,208
                C1200,213,1320,203,1380,197.3
                L1440,192
                L1440,320
                L0,320
                Z
              "
            />
          </svg>
        </div>
      </section>

      {/* ETKİNLİKLER */}
      <main className="events-main">
        <div className="container">
          {/* Header + Search */}
          <div className="events-header">
            <div className="events-header-left">
              <h2>Son Paylaşılan Etkinlikler</h2>
              <span className="events-count-badge">{filteredEvents.length} etkinlik</span>
            </div>
            
            {/* Arama kutusu */}
            <div className="events-search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Etkinlik veya konum ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="search-clear" onClick={() => setSearchTerm("")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Zaman Filtreleme - Geçmiş / Gelecek */}
          <div className="events-time-filter">
            <div className="time-filter-group">
              <button
                className={`time-filter-btn ${timeFilter === "all" ? "time-filter-active" : ""}`}
                onClick={() => setTimeFilter("all")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span>Tümü</span>
                <span className="time-filter-count">{events.length}</span>
              </button>
              <button
                className={`time-filter-btn ${timeFilter === "upcoming" ? "time-filter-active" : ""}`}
                onClick={() => setTimeFilter("upcoming")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Gelecek</span>
                <span className="time-filter-count">{upcomingCount}</span>
              </button>
              <button
                className={`time-filter-btn ${timeFilter === "past" ? "time-filter-active" : ""}`}
                onClick={() => setTimeFilter("past")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l2 2" />
                  <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                </svg>
                <span>Geçmiş</span>
                <span className="time-filter-count">{pastCount}</span>
              </button>
            </div>
          </div>

          {/* Kategori Filtreleme */}
          <div className="events-filter-section">
            <div className="filter-section-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              <span>Kategori</span>
            </div>
            <div className="events-filter-row">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`filter-chip ${activeFilter === cat.name ? "filter-chip-active" : ""}`}
                onClick={() => setActiveFilter(cat.name)}
              >
                <span className="filter-chip-icon">{cat.icon}</span>
                <span>{cat.name}</span>
                {activeFilter === cat.name && (
                  <span className="filter-chip-count">
                    {loading
                      ? '…'
                      : cat.name === "Tümü"
                        ? events.length
                        : events.filter((e) => e.category === cat.name).length}
                  </span>
                )}
              </button>
            ))}
            </div>
          </div>

          {/* Aktif filtreler özeti */}
          {(timeFilter !== "all" || activeFilter !== "Tümü" || searchTerm) && (
            <div className="active-filters-summary">
              <span className="active-filters-label">Aktif Filtreler:</span>
              {timeFilter !== "all" && (
                <span className="active-filter-tag">
                  {timeFilter === "upcoming" ? "Gelecek Etkinlikler" : "Geçmiş Etkinlikler"}
                  <button onClick={() => setTimeFilter("all")}>×</button>
                </span>
              )}
              {activeFilter !== "Tümü" && (
                <span className="active-filter-tag">
                  {activeFilter}
                  <button onClick={() => setActiveFilter("Tümü")}>×</button>
                </span>
              )}
              {searchTerm && (
                <span className="active-filter-tag">
                  "{searchTerm}"
                  <button onClick={() => setSearchTerm("")}>×</button>
                </span>
              )}
              <button 
                className="clear-all-filters"
                onClick={() => { setTimeFilter("all"); setActiveFilter("Tümü"); setSearchTerm(""); }}
              >
                Tümünü Temizle
              </button>
            </div>
          )}

          {/* Arama sonucu bilgisi */}
          {searchTerm && (
            <p className="search-result-info">
              "<strong>{searchTerm}</strong>" için {filteredEvents.length} sonuç bulundu
            </p>
          )}

          {fetchError && (
            <div className="fetch-error">
              <p>Etkinlikler yüklenirken bir hata oluştu: {fetchError}</p>
            </div>
          )}

          {/* Grid */}
          <div className="events-grid">
            {filteredEvents.map((event, index) => {
              const shortDate = getShortDate(event.date);
              const upcoming = isUpcoming(event.date);
              
              return (
                <Tilt
                  key={event.id}
                  className="event-card-tilt-wrapper"
                  tiltMaxAngleX={8}
                  tiltMaxAngleY={8}
                  scale={1.02}
                  transitionSpeed={400}
                  glareEnable={false}
                  glareMaxOpacity={0.2}
                  glareBorderRadius="24px"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Link to={`/events/${event.id}`} className={`event-card ${isPastEvent(event.date) ? 'event-card-past' : ''}`}>
                    <div className="event-card-image-wrapper">
                      {/* Tarih badge - sol üst */}
                      <div className="event-card-date">
                        <span className="date-day">{shortDate.day}</span>
                        <span className="date-month">{shortDate.month}</span>
                      </div>

                      {/* Tip badge - sağ üst */}
                      <div className={`event-card-tag ${event.type === 'Online' ? 'tag-online' : ''}`}>
                        {event.type === 'Online' && (
                          <span className="online-dot" />
                        )}
                        {event.type}
                      </div>

                      {/* Geçmiş etkinlik badge */}
                      {isPastEvent(event.date) && (
                        <div className="event-past-badge">
                          Tamamlandı
                        </div>
                      )}

                      {/* Yaklaşan etkinlik badge */}
                      {upcoming && !isPastEvent(event.date) && (
                        <div className="event-upcoming-badge">
                          <span className="upcoming-pulse" />
                          Yakında
                        </div>
                      )}

                      {/* Görsel */}
                      <img src={event.imageUrl} alt={event.title} />
                      
                      {/* Overlay gradient */}
                      <div className="event-card-overlay" />

                      {/* Alt bilgi alanı */}
                      <div className="event-card-bottom">
                        <span className="event-card-category">{event.category}</span>
                        <h3 className="event-card-title">{event.title}</h3>
                        <div className="event-card-meta">
                          <span className="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" />
                            </svg>
                            {event.time}
                          </span>
                          <span className="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Tilt>
              );
            })}
          </div>

          {/* Sonuç bulunamadı */}
          {filteredEvents.length === 0 && (
            <div className="events-no-result">
              <div className="no-result-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                  <path d="M9 16l6-6M15 16l-6-6" opacity="0.5" />
                </svg>
              </div>
              <h3>Etkinlik Bulunamadı</h3>
              <p>Arama kriterlerinize uygun etkinlik bulunamadı.</p>
              <button 
                className="reset-btn"
                onClick={() => { setSearchTerm(""); setActiveFilter("Tümü"); setTimeFilter("all"); }}
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
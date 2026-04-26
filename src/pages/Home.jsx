// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../config/supabaseClient";
const EVENT_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1200";

function inferCategory(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('konser') || text.includes('müzik')) return 'Konser';
  if (text.includes('workshop') || text.includes('eğitim') || text.includes('çalıştay') || text.includes('bootcamp')) return 'Eğitim';
  if (text.includes('kariyer') || text.includes('staj') || text.includes('iş')) return 'Kariyer';
  if (text.includes('sosyal') || text.includes('tanışma') || text.includes('parti') || text.includes('pazar')) return 'Sosyal';
  return 'Diğer';
}

// Featured events are loaded from Supabase. If the DB row lacks an image
// or category we fall back to deterministic client-side values.
// use shared image helpers

// Replace static sample data with a Supabase-driven fetch for top 3 upcoming events
const DEFAULT_FEATURED_LIMIT = 3;
const DEFAULT_CLUBS_LIMIT = 5;

// Category-based color mapping for clubs
const categoryColors = {
  1: "#6366f1", // Eğitim - purple
  2: "#ec4899", // Konser - pink
  3: "#10b981", // Sosyal - green
  4: "#f59e0b", // Kariyer - amber
  5: "#22d3ee", // Teknoloji - cyan
  6: "#8b5cf6", // Sanat - violet
  7: "#ef4444", // Spor - red
  default: "#6366f1"
};

// Fallback image based on category
const getCategoryImage = (categoryId, clubName) => {
  const categoryImages = {
    1: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80", // Eğitim
    2: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80", // Konser
    3: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80", // Sosyal
    4: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=600&q=80", // Kariyer
    5: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80", // Teknoloji
    6: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80", // Sanat
    7: "https://images.unsplash.com/photo-1461896836934-28e4c4f4e0be?auto=format&fit=crop&w=600&q=80", // Spor
  };
  return categoryImages[categoryId] || `https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=600&q=80`;
};

// Nasıl çalışır adımları
const steps = [
  {
    number: "01",
    icon: "🎓",
    title: "Kayıt Ol",
    description: "Üniversite e-posta adresinle hızlıca hesap oluştur.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80"
  },
  {
    number: "02",
    icon: "🔍",
    title: "Keşfet",
    description: "İlgi alanlarına göre kulüp ve etkinlikleri bul.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"
  },
  {
    number: "03",
    icon: "🚀",
    title: "Katıl",
    description: "Etkinliklere katıl, kulüplere üye ol, networkünü genişlet.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80"
  }
];

// İstatistikler
const stats = [
  { number: "25+", label: "Aktif Kulüp", icon: "🏛️" },
  { number: "100+", label: "Yıllık Etkinlik", icon: "🎪" },
  { number: "2000+", label: "Aktif Üye", icon: "👥" },
];

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouse);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  // Featured events fetched from Supabase (top N upcoming)
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadFeatured = async () => {
      setFeaturedLoading(true);
      try {
        // Fetch a larger page and filter on the client so we always show upcoming events
        const { data, error } = await supabase
          .from('Events')
          .select('*')
          .order('Time', { ascending: true })
          .limit(50);

        if (error) throw error;

        const mapped = (data || []).map((row) => {
          const id = row.id ?? row.Id ?? row.slug ?? Math.random().toString(36).slice(2, 9);
          const title = row.title ?? row.Title ?? row.name ?? 'Etkinlik';
          const club = row.club ?? row.Club ?? row.organization ?? row.ClubName ?? '';

          const ts = row.time ?? row.Time ?? row.date ?? row.Date ?? null;
          let date = '';
          let time = '';
          let dateObj = null;
          if (ts) {
            const d = new Date(ts);
            if (!Number.isNaN(d.getTime())) {
              dateObj = d;
              date = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
              time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            }
          }

          const category = row.category ?? row.Category ?? inferCategory(title, row.description ?? row.Description ?? '');
          const dbImg = row.Image ?? row.imageUrl ?? row.image ?? null;
          const imageUrl = (typeof dbImg === 'string' && dbImg.trim().length > 0) ? dbImg.trim() : EVENT_IMAGE_FALLBACK;

          return { id, title, club, date, time, category, imageUrl, raw: row, dateObj };
        });

        // Keep only future events (>= now), sort them and take the top N
        const now = Date.now();
        const upcoming = mapped
          .filter(e => e.dateObj && e.dateObj.getTime() >= now)
          .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
          .slice(0, DEFAULT_FEATURED_LIMIT);

        // If no upcoming events found, fall back to the earliest items returned
        const finalList = upcoming.length > 0 ? upcoming : mapped.slice(0, DEFAULT_FEATURED_LIMIT);

        if (mounted) setFeaturedEvents(finalList);
      } catch (err) {
        console.warn('Could not load featured events from Supabase', err);
      } finally {
        if (mounted) setFeaturedLoading(false);
      }
    };

    loadFeatured();
    return () => { mounted = false };
  }, []);

  // Highlighted clubs fetched from Supabase
  const [highlightedClubs, setHighlightedClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadClubs = async () => {
      setClubsLoading(true);
      try {
        const { data, error } = await supabase
          .from('Clubs')
          .select('*')
          .order('CreatedAt', { ascending: false })
          .limit(DEFAULT_CLUBS_LIMIT);

        if (error) throw error;

        const mapped = (data || []).map((row) => {
          const id = row.Id ?? row.id;
          const name = row.Name ?? row.name ?? 'Kulüp';
          const categoryId = row.CategoryId ?? row.categoryId ?? row.Category ?? 1;
          const imageUrl = row.ProfileImageUrl ?? row.profileImageUrl ?? row.ImageUrl ?? row.imageUrl ?? getCategoryImage(categoryId, name);
          const color = categoryColors[categoryId] || categoryColors.default;
          // Member count - if available, otherwise random placeholder
          const members = row.MemberCount ?? row.memberCount ?? Math.floor(Math.random() * 200) + 50;

          return { id, name, members, imageUrl, color, categoryId };
        });

        if (mounted) setHighlightedClubs(mapped);
      } catch (err) {
        console.warn('Could not load clubs from Supabase', err);
      } finally {
        if (mounted) setClubsLoading(false);
      }
    };

    loadClubs();
    return () => { mounted = false };
  }, []);

  const parallaxOffset = scrollY * 0.3;

  return (
    <main className="home">
      {/* ======= HERO SECTION ======= */}
      <section className="home-hero">
        {/* Background Image with Parallax */}
        <div 
          className="hero-bg-image"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        >
          <img 
            //src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80"
            //src="/home_background-1280.jpg"
            srcSet="/home_background-640.jpg 640w, /home_background-1024.jpg 1024w, /home_background-1280.jpg 1280w, /home_background-1600.jpg 1600w, /home_background-1920.jpg 1920w"
            sizes="100vw"
            alt="Campus"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {/* Overlay */}
        <div className="hero-overlay" />

        {/* Animated shapes */}
        <div className="hero-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
          <div 
            className="shape shape-glow"
            style={{
              left: `${mousePos.x * 0.02}px`,
              top: `${mousePos.y * 0.02}px`
            }}
          />
        </div>

        {/* Floating cards */}
        <div className="hero-floating-cards">
          <div className="floating-card fc-1">
            <div className="fc-icon">🎯</div>
            <span>15 Etkinlik Bu Hafta</span>
          </div>
          <div className="floating-card fc-2">
            <div className="fc-icon">🔥</div>
            <span>Trend: AI Workshop</span>
          </div>
          <div className="floating-card fc-3">
            <div className="fc-icon">⭐</div>
            <span>4.9 Kullanıcı Puanı</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge-live" />
            <span>Kampüs Ritmi · Doğuş Üniversitesi</span>
          </div>

          <h1 className="hero-title">
            Kampüs Hayatını
            <span className="title-highlight"> Keşfet</span>
            <br />
            <span className="title-gradient">Deneyimle & Bağlan</span>
          </h1>

          <p className="hero-description">
            Tüm etkinlikleri takip et, kulüplere katıl, yeni insanlarla tanış.  
            Üniversite deneyimini bir üst seviyeye taşı. 
          </p>

          <div className="hero-buttons">
            <Link to="/events" className="btn-hero btn-primary-hero">
              <span>Etkinlikleri Keşfet</span>
              <div className="btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            <Link to="/clubs" className="btn-hero btn-secondary-hero">
              <span>Kulüpleri Gör</span>
            </Link>
          </div>

        </div>

        {/* Wave SVG */}
        <div className="hero-wave">
          <svg viewBox="0 0 1440 200" preserveAspectRatio="none">
            <path
              d="M0,100 C280,180 560,20 720,100 C880,180 1160,20 1440,100 L1440,200 L0,200 Z"
              fill="var(--bg)"
            />
          </svg>
        </div>
      </section>

      {/* ======= STATS BANNER ======= */}
      <section className="stats-banner">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="stat-icon">{stat.icon}</span>
                <div className="stat-info">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= FEATURED EVENTS ======= */}
      <section className="section events-section">
        <div className="container">
          {/* Section Header */}
          <div className="section-header">
            <div className="section-header-content">
              <span className="section-tag">Etkinlikler</span>
              <h2 className="section-title">Yaklaşan Etkinlikler</h2>
              <p className="section-subtitle">Bu haftanın en popüler etkinliklerini kaçırma! </p>
            </div>
            <Link to="/events" className="section-link">
              Tümünü Gör
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Events Grid */}
          <div className="events-grid">
            {featuredEvents.map((event, index) => (
              <Link 
                to={`/events/${event.id}`} 
                key={event.id} 
                className="event-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="event-card-image">
                  <img src={event.imageUrl} alt={event.title} />
                  <div className="event-card-overlay" />
                  <span className="event-category">{event.category}</span>
                  <div className="event-date-badge">
                    <span className="date-day">{event.date.split(" ")[0]}</span>
                    <span className="date-month">{event.date.split(" ")[1]}</span>
                  </div>
                </div>
                <div className="event-card-content">
                  <h3 className="event-card-title">{event.title}</h3>
                  <span className="event-card-club">{event.club}</span>
                  <div className="event-card-meta">
                    <span className="meta-time">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      {event.time}
                    </span>
                  </div>
                  <div className="event-card-action">
                    <span>Detayları Gör</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ======= CLUBS SHOWCASE ======= */}
      <section className="section clubs-section">
        <div className="clubs-bg-pattern" />
        
        <div className="container">
          <div className="section-header section-header-center">
            <span className="section-tag">Kulüpler</span>
            <h2 className="section-title">Popüler Kulüpler</h2>
            <p className="section-subtitle">İlgi alanına göre topluluğunu bul, hemen başvur!</p>
          </div>

          {/* Clubs Scroll Container */}
          <div className="clubs-showcase">
            {clubsLoading ? (
              <div className="loading-placeholder">Kulüpler yükleniyor...</div>
            ) : highlightedClubs.length > 0 ? (
              highlightedClubs.map((club, index) => (
                <Link 
                  to={`/clubs/${club.id}`} 
                  key={club.id} 
                  className="club-showcase-card"
                  style={{ "--club-color": club.color, animationDelay: `${index * 0.1}s` }}
                >
                  <div className="club-card-image">
                    <img src={club.imageUrl} alt={club.name} />
                    <div className="club-card-overlay" />
                  </div>
                  <div className="club-card-info">
                    <h3>{club.name}</h3>
                    <span className="club-members">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {club.members} üye
                    </span>
                  </div>
                  <div className="club-card-hover">
                    <span>Kulübü İncele</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="no-clubs">Henüz kulüp bulunmuyor.</div>
            )}
          </div>

          <div className="clubs-cta">
            <Link to="/clubs" className="btn-explore">
              <span>Tüm Kulüpleri Keşfet</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ======= HOW IT WORKS ======= */}
      <section className="section steps-section">
        <div className="container">
          <div className="section-header section-header-center">
            <span className="section-tag">Başlangıç</span>
            <h2 className="section-title">Nasıl Çalışır?</h2>
            <p className="section-subtitle">Üç basit adımda kampüs hayatına başla</p>
          </div>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="step-card"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="step-image">
                  <img src={step.image} alt={step.title} />
                  <div className="step-number">{step.number}</div>
                </div>
                <div className="step-content">
                  <span className="step-icon">{step.icon}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="step-connector">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= CTA BANNER ======= */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-banner">
            {/* Background Image */}
            <div className="cta-bg-image">
              <img 
                src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1920&q=80" 
                alt="Students"
              />
            </div>
            <div className="cta-overlay" />

            {/* Animated circles */}
            <div className="cta-circles">
              <div className="cta-circle c1" />
              <div className="cta-circle c2" />
              <div className="cta-circle c3" />
            </div>

            {/* Content */}
            <div className="cta-content">
              <span className="cta-badge">🎉 Hemen Başla</span>
              <h2>Kampüs Hayatını Kaçırma! </h2>
              <p>Binlerce öğrenci şimdiden topluluğumuza katıldı. Sen de aramıza katıl, 
                etkinlikleri keşfet ve yeni arkadaşlar edin. </p>
              
              <div className="cta-buttons">
                <Link to="/register" className="btn-cta btn-cta-primary">
                  <span>Ücretsiz Kayıt Ol</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link to="/login" className="btn-cta btn-cta-secondary">
                  <span>Giriş Yap</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="cta-trust">
                <div className="trust-avatars">
                  <img src="https://i.pravatar.cc/100?img=1" alt="User" />
                  <img src="https://i.pravatar.cc/100?img=2" alt="User" />
                    <img src="https://i.pravatar.cc/100?img=3" alt="User" />
                    <img src="https://i.pravatar.cc/100?img=4" alt="User" />
                  <span className="avatar-more">+500</span>
                </div>
                <span className="trust-text">Bu ay 500+ yeni üye katıldı</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
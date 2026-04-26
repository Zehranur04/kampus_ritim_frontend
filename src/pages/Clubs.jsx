// src/pages/ClubPage.jsx
import React, { useState, useEffect } from "react";
import supabase from "../config/supabaseClient";
import { Link } from "react-router-dom";

const ClubsInitialState = []

const initialCategories = [
  { name: "Tümü", id: null, icon: "◉" }
];

export default function ClubPage() {
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid veya list
  const [hoveredCard, setHoveredCard] = useState(null);

  const [clubs, setClubs] = useState(ClubsInitialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoriesList, setCategoriesList] = useState(initialCategories);

  // Mouse pozisyonu için
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  //supabase'den kulüpleri ve kategorileri çek

  useEffect(() => {
    let mounted = true
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

    const getFallbackImage = (categoryId, seedSize = '600x400') => {
      const q = categoryQueries[Number(categoryId)] || 'university,student';
      return `https://source.unsplash.com/${seedSize}/?${encodeURIComponent(q)}`;
    }

    const fetchClubs = async () => {
      try {
        setLoading(true)
        const { data: clubsData, error: clubsError } = await supabase.from("Clubs").select("*")
        if (clubsError) throw clubsError

        const { data: catsData, error: catsError } = await supabase.from("Categories").select("*")
        if (catsError) throw catsError

        const catsMap = (catsData || []).reduce((acc, c) => {
          acc[c.Id ?? c.id] = c.Name ?? c.name
          return acc
        }, {})

        // build categories list for pills
        const catsList = [
          { name: 'Tümü', id: null, icon: '◉' },
          ...(catsData || []).map(c => ({ name: c.Name ?? c.name, id: c.Id ?? c.id, icon: '◻' }))
        ]

        const mapped = (clubsData || []).map((c) => ({
          id: c.Id ?? c.id,
          name: c.Name ?? c.name,
          categoryId: c.CategoryId ?? c.Category ?? c.categoryId ?? null,
          category: catsMap[c.CategoryId] ?? c.CategoryName ?? c.category ?? "Genel",
          memberCount: c.MemberCount ?? c.membercount ?? 0,
          description: c.Description ?? c.description ?? "",
          imageUrl: c.ProfileImageUrl ?? c.profileimageurl ?? c.profileImageUrl ?? getFallbackImage(c.CategoryId ?? c.Category ?? c.categoryId ?? null, '600x400'),
          isOpen: c.IsOpen ?? true,
          color: c.Color ?? "#6366f1",
        }))

        if (mounted) {
          setClubs(mapped)
          setCategoriesList(catsList)
          setError(null)
        }
      } catch (err) {
        if (mounted) setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchClubs()
    return () => { mounted = false }
  }, [])

  const filteredClubs = clubs.filter((club) => {
    const matchesCategory = activeFilter === "Tümü" || club.category === activeFilter;
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="clubs-page">
      {/* Animated background gradient */}
      <div 
        className="clubs-bg-glow"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`
        }}
      />

      {/* HERO - Minimal ve Modern */}
      <section className="clubs-hero-v2">
        <div className="container">
          <div className="clubs-hero-badge">
            <span className="badge-dot" />
            <span>Kampüs Ritmi</span>
          </div>
          
          <h1 className="clubs-hero-title">
            <span className="title-line">Tutkunu Bul,</span>
            <span className="title-line title-gradient">Topluluğuna Katıl</span>
          </h1>
          
          <p className="clubs-hero-subtitle">
            {clubs.length} aktif kulüp 
            {/* {clubs.reduce((acc, c) => acc + c.memberCount, 0)}+ üye */}
          </p>

          {/* Floating stats */}
          <div className="hero-floating-stats">
            <div className="floating-stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Aktif Topluluk</span>
            </div>
            <div className="floating-stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Yıllık Etkinlik</span>
            </div>
            <div className="floating-stat">
              <span className="stat-number">%100</span>
              <span className="stat-label">Ücretsiz Üyelik</span>
            </div>
          </div>
        </div>
      </section>

      {/* KONTROLLER */}
      <section className="clubs-controls">
        <div className="container">
          <div className="controls-wrapper">
            {/* Arama */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Kulüp veya ilgi alanı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="search-clear" onClick={() => setSearchTerm("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* View toggle */}
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid görünüm"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Liste görünüm"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="4" rx="1" />
                  <rect x="3" y="10" width="18" height="4" rx="1" />
                  <rect x="3" y="16" width="18" height="4" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Kategori filtreleri - Pill style */}
          <div className="category-pills">
            {categoriesList.map((cat) => (
              <button
                key={cat.id ?? cat.name}
                className={`category-pill ${activeFilter === cat.name ? "active" : ""}`}
                onClick={() => setActiveFilter(cat.name)}
              >
                <span className="pill-icon">{cat.icon}</span>
                <span className="pill-text">{cat.name}</span>
                {activeFilter === cat.name && <span className="pill-count">
                  {cat.name === "Tümü" 
                    ? clubs.length 
                    : clubs.filter(c => c.category === cat.name).length}
                </span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* KULÜP LİSTESİ */}
      <main className="clubs-main-v2">
        <div className="container">
          {/* Sonuç bilgisi */}
          <div className="results-info">
            <span className="results-count">{filteredClubs.length} kulüp bulundu</span>
            {searchTerm && (
              <span className="results-query">"{searchTerm}" için sonuçlar</span>
            )}
          </div>

          {/* Grid veya List */}
          <div className={`clubs-container ${viewMode}`}>
            {filteredClubs.map((club, index) => (
              <Link
                to={`/clubs/${club.id}`}
                key={club.id}
                className={`club-card-v2 ${viewMode}`}
                style={{ 
                  "--card-color": club.color,
                  "--card-delay": `${index * 0.05}s`
                }}
                onMouseEnter={() => setHoveredCard(club.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Görsel */}
                <div className="card-visual">
                  <img src={club.imageUrl} alt={club.name} />
                  <div className="card-visual-overlay" />
                  
                  {/* Status indicator */}
                  <div className={`status-indicator ${club.isOpen ? 'open' : 'closed'}`}>
                    <span className="status-dot" />
                    <span>{club.isOpen ? 'Açık' : 'Kapalı'}</span>
                  </div>
                </div>

                {/* İçerik */}
                <div className="card-content">
                  <div className="card-header">
                    <span 
                      className="card-category-tag"
                      style={{ backgroundColor: `${club.color}20`, color: club.color }}
                    >
                      {club.category}
                    </span>
                    <span className="card-member-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {club.memberCount}
                    </span>
                  </div>

                  <h3 className="card-title">{club.name}</h3>
                  <p className="card-description">{club.description}</p>

                  <div className="card-footer">
                    <span className="card-cta">
                      Keşfet
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Hover glow effect */}
                <div 
                  className="card-glow"
                  style={{ opacity: hoveredCard === club.id ? 1 : 0 }}
                />
              </Link>
            ))}
          </div>

          {/* Sonuç yok */}
          {filteredClubs.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <path d="M8 8l6 6M14 8l-6 6" />
                </svg>
              </div>
              <h3>Kulüp Bulunamadı</h3>
              <p>Farklı anahtar kelimeler veya filtreler deneyebilirsin.</p>
              <button 
                className="reset-filters-btn"
                onClick={() => { setSearchTerm(""); setActiveFilter("Tümü"); }}
              >
                Filtreleri Sıfırla
              </button>
            </div>
          )}
        </div>
      </main>

      {/* CTA Section */}
      {/* <section className="clubs-cta">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Kendi Kulübünü Kur</h2>
              <p>Aradığın kulübü bulamadın mı? Kendi topluluğunu oluştur ve kampüse yeni bir soluk getir.</p>
              <Link to="/clubs/create" className="cta-button">
                <span>Kulüp Başvurusu Yap</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="cta-decoration">
              <div className="decoration-circle c1" />
              <div className="decoration-circle c2" />
              <div className="decoration-circle c3" />
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
}
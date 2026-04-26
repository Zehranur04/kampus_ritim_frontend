// src/pages/AppointmentsPage.jsx
import React, { useState, useEffect } from "react";
import ProfessorCard from "../components/ProfessorCard";
import { getProfessors } from "../services/appointmentsApi";

/**
 * Öğretim Üyesi Listesi Sayfası
 * Kullanıcı buradan hoca seçerek takvim sayfasına yönlendirilir
 */
export default function AppointmentsPage() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Tümü");

  // Profesörleri yükle
  useEffect(() => {
    let mounted = true;

    const fetchProfessors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProfessors();
        if (mounted) {
          setProfessors(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Öğretim üyeleri yüklenirken hata oluştu");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfessors();

    return () => {
      mounted = false;
    };
  }, []);

  // Departmanları çıkar
  const departments = [
    "Tümü",
    ...new Set(professors.map((p) => p.department)),
  ];

  // Filtreleme
  const filteredProfessors = professors.filter((prof) => {
    const matchesSearch =
      prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "Tümü" || prof.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="appointments-page">
      {/* Hero Section */}
      <section className="appointments-hero">
        <div className="container">
          <div className="appointments-hero__content">
            <h1 className="appointments-hero__title">
              <span className="gradient-text">Öğretim Üyesi</span> Randevu
              Sistemi
            </h1>
            <p className="appointments-hero__subtitle">
              Öğretim üyelerimizle görüşme randevunuzu kolayca alın
            </p>
          </div>
        </div>
        <div className="appointments-hero__bg">
          <div className="appointments-hero__orb appointments-hero__orb--1" />
          <div className="appointments-hero__orb appointments-hero__orb--2" />
        </div>
      </section>

      {/* Filters Section */}
      <section className="appointments-filters">
        <div className="container">
          <div className="appointments-filters__wrapper">
            {/* Search */}
            <div className="appointments-search">
              <svg
                className="appointments-search__icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="appointments-search__input"
                placeholder="Öğretim üyesi veya bölüm ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="appointments-search__clear"
                  onClick={() => setSearchTerm("")}
                >
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
              )}
            </div>

            {/* Department Pills */}
            <div className="appointments-pills">
              {departments.map((dept) => (
                <button
                  key={dept}
                  className={`appointments-pill ${
                    selectedDepartment === dept ? "appointments-pill--active" : ""
                  }`}
                  onClick={() => setSelectedDepartment(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Professors Grid */}
      <section className="appointments-list">
        <div className="container">
          {/* Loading State */}
          {loading && (
            <div className="appointments-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="professor-card-skeleton">
                  <div className="professor-card-skeleton__image skeleton" />
                  <div className="professor-card-skeleton__content">
                    <div className="professor-card-skeleton__name skeleton" />
                    <div className="professor-card-skeleton__dept skeleton" />
                    <div className="professor-card-skeleton__info skeleton" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="appointments-error">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Bir Hata Oluştu</h3>
              <p>{error}</p>
              <button
                className="appointments-error__retry"
                onClick={() => window.location.reload()}
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredProfessors.length === 0 && (
            <div className="appointments-empty">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
              <h3>Sonuç Bulunamadı</h3>
              <p>Arama kriterlerinize uygun öğretim üyesi bulunamadı.</p>
              <button
                className="appointments-empty__clear"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDepartment("Tümü");
                }}
              >
                Filtreleri Temizle
              </button>
            </div>
          )}

          {/* Professors Grid */}
          {!loading && !error && filteredProfessors.length > 0 && (
            <>
              <div className="appointments-results">
                <span className="appointments-results__count">
                  {filteredProfessors.length} öğretim üyesi bulundu
                </span>
              </div>
              <div className="appointments-grid">
                {filteredProfessors.map((professor) => (
                  <ProfessorCard key={professor.id} professor={professor} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// src/components/ProfessorCard.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * Öğretim üyesi kartı komponenti
 * @param {Object} props
 * @param {Object} props.professor - Öğretim üyesi bilgileri
 * @param {Function} [props.onSelect] - Seçim callback'i (isteğe bağlı)
 */
export default function ProfessorCard({ professor, onSelect }) {
  const { id, name, department, email, office, imageUrl } = professor;

  const handleClick = () => {
    if (onSelect) onSelect(professor);
  };

  return (
    <Link
      to={`/appointments/${id}`}
      className="professor-card"
      onClick={handleClick}
    >
      <div className="professor-card__image-wrapper">
        <img
          src={imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`}
          alt={name}
          className="professor-card__image"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
          }}
        />
        <div className="professor-card__overlay">
          <span className="professor-card__cta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Randevu Al
          </span>
        </div>
      </div>
      
      <div className="professor-card__content">
        <h3 className="professor-card__name">{name}</h3>
        <p className="professor-card__department">{department}</p>
        
        <div className="professor-card__info">
          <span className="professor-card__info-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {office || "Belirtilmemiş"}
          </span>
          {email && (
            <span className="professor-card__info-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {email}
            </span>
          )}
        </div>
      </div>

      <div className="professor-card__arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </div>
    </Link>
  );
}

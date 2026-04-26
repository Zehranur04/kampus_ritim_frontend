// src/pages/ProfessorAppointmentsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SlotsCalendar from "../components/SlotsCalendar";
import { getProfessorSlots, createAppointment } from "../services/appointmentsApi";
import supabase from "../config/supabaseClient";

/**
 * Öğretim Üyesi Takvim Sayfası
 * Seçili hocanın müsait slotlarını gösterir ve randevu almayı sağlar
 */
export default function ProfessorAppointmentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const professorId = parseInt(id, 10);

  const [professor, setProfessor] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Toast göster
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Profesörü bul (mock data'dan)
  useEffect(() => {
    let mounted = true;
    const fetchProfessor = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("Professors")
          .select("*")
          .eq("Id", professorId)
          .limit(1)

        if (error) {
          throw error
        }

        const row = data && data[0]
        if (!row) {
          if (mounted) {
            setError("Öğretim üyesi bulunamadı");
            setProfessor(null);
            setLoading(false);
          }
          return
        }

        // Map DB columns to component props (case-insensitive) with sensible defaults
        const nameVal = row.Name ?? row.name ?? ""
        const emailDomain = import.meta.env.VITE_DEFAULT_PROFESSOR_EMAIL_DOMAIN || "dou.edu.tr"

        const charMap = {
          ç: "c",
          Ç: "c",
          ğ: "g",
          Ğ: "g",
          ı: "i",
          İ: "i",
          ö: "o",
          Ö: "o",
          ş: "s",
          Ş: "s",
          ü: "u",
          Ü: "u",
        }

        const sanitize = (s = "") =>
          String(s)
            .trim()
            .split("")
            .map((ch) => charMap[ch] || ch)
            .join("")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")

        const titleTokens = new Set([
          "prof",
          "prof.",
          "prof.dr",
          "prof.dr.",
          "dr",
          "dr.",
          "doç",
          "doç.",
          "doç.dr",
          "doç.dr.",
          "dr.öğr",
          "dr.öğr.",
          "öğr",
          "öğr.",
          "öğr.üyesi",
          "öğrüyesi",
        ])

        const makeEmailFromName = (fullName = "") => {
          const tokens = String(fullName)
            .replace(/\./g, "")
            .split(/\s+/)
            .filter(Boolean)

          const meaningful = tokens.filter((t) => {
            return !titleTokens.has(t.toLowerCase())
          })

          const pick = meaningful.length ? meaningful : tokens
          const first = pick[0] || ""
          const last = pick[pick.length - 1] || ""
          const initial = first.charAt(0) || ""

          const local = `${sanitize(initial)}.${sanitize(last)}`.replace(/^\.|\.$/g, "")
          if (!local || local === ".") return ""
          return `${local}@${emailDomain}`
        }

        const defaultEmail = makeEmailFromName(nameVal)
        const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          nameVal || "Profesör"
        )}&background=6366f1&color=fff&size=200`

        const prof = {
          id: row.Id ?? row.id,
          name: nameVal,
          department: row.Department ?? row.department,
          office: row.Office ?? row.office ?? "",
          email: row.Email ?? row.email ?? defaultEmail,
          imageUrl: row.ImageUrl ?? row.imageUrl ?? defaultImage,
        }

        if (mounted) {
          setProfessor(prof);
        }
      } catch (err) {
        console.error("Professor fetch error:", err);
        if (mounted) setError("Öğretim üyesi yüklenirken hata oluştu");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfessor();

    return () => {
      mounted = false;
    };
  }, [professorId]);

  // Slotları yükle
  const fetchSlots = useCallback(async () => {
    if (!professorId) return;

    try {
      setLoading(true);
      setError(null);
      const slots = await getProfessorSlots(professorId);
      setBookedSlots(slots);
    } catch (err) {
      // API yoksa hata gösterme, boş takvim göster
      if (err.code !== "ERR_NETWORK") {
        console.error("Slot yükleme hatası:", err);
      }
      setBookedSlots([]);
    } finally {
      setLoading(false);
    }
  }, [professorId]);

  useEffect(() => {
    if (professor) {
      fetchSlots();
    }
  }, [professor, fetchSlots]);

  // Randevu oluştur
  const handleSlotSelect = async (slot) => {
    if (bookingInProgress) return;

    let addedOptimistic = false;
    let caughtError = null;
    try {
      console.debug("ProfessorAppointmentsPage: handleSlotSelect start", slot);
      setBookingInProgress(true);

      // Optimistic UI: mark slot as booked immediately
      setBookedSlots((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        // avoid duplicates
        if (arr.some((s) => s.startTime === slot.startTime)) return arr;
        addedOptimistic = true;
        return [...arr, { startTime: slot.startTime, endTime: slot.endTime }];
      });

      // Determine backend user id from stored JWT token (if available)
      const token = localStorage.getItem("token");
      let backendUserId = 0;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          backendUserId = parseInt(payload.sub || payload?.Sub || 0, 10) || 0;
        } catch (e) {
          console.warn("Could not parse backend token to get user id", e.message);
        }
      }

      // Create appointment request expected by backend
      console.debug("ProfessorAppointmentsPage: sending createAppointment", { ProfessorId: professorId, UserId: backendUserId, Date: slot.startTime });
      await createAppointment({
        ProfessorId: professorId,
        UserId: backendUserId,
        Date: slot.startTime,
      });

      console.debug("ProfessorAppointmentsPage: createAppointment resolved");
      showToast("Randevu alındı ✅", "success");

      // Takvimi yenile
      await fetchSlots();
      console.debug("ProfessorAppointmentsPage: fetchSlots finished");
    } catch (err) {
      caughtError = err;
      if (err.code === "SLOT_TAKEN") {
        showToast("Bu saat az önce doldu!", "error");
      } else if (
        err.code === "ERR_NETWORK" || 
        err.code === "ERR_CONNECTION_REFUSED" ||
        err.message?.includes("Network Error") ||
        !err.response
      ) {
        // Demo modunda başarılı kabul et (backend yok)
        showToast("Randevu alındı ✅", "success");
        // Demo: slot'u dolu olarak işaretle
        setBookedSlots((prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          if (arr.some((s) => s.startTime === slot.startTime)) return arr;
          return [...arr, { startTime: slot.startTime, endTime: slot.endTime }];
        });
      } else {
        showToast(
          err.response?.data?.message || "Randevu oluşturulamadı",
          "error"
        );
      }
    } finally {
      // if optimistic update was added but the booking failed (and not network demo), remove optimistic slot
      if (
        addedOptimistic &&
        caughtError &&
        !(caughtError.code === "ERR_NETWORK" || !caughtError.response)
      ) {
        setBookedSlots((prev) => prev.filter((s) => s.startTime !== slot.startTime));
      }
      setBookingInProgress(false);
    }
  };

  // Profesör bulunamadı
  if (!professor && !loading) {
    return (
      <div className="professor-appointments-page">
        <div className="container">
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
            <h3>Öğretim Üyesi Bulunamadı</h3>
            <p>Aradığınız öğretim üyesi sistemde kayıtlı değil.</p>
            <Link to="/appointments" className="appointments-error__retry">
              Geri Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="professor-appointments-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          <div className="toast__icon">
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
          <span className="toast__message">{toast.message}</span>
          <button className="toast__close" onClick={() => setToast(null)}>
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

      {/* Booking overlay */}
      {bookingInProgress && (
        <div className="booking-overlay">
          <div className="booking-spinner" />
          <span>Randevu oluşturuluyor...</span>
        </div>
      )}

      {/* Header */}
      <section className="professor-header">
        <div className="container">
          <Link to="/appointments" className="professor-header__back">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Geri Dön
          </Link>

          {professor && (
            <div className="professor-header__info">
              <img
                src={
                  professor.imageUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    professor.name
                  )}&background=6366f1&color=fff&size=200`
                }
                alt={professor.name}
                className="professor-header__image"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    professor.name
                  )}&background=6366f1&color=fff&size=200`;
                }}
              />
              <div className="professor-header__details">
                <h1 className="professor-header__name">{professor.name}</h1>
                <p className="professor-header__department">
                  {professor.department}
                </p>
                <div className="professor-header__meta">
                  <span className="professor-header__meta-item">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {professor.office || "Belirtilmemiş"}
                  </span>
                  {professor.email && (
                    <span className="professor-header__meta-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      {professor.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="professor-header__bg">
          <div className="professor-header__orb professor-header__orb--1" />
          <div className="professor-header__orb professor-header__orb--2" />
        </div>
      </section>

      {/* Calendar Section */}
      <section className="professor-calendar">
        <div className="container">
          <div className="professor-calendar__header">
            <h2 className="professor-calendar__title">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Müsait Saatler
            </h2>
            <p className="professor-calendar__subtitle">
              Yeşil slotlara tıklayarak randevu alabilirsiniz
            </p>
          </div>

          {error && !loading ? (
            <div className="appointments-error">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Takvim Yüklenemedi</h3>
              <p>{error}</p>
              <button
                className="appointments-error__retry"
                onClick={fetchSlots}
              >
                Tekrar Dene
              </button>
            </div>
          ) : (
            <SlotsCalendar
              bookedSlots={bookedSlots}
              onSlotSelect={handleSlotSelect}
              loading={loading}
              daysToShow={7}
            />
          )}
        </div>
      </section>
    </div>
  );
}

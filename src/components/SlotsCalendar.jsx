// src/components/SlotsCalendar.jsx
import React, { useState, useMemo } from "react";
import {
  generateSlotsForDays,
  isSlotBooked,
  DEFAULT_DAYS_TO_SHOW,
} from "../utils/date";

/**
 * Takvim grid komponenti - Boş/Dolu slot gösterimi
 * @param {Object} props
 * @param {Array} props.bookedSlots - API'den gelen dolu slotlar
 * @param {Function} props.onSlotSelect - Slot seçildiğinde çağrılır
 * @param {boolean} props.loading - Yükleniyor durumu
 * @param {number} [props.daysToShow] - Gösterilecek gün sayısı
 */
export default function SlotsCalendar({
  bookedSlots = [],
  onSlotSelect,
  loading = false,
  daysToShow = DEFAULT_DAYS_TO_SHOW,
}) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Slot verilerini üret
  const { dates, slotsByDate } = useMemo(
    () => generateSlotsForDays(daysToShow),
    [daysToShow]
  );

  const handleSlotClick = (slot) => {
    if (isSlotBooked(bookedSlots, slot.startTime)) return;
    setSelectedSlot(slot);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (selectedSlot && onSlotSelect) {
      console.debug("SlotsCalendar: confirming slot", selectedSlot);
      try {
        onSlotSelect(selectedSlot);
        console.debug("SlotsCalendar: onSlotSelect invoked");
      } catch (e) {
        console.error("SlotsCalendar: onSlotSelect threw", e);
      }
    }
    setShowConfirmModal(false);
    setSelectedSlot(null);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setSelectedSlot(null);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="slots-calendar slots-calendar--loading">
        <div className="slots-calendar__header">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="slots-calendar__day-header skeleton" />
          ))}
        </div>
        <div className="slots-calendar__body">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="slots-calendar__row">
              {[...Array(7)].map((_, j) => (
                <div key={j} className="slots-calendar__slot skeleton" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="slots-calendar">
        {/* Legend */}
        <div className="slots-calendar__legend">
          <span className="slots-calendar__legend-item">
            <span className="slots-calendar__legend-dot slots-calendar__legend-dot--available" />
            Müsait
          </span>
          <span className="slots-calendar__legend-item">
            <span className="slots-calendar__legend-dot slots-calendar__legend-dot--booked" />
            Dolu
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="slots-calendar__container">
          {/* Day Headers */}
          <div className="slots-calendar__header">
            <div className="slots-calendar__time-label" />
            {dates.map((day) => (
              <div
                key={day.dateKey}
                className={`slots-calendar__day-header ${
                  day.isToday ? "slots-calendar__day-header--today" : ""
                }`}
              >
                <span className="slots-calendar__day-name">{day.dayName}</span>
                <span className="slots-calendar__day-date">{day.displayDate}</span>
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div className="slots-calendar__body">
            {slotsByDate[dates[0]?.dateKey]?.map((timeSlot, rowIndex) => (
              <div key={rowIndex} className="slots-calendar__row">
                {/* Time Label */}
                <div className="slots-calendar__time-label">
                  {timeSlot.displayTime.split(" - ")[0]}
                </div>

                {/* Slots for each day */}
                {dates.map((day) => {
                  const slot = slotsByDate[day.dateKey]?.[rowIndex];
                  if (!slot) return null;

                  const isBooked = isSlotBooked(bookedSlots, slot.startTime);
                  const isSelected =
                    selectedSlot?.startTime === slot.startTime;

                  return (
                    <button
                      key={`${day.dateKey}-${rowIndex}`}
                      className={`slots-calendar__slot ${
                        isBooked
                          ? "slots-calendar__slot--booked"
                          : "slots-calendar__slot--available"
                      } ${isSelected ? "slots-calendar__slot--selected" : ""}`}
                      onClick={() => handleSlotClick(slot)}
                      disabled={isBooked}
                      title={
                        isBooked
                          ? "Bu slot dolu"
                          : `${day.displayDate} ${slot.displayTime}`
                      }
                    >
                      {isBooked ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Vertical list view */}
        <div className="slots-calendar__mobile">
          {dates.map((day) => (
            <div key={day.dateKey} className="slots-calendar__mobile-day">
              <div
                className={`slots-calendar__mobile-day-header ${
                  day.isToday ? "slots-calendar__mobile-day-header--today" : ""
                }`}
              >
                <span className="slots-calendar__mobile-day-name">
                  {day.dayName}
                </span>
                <span className="slots-calendar__mobile-day-date">
                  {day.displayDate}
                </span>
              </div>
              <div className="slots-calendar__mobile-slots">
                {slotsByDate[day.dateKey]?.map((slot, idx) => {
                  const isBooked = isSlotBooked(bookedSlots, slot.startTime);
                  return (
                    <button
                      key={idx}
                      className={`slots-calendar__mobile-slot ${
                        isBooked
                          ? "slots-calendar__mobile-slot--booked"
                          : "slots-calendar__mobile-slot--available"
                      }`}
                      onClick={() => handleSlotClick(slot)}
                      disabled={isBooked}
                    >
                      {slot.displayTime}
                      {isBooked && <span className="booked-label">Dolu</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && selectedSlot && (
        <div className="slots-modal-overlay" onClick={handleCancel}>
          <div
            className="slots-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="slots-modal__icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <polyline points="9 16 11 18 15 14" />
              </svg>
            </div>
            <h3 className="slots-modal__title">Randevu Onayı</h3>
            <p className="slots-modal__message">
              Bu slot için randevu almak istediğinize emin misiniz?
            </p>
            <div className="slots-modal__slot-info">
              <span className="slots-modal__date">
                {dates.find(
                  (d) =>
                    d.dateKey ===
                    new Date(selectedSlot.startTime)
                      .toISOString()
                      .split("T")[0]
                )?.dayName || ""}{" "}
                -{" "}
                {dates.find(
                  (d) =>
                    d.dateKey ===
                    new Date(selectedSlot.startTime)
                      .toISOString()
                      .split("T")[0]
                )?.displayDate || ""}
              </span>
              <span className="slots-modal__time">
                {selectedSlot.displayTime}
              </span>
            </div>
            <div className="slots-modal__actions">
              <button
                className="slots-modal__btn slots-modal__btn--cancel"
                onClick={handleCancel}
              >
                İptal
              </button>
              <button
                className="slots-modal__btn slots-modal__btn--confirm"
                onClick={handleConfirm}
              >
                Randevu Al
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

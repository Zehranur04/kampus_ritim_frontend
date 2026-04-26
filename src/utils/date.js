// src/utils/date.js
// Takvim slot üretme yardımcıları

// Kolay değiştirilebilir sabitler
export const SLOT_DURATION_MINUTES = 30;
export const START_HOUR = 9;
export const END_HOUR = 17;
export const DEFAULT_DAYS_TO_SHOW = 7;

/**
 * Belirli bir gün için tüm slotları üretir
 * @param {Date} date - Gün tarihi
 * @returns {Array} Slot array'i [{startTime, endTime, date}]
 */
export function generateSlotsForDay(date) {
  const slots = [];
  const dayStart = new Date(date);
  dayStart.setHours(START_HOUR, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(END_HOUR, 0, 0, 0);

  let current = new Date(dayStart);

  while (current < dayEnd) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + SLOT_DURATION_MINUTES * 60000);

    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      date: formatDateKey(slotStart),
      displayTime: formatTimeRange(slotStart, slotEnd),
      hour: slotStart.getHours(),
      minute: slotStart.getMinutes(),
    });

    current = slotEnd;
  }

  return slots;
}

/**
 * Belirtilen gün sayısı için tüm slotları üretir (bugünden başlayarak)
 * @param {number} days - Kaç günlük slot üretileceği
 * @returns {Object} { dates: [], slotsByDate: { 'YYYY-MM-DD': [...slots] } }
 */
export function generateSlotsForDays(days = DEFAULT_DAYS_TO_SHOW) {
  const dates = [];
  const slotsByDate = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);
    
    dates.push({
      date,
      dateKey,
      displayDate: formatDisplayDate(date),
      dayName: getDayName(date),
      isToday: i === 0,
    });

    slotsByDate[dateKey] = generateSlotsForDay(date);
  }

  return { dates, slotsByDate };
}

/**
 * Tarih key'i formatlar (YYYY-MM-DD)
 */
export function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Saat aralığını formatlar (09:00 - 09:30)
 */
export function formatTimeRange(start, end) {
  const formatTime = (d) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Görüntüleme tarihini formatlar (16 Ara)
 */
export function formatDisplayDate(date) {
  const d = new Date(date);
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Gün adını döndürür
 */
export function getDayName(date) {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[date.getDay()];
}

/**
 * ISO string'den saat bilgisini çıkarır
 */
export function extractTimeFromISO(isoString) {
  const d = new Date(isoString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Dolu slotları kontrol eder
 * @param {Array} bookedSlots - API'den gelen dolu slotlar
 * @param {string} slotStartTime - Kontrol edilecek slot başlangıç zamanı
 * @returns {boolean} Slot dolu mu?
 */
export function isSlotBooked(bookedSlots, slotStartTime) {
  if (!bookedSlots || !Array.isArray(bookedSlots)) return false;
  
  const slotStart = new Date(slotStartTime).getTime();
  
  return bookedSlots.some(booked => {
    const candidate = booked.startTime || booked.StartTime || booked.Date || booked.date || booked.DateTime || booked.DateUtc;
    const bookedStart = new Date(candidate).getTime();
    return bookedStart === slotStart;
  });
}

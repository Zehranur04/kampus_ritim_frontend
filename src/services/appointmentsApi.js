// src/services/appointmentsApi.js
import api from "../api/apiService";
import supabase from "../config/supabaseClient";

// Mock professors data - endpoint geldiğinde bu kaldırılabilir
export const MOCK_PROFESSORS = [
  {
    id: 1,
    name: "Prof. Dr. Ahmet Yılmaz",
    department: "Bilgisayar Mühendisliği",
    email: "ahmet.yilmaz@dogus.edu.tr",
    office: "A-301",
    imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Doç. Dr. Elif Kaya",
    department: "Elektrik-Elektronik Mühendisliği",
    email: "elif.kaya@dogus.edu.tr",
    office: "B-215",
    imageUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 3,
    name: "Dr. Öğr. Üyesi Mehmet Demir",
    department: "Yazılım Mühendisliği",
    email: "mehmet.demir@dogus.edu.tr",
    office: "A-412",
    imageUrl: "https://randomuser.me/api/portraits/men/65.jpg",
  },
  {
    id: 4,
    name: "Prof. Dr. Zeynep Arslan",
    department: "Endüstri Mühendisliği",
    email: "zeynep.arslan@dogus.edu.tr",
    office: "C-102",
    imageUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: 5,
    name: "Doç. Dr. Can Öztürk",
    department: "Mekatronik Mühendisliği",
    email: "can.ozturk@dogus.edu.tr",
    office: "D-305",
    imageUrl: "https://randomuser.me/api/portraits/men/42.jpg",
  },
  {
    id: 6,
    name: "Dr. Öğr. Üyesi Ayşe Yıldırım",
    department: "Bilgisayar Mühendisliği",
    email: "ayse.yildirim@dogus.edu.tr",
    office: "A-208",
    imageUrl: "https://randomuser.me/api/portraits/women/33.jpg",
  },
];

/**
 * Öğretim üyelerini getirir
 * NOT: Endpoint yoksa mock data döner
 */
export async function getProfessors() {
  try {
    // API endpoint geldiğinde bu satırı aktif et:
    // const response = await api.get("/api/professors");
    // return response.data;
    // Try Supabase first (returns all professors)
    try {
      const { data, error } = await supabase
        .from("Professors")
        .select("*")

      if (error) {
        console.warn("Supabase getProfessors error:", error)
      } else if (data) {
        // Map DB rows to the UI shape
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

        const mapped = data.map((r) => {
            const name = r.Name ?? r.name ?? ""
            const defaultEmail = makeEmailFromName(name)
            const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              name || "Profesör"
            )}&background=6366f1&color=fff&size=200`

            return {
              id: typeof r.Id === "string" ? parseInt(r.Id, 10) : r.Id ?? r.id,
              name,
              department: r.Department ?? r.department,
              email: r.Email ?? r.email ?? defaultEmail,
              office: r.Office ?? r.office ?? "",
              imageUrl: r.ImageUrl ?? r.imageUrl ?? defaultImage,
            }
          })

        return mapped
      }

    } catch (e) {
      console.warn("Supabase fetch failed, falling back to mock:", e)
    }

    // Fallback: mock data
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_PROFESSORS), 300);
    });
  } catch (error) {
    console.error("Profesörler getirilemedi:", error);
    throw error;
  }
}

/**
 * Öğretim üyesinin dolu slotlarını getirir
 * @param {number} professorId - Öğretim üyesi ID
 * @returns {Promise<Array>} Dolu slot listesi
 */
export async function getProfessorSlots(professorId) {
  try {
    const response = await api.get(`/api/appointments/professor/${professorId}/slots`);

    // Normalize backend response into an array of { startTime, endTime }
    const payload = response.data;

    // possible shapes: { Appointments: [...] } or { appointments: [...] } or an array directly
    const list =
      (payload && (payload.Appointments || payload.appointments)) ||
      (Array.isArray(payload) ? payload : null);

    if (!list) return [];

    return list.map((a) => {
      // backend fields might be Date, date, or DateTime
      const dateVal = a.Date ?? a.date ?? a.DateTime ?? a.dateTime ?? a.StartTime ?? a.startTime;
      const start = new Date(dateVal).toISOString();
      const end = new Date(new Date(dateVal).getTime() + 30 * 60000).toISOString();
      return { startTime: start, endTime: end };
    });
  } catch (error) {
    console.error("Slotlar getirilemedi:", error);
    // API yoksa boş array döndür (geliştirme amaçlı)
    if (error.response?.status === 404 || error.code === "ERR_NETWORK") {
      console.warn("API endpoint bulunamadı, boş slot listesi döndürülüyor");
      return [];
    }
    throw error;
  }
}

/**
 * Randevu oluşturur
 * @param {Object} appointmentData - Randevu bilgileri
 * @param {number} appointmentData.professorId - Öğretim üyesi ID
 * @param {string} appointmentData.startTime - Başlangıç zamanı (ISO string)
 * @param {string} appointmentData.endTime - Bitiş zamanı (ISO string)
 * @param {string} [appointmentData.notes] - Ek notlar
 * @returns {Promise<Object>} Oluşturulan randevu
 */
export async function createAppointment(appointmentData) {
  try {
    const response = await api.post("/api/appointments", appointmentData);
    return response.data;
  } catch (error) {
    console.error("Randevu oluşturulamadı:", error);
    
    // Slot doluysa özel hata
    if (error.response?.status === 409) {
      const err = new Error("Bu saat az önce doldu!");
      err.code = "SLOT_TAKEN";
      throw err;
    }
    
    throw error;
  }
}

/**
 * Kullanıcının randevularını getirir
 */
export async function getMyAppointments() {
  try {
    const response = await api.get("/api/appointments/my");
    return response.data;
  } catch (error) {
    console.error("Randevular getirilemedi:", error);
    throw error;
  }
}

/**
 * Randevuyu iptal eder
 * @param {number} appointmentId - Randevu ID
 */
export async function cancelAppointment(appointmentId) {
  try {
    const response = await api.delete(`/api/appointments/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error("Randevu iptal edilemedi:", error);
    throw error;
  }
}

export default {
  getProfessors,
  getProfessorSlots,
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  MOCK_PROFESSORS,
};

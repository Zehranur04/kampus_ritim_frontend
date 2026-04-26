export function isAllowedSchoolEmail(email) {
  if (!email) return false;
  const allowed = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.some(d => email.toLowerCase().endsWith(`@${d.toLowerCase()}`));
}

export function strongPassword(pwd) {
  return typeof pwd === "string" && /[A-Za-z]/.test(pwd) && /\d/.test(pwd) && pwd.length >= 8;
}

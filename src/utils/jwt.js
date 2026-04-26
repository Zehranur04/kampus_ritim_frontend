export function tryGetJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function tryGetBackendUserIdFromToken() {
  try {
    const token = window?.localStorage?.getItem('token');
    const payload = tryGetJwtPayload(token);
    const sub = payload?.sub;
    const userId = Number(sub);
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

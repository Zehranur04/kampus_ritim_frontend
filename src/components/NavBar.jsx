import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { profileApi } from "../api/apiService";
import supabase from "../config/supabaseClient";

// Admin email listesi - bu emaillerle giriş yapan kullanıcılar admin paneline erişebilir
// Admin email listesi kaldırıldı, artık isAdmin backend DB rolünden gelir.

export default function NavBar() {
  const { user, logout, isAdmin, backendUser } = useAuth();
  const location = useLocation();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const notificationRef = useRef(null);

  // Load backend profile image for navbar avatar
  useEffect(() => {
    let mounted = true;

    const loadProfileImage = async () => {
      if (!user) {
        if (mounted) setProfileImageUrl(null);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) setProfileImageUrl(null);
        return;
      }

      try {
        const res = await profileApi.get();
        const data = res?.data?.profile ?? res?.data ?? null;
        const img = data?.profileImageUrl ?? data?.ProfileImageUrl ?? null;
        if (!mounted) return;
        setProfileImageUrl(typeof img === 'string' && img.trim().length > 0 ? img.trim() : null);
      } catch {
        if (!mounted) return;
        // fail silently; fallback to initials
        setProfileImageUrl(null);
      }
    };

    loadProfileImage();

    const onTokenUpdated = () => {
      loadProfileImage();
    };
    try {
      window.addEventListener('tokenUpdated', onTokenUpdated);
    } catch {
      // ignore
    }

    return () => {
      mounted = false;
      try {
        window.removeEventListener('tokenUpdated', onTokenUpdated);
      } catch {
        // ignore
      }
    };
  }, [user]);

  const [notifications, setNotifications] = useState([]);

  const getBackendUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return 0;
      const payload = JSON.parse(atob(token.split(".")[1]));
      const raw = payload?.sub ?? payload?.Sub ?? payload?.nameid ?? payload?.NameIdentifier;
      const parsed = parseInt(raw || 0, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  };

  const getCurrentBackendUserId = () => {
    const idFromCtx = backendUser?.id ? Number(backendUser.id) : 0;
    if (idFromCtx) return idFromCtx;
    return getBackendUserIdFromToken();
  };

  const formatRelativeTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return `${diffSec} sn önce`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} saat önce`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} gün önce`;
    const diffWeek = Math.floor(diffDay / 7);
    return `${diffWeek} hafta önce`;
  };

  const mapRowToNotification = (row) => {
    const id = row?.Id ?? row?.id;
    const message = row?.Message ?? row?.message ?? "";
    const isRead = !!(row?.IsRead ?? row?.isRead);
    const relatedEventId = row?.RelatedEventId ?? row?.relatedEventId ?? null;
    const createdAt = row?.CreatedAt ?? row?.createdAt ?? null;

    const isEvent = relatedEventId != null && relatedEventId !== "";
    const type = isEvent ? "event" : "announcement";

    return {
      id,
      type,
      title: isEvent ? "Yeni Etkinlik" : "Duyuru",
      message,
      time: formatRelativeTime(createdAt),
      isRead,
      icon: isEvent ? "📅" : "📢",
      createdAt,
    };
  };

  // Load notifications for current backend user + realtime updates
  useEffect(() => {
    let mounted = true;
    let channel;

    const load = async () => {
      if (!user) {
        if (mounted) setNotifications([]);
        return;
      }

      const userId = getCurrentBackendUserId();
      if (!userId) {
        if (mounted) setNotifications([]);
        return;
      }

      try {
        const res = await supabase
          .from("Notifications")
          .select("*")
          .eq("UserId", userId)
          .order("CreatedAt", { ascending: false });

        if (res.error) throw res.error;
        const rows = Array.isArray(res.data) ? res.data : [];
        if (mounted) setNotifications(rows.map(mapRowToNotification));

        channel = supabase
          .channel(`navbar_notifications_user_${userId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "Notifications", filter: `UserId=eq.${userId}` },
            (payload) => {
              if (!mounted) return;
              const evt = payload?.eventType;
              if (evt === "INSERT") {
                const next = mapRowToNotification(payload.new);
                setNotifications((prev) => {
                  const exists = prev.some((n) => n.id === next.id);
                  return exists ? prev : [next, ...prev];
                });
              } else if (evt === "UPDATE") {
                const next = mapRowToNotification(payload.new);
                setNotifications((prev) => prev.map((n) => (n.id === next.id ? { ...n, ...next } : n)));
              } else if (evt === "DELETE") {
                const deletedId = payload?.old?.Id ?? payload?.old?.id;
                if (!deletedId) return;
                setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
              }
            }
          )
          .subscribe();
      } catch {
        // Silent fail: keep UI usable even if RLS blocks
        if (mounted) setNotifications([]);
      }
    };

    load();

    return () => {
      mounted = false;
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [user, backendUser?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Check if user is admin
  // isAdmin artık backend DB rolünden gelir (AuthContext -> /api/auth/me)

  // Scroll efekti
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sayfa değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Mobil menü açıkken scroll'u engelle
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Bildirim dropdown'ını dışarı tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bildirimi okundu olarak işaretle
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );

    const userId = getCurrentBackendUserId();
    if (!userId) return;
    supabase
      .from("Notifications")
      .update({ IsRead: true })
      .eq("Id", id)
      .eq("UserId", userId);
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    const userId = getCurrentBackendUserId();
    if (!userId) return;
    supabase
      .from("Notifications")
      .update({ IsRead: true })
      .eq("UserId", userId)
      .eq("IsRead", false);
  };

  // Bildirimi sil
  const deleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));

    const userId = getCurrentBackendUserId();
    if (!userId) return;
    supabase
      .from("Notifications")
      .delete()
      .eq("Id", id)
      .eq("UserId", userId);
  };

  const navLinks = [
    { to: "/", label: "Ana Sayfa", icon: "🏠" },
    { to: "/events", label: "Etkinlikler", icon: "📅" },
    { to: "/clubs", label: "Kulüpler", icon: "🏛️" },
    { to: "/appointments", label: "Randevu Al", icon: "📋" },
    ...(user && !isAdmin ? [{ to: "/room-reservation", label: "Oda Talebi", icon: "🚪" }] : []),
    //{ to: "/profile", label: "Profil", icon: "👤" },
    //{ to: "/about", label: "Hakkımızda", icon: "ℹ️" },
  ];

  // Add admin link if user is admin
  const allNavLinks = isAdmin 
    ? [...navLinks, { to: "/admin", label: "Admin Panel", icon: "⚙️" }]
    : navLinks;

  return (
    <>
      <header className={`navbar ${isScrolled ?  "navbar-scrolled" : ""}`}>
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/" className="navbar-brand">
            <div className="brand-logo">
              <img
                src="/kr_logo-256.png"
                srcSet="/kr_logo-256.png 1x, /kr_logo-512.png 2x"
                alt="Kampüs Ritmi"
                decoding="async"
              />
              <div className="brand-glow" />
            </div>
            <div className="brand-text">
              <span className="brand-name">Kampüs Ritmi</span>
              <span className="brand-tagline">Doğuş Üniversitesi</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="navbar-nav">
            {allNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link-active" : ""}`
                }
                end={link.to === "/"}
              >
                <span className="nav-link-text">{link.label}</span>
                <span className="nav-link-indicator" />
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="notification-wrapper" ref={notificationRef}>
                  <button
                    className={`notification-btn ${isNotificationOpen ? 'active' : ''}`}
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    aria-label="Bildirimler"
                  >
                    <svg className="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="notification-badge">
                        <span className="badge-number">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        <span className="badge-ping" />
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <div className={`notification-dropdown ${isNotificationOpen ? 'active' : ''}`}>
                    <div className="notification-header">
                      <h3 className="notification-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        Bildirimler
                      </h3>
                      {unreadCount > 0 && (
                        <button className="mark-all-read" onClick={markAllAsRead}>
                          Tümünü okundu işaretle
                        </button>
                      )}
                    </div>

                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <div className="notification-icon-wrapper">
                              <span className="notification-icon">{notification.icon}</span>
                              {!notification.isRead && <span className="unread-dot" />}
                            </div>
                            <div className="notification-content">
                              <div className="notification-item-header">
                                <span className="notification-item-title">{notification.title}</span>
                                <span className="notification-time">{notification.time}</span>
                              </div>
                              <p className="notification-message">{notification.message}</p>
                            </div>
                            <button
                              className="notification-delete"
                              onClick={(e) => deleteNotification(notification.id, e)}
                              aria-label="Bildirimi sil"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">
                          <div className="empty-icon">🔔</div>
                          <p>Henüz bildirim yok</p>
                          <span>Yeni bildirimler burada görünecek</span>
                        </div>
                      )}
                    </div>

                    <div className="notification-footer">
                      <Link
                        to="/notifications"
                        className="view-all-btn"
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        Tüm Bildirimleri Gör
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                <Link to="/profile" className="user-button">
                  <div className="user-avatar">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profil" />
                    ) : (
                      user?. firstName?. charAt(0) || "U"
                    )}
                  </div>
                  <span className="user-name">{user?.firstName || "Kullanıcı"}</span>
                </Link>
                <button className="btn-nav btn-logout" onClick={logout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Çıkış</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-nav btn-ghost">
                  Giriş Yap
                </Link>
                <Link to="/register" className="btn-nav btn-primary">
                  <span>Kayıt Ol</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="mobile-actions" ref={notificationRef}>
            {user && (
              <button
                className={`notification-btn mobile-notification-btn ${isNotificationOpen ? 'active' : ''}`}
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                aria-label="Bildirimler"
              >
                <svg className="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    <span className="badge-number">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    <span className="badge-ping" />
                  </span>
                )}
              </button>
            )}
            <button
              className={`mobile-menu-btn ${isMobileMenuOpen ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menü"
            >
              <span className="hamburger-line line-1" />
              <span className="hamburger-line line-2" />
              <span className="hamburger-line line-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Notification Dropdown */}
      {user && (
        <div className={`mobile-notification-dropdown ${isNotificationOpen ? 'active' : ''}`}>
          <div className="notification-header">
            <h3 className="notification-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Bildirimler
            </h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="notification-icon-wrapper">
                    <span className="notification-icon">{notification.icon}</span>
                    {!notification.isRead && <span className="unread-dot" />}
                  </div>
                  <div className="notification-content">
                    <div className="notification-item-header">
                      <span className="notification-item-title">{notification.title}</span>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => deleteNotification(notification.id, e)}
                    aria-label="Bildirimi sil"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <div className="empty-icon">🔔</div>
                <p>Henüz bildirim yok</p>
                <span>Yeni bildirimler burada görünecek</span>
              </div>
            )}
          </div>

          <div className="notification-footer">
            <Link
              to="/notifications"
              className="view-all-btn"
              onClick={() => setIsNotificationOpen(false)}
            >
              Tüm Bildirimleri Gör
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Notification Overlay */}
      <div
        className={`mobile-notification-overlay ${isNotificationOpen ? 'active' : ''}`}
        onClick={() => setIsNotificationOpen(false)}
      />

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? "active" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? "active" : ""}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="mobile-brand" onClick={() => setIsMobileMenuOpen(false)}>
            <img
              src="/kr_logo-256.png"
              srcSet="/kr_logo-256.png 1x, /kr_logo-512.png 2x"
              alt="Kampüs Ritmi"
              decoding="async"
            />
            <span>Kampüs Ritmi</span>
          </Link>
        </div>

        <nav className="mobile-nav">
          {allNavLinks.map((link, index) => (
            <NavLink
              key={link. to}
              to={link.to}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? "mobile-nav-link-active" : ""}`
              }
              end={link.to === "/"}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="mobile-nav-icon">{link.icon}</span>
              <span className="mobile-nav-text">{link.label}</span>
              <svg className="mobile-nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </NavLink>
          ))}
        </nav>

        <div className="mobile-menu-footer">
          {user ? (
            <>
              <Link to="/profile" className="mobile-user-card" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="mobile-user-avatar">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profil" />
                  ) : (
                    user?.firstName?.charAt(0) || "U"
                  )}
                </div>
                <div className="mobile-user-info">
                  <span className="mobile-user-name">{user?.firstName || "Kullanıcı"}</span>
                  <span className="mobile-user-email">{user?.email || "Profili görüntüle"}</span>
                </div>
              </Link>
              <button className="mobile-btn mobile-btn-logout" onClick={logout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Çıkış Yap</span>
              </button>
            </>
          ) : (
            <div className="mobile-auth-buttons">
              <Link
                to="/login"
                className="mobile-btn mobile-btn-ghost"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Giriş Yap
              </Link>
              <Link
                to="/register"
                className="mobile-btn mobile-btn-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="mobile-menu-decoration">
          <div className="decoration-circle d1" />
          <div className="decoration-circle d2" />
        </div>
      </div>
    </>
  );
}
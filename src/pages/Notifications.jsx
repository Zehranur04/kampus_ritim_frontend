import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../config/supabaseClient";
import { useAuth } from "../auth/AuthContext";
import "../styles/notifications.css";

export default function Notifications() {
  const { backendUser } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [filter, setFilter] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);

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

  const userId = useMemo(() => {
    const idFromCtx = backendUser?.id ? Number(backendUser.id) : 0;
    if (idFromCtx) return idFromCtx;
    return getBackendUserIdFromToken();
  }, [backendUser?.id]);

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

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
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
      date: formatDate(createdAt),
      isRead,
      icon: isEvent ? "📅" : "📢",
      link: isEvent ? `/events/${Number(relatedEventId)}` : null,
      createdAt,
      relatedEventId: isEvent ? Number(relatedEventId) : null,
    };
  };

  useEffect(() => {
    let mounted = true;
    let channel;

    const load = async () => {
      if (!userId) {
        if (mounted) {
          setNotifications([]);
          setLoading(false);
          setLoadError(null);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
        setLoadError(null);
      }

      try {
        const res = await supabase
          .from("Notifications")
          .select("*")
          .eq("UserId", userId)
          .order("CreatedAt", { ascending: false });

        if (res.error) throw res.error;
        const rows = Array.isArray(res.data) ? res.data : [];
        const mapped = rows.map(mapRowToNotification);
        if (mounted) setNotifications(mapped);

        channel = supabase
          .channel(`notifications_user_${userId}`)
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
                  if (exists) return prev;
                  return [next, ...prev];
                });
              } else if (evt === "UPDATE") {
                const next = mapRowToNotification(payload.new);
                setNotifications((prev) => prev.map((n) => (n.id === next.id ? { ...n, ...next } : n)));
              } else if (evt === "DELETE") {
                const deletedId = payload?.old?.Id ?? payload?.old?.id;
                if (!deletedId) return;
                setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
                setSelectedNotifications((prev) => prev.filter((nId) => nId !== deletedId));
              }
            }
          )
          .subscribe();
      } catch (e) {
        if (!mounted) return;
        setLoadError(e?.message || "Bildirimler yüklenemedi.");
      } finally {
        if (mounted) setLoading(false);
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
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return n.type === filter;
  });

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (!userId) return;
    supabase
      .from("Notifications")
      .update({ IsRead: true })
      .eq("Id", id)
      .eq("UserId", userId);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (!userId) return;
    supabase
      .from("Notifications")
      .update({ IsRead: true })
      .eq("UserId", userId)
      .eq("IsRead", false);
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedNotifications((prev) => prev.filter((nId) => nId !== id));
    if (!userId) return;
    supabase
      .from("Notifications")
      .delete()
      .eq("Id", id)
      .eq("UserId", userId);
  };

  const deleteSelected = () => {
    const ids = [...selectedNotifications];
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    setSelectedNotifications([]);
    if (!userId || ids.length === 0) return;
    supabase
      .from("Notifications")
      .delete()
      .eq("UserId", userId)
      .in("Id", ids);
  };

  const toggleSelect = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      event: "var(--pri)",
      club: "#10b981",
      announcement: "#f59e0b",
      reminder: "#8b5cf6",
      success: "#22c55e",
      warning: "#ef4444"
    };
    return colors[type] || "var(--pri)";
  };

  return (
    <div className="notifications-page">
      {/* Background Elements */}
      <div className="notifications-bg">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
        <div className="bg-grid" />
      </div>

      <div className="notifications-container">
        {/* Header */}
        <div className="notifications-header">
          <div className="header-content">
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
            </div>
            <div className="header-text">
              <h1>Bildirimler</h1>
              <p>{unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}</p>
            </div>
          </div>

          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="action-btn mark-read-btn" onClick={markAllAsRead}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Tümünü Okundu İşaretle
              </button>
            )}
            {selectedNotifications.length > 0 && (
              <button className="action-btn delete-btn" onClick={deleteSelected}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Seçilenleri Sil ({selectedNotifications.length})
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="notifications-filters">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              <span className="tab-icon">📋</span>
              Tümü
              <span className="tab-count">{notifications.length}</span>
            </button>
            <button
              className={`filter-tab ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              <span className="tab-icon">🔔</span>
              Okunmamış
              {unreadCount > 0 && <span className="tab-count unread">{unreadCount}</span>}
            </button>
            <button
              className={`filter-tab ${filter === "event" ? "active" : ""}`}
              onClick={() => setFilter("event")}
            >
              <span className="tab-icon">📅</span>
              Etkinlikler
            </button>
            <button
              className={`filter-tab ${filter === "club" ? "active" : ""}`}
              onClick={() => setFilter("club")}
            >
              <span className="tab-icon">🏛️</span>
              Kulüpler
            </button>
            <button
              className={`filter-tab ${filter === "announcement" ? "active" : ""}`}
              onClick={() => setFilter("announcement")}
            >
              <span className="tab-icon">📢</span>
              Duyurular
            </button>
          </div>

          {filteredNotifications.length > 0 && (
            <button className="select-all-btn" onClick={selectAll}>
              <div className={`checkbox ${selectedNotifications.length === filteredNotifications.length ? "checked" : ""}`}>
                {selectedNotifications.length === filteredNotifications.length && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              Tümünü Seç
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {loading ? (
            <div className="notifications-empty">
              <div className="empty-illustration">
                <div className="empty-bell">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
              </div>
              <h3>Bildirimler Yükleniyor</h3>
              <p>Lütfen bekleyin...</p>
            </div>
          ) : loadError ? (
            <div className="notifications-empty">
              <div className="empty-illustration">
                <div className="empty-bell">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
              </div>
              <h3>Bildirimler Yüklenemedi</h3>
              <p>{loadError}</p>
              <Link to="/events" className="empty-action-btn">
                <span>Etkinlikleri Keşfet</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`notification-card ${!notification.isRead ? "unread" : ""} ${selectedNotifications.includes(notification.id) ? "selected" : ""}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <button
                  className="card-checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(notification.id);
                  }}
                >
                  <div className={`checkbox ${selectedNotifications.includes(notification.id) ? "checked" : ""}`}>
                    {selectedNotifications.includes(notification.id) && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>

                <div
                  className="card-content"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div
                    className="notification-type-indicator"
                    style={{ background: getTypeColor(notification.type) }}
                  />
                  
                  <div className="notification-icon-box" style={{ background: `${getTypeColor(notification.type)}15` }}>
                    <span>{notification.icon}</span>
                    {!notification.isRead && <span className="unread-indicator" />}
                  </div>

                  <div className="notification-info">
                    <div className="notification-top">
                      <h3 className="notification-title">{notification.title}</h3>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-meta">
                      <span className="notification-date">{notification.date}</span>
                      {notification.link && (
                        <Link
                          to={notification.link}
                          className="notification-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Detayları Gör
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="card-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
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
            <div className="notifications-empty">
              <div className="empty-illustration">
                <div className="empty-bell">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="empty-sparkles">
                  <span className="sparkle s1">✨</span>
                  <span className="sparkle s2">✨</span>
                  <span className="sparkle s3">✨</span>
                </div>
              </div>
              <h3>Bildirim Bulunamadı</h3>
              <p>
                {filter === "all"
                  ? "Henüz hiç bildiriminiz yok. Etkinliklere katılarak bildirimleri aktif edin!"
                  : "Bu kategoride bildirim bulunmuyor."}
              </p>
              <Link to="/events" className="empty-action-btn">
                <span>Etkinlikleri Keşfet</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

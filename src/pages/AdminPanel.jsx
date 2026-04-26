// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllRooms,
  getAllClubs,
  getAllCategories,
  getAllSpeakers,
  checkRoomAvailability,
  createReservation,
  getAllReservations,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  getStatusLabel,
  getStatusColor,
  ReservationStatus
} from '../services/adminApi';
import '../styles/admin.css';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminPanel() {
  const { user, loading: authLoading, backendLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('events');
  
  // Events state
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventForm, setEventForm] = useState({
    Title: '',
    Description: '',
    Time: '',
    RoomId: '',
    DurationMinutes: 60,
    Location: '',
    ClubsId: '',
    CategoryId: '',
    SpeakerId: '',
    Quota: 100,
    CertificateDetails: '',
    Image: ''
  });

  const toLocalDateTimeInputValue = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventForm({
      Title: '',
      Description: '',
      Time: '',
      RoomId: '',
      DurationMinutes: 60,
      Location: '',
        ClubsId: '',
      CategoryId: '',
      SpeakerId: '',
      Quota: 100,
      CertificateDetails: '',
      Image: ''
    });
  };

  const openCreateEventModal = () => {
    resetEventForm();
    setShowEventModal(true);
  };

  const openEditEventModal = (event) => {
    const id = event?.Id ?? event?.id;
    if (!id) return;

    setEditingEventId(id);

    const time = event?.Time ?? event?.time;
    const timeValue = time ? toLocalDateTimeInputValue(new Date(time)) : '';

    const reservation = reservations.find(r => r.EventId === id);
    const durationMinutes = reservation?.StartTime && reservation?.EndTime
      ? Math.max(1, Math.round((new Date(reservation.EndTime).getTime() - new Date(reservation.StartTime).getTime()) / 60000))
      : 60;

    setEventForm({
      Title: event?.Title ?? event?.title ?? '',
      Description: event?.Description ?? event?.description ?? '',
      Time: timeValue,
      RoomId: reservation?.RoomId ? String(reservation.RoomId) : '',
      DurationMinutes: durationMinutes,
      Location: event?.Location ?? event?.location ?? '',
      ClubsId: String(event?.ClubsId ?? event?.clubsId ?? event?.ClubId ?? event?.clubId ?? ''),
      CategoryId: String(event?.CategoryId ?? event?.categoryId ?? ''),
      SpeakerId: String(event?.SpeakerId ?? event?.speakerId ?? ''),
      Quota: String(event?.Quota ?? event?.quota ?? 100),
      CertificateDetails: event?.CertificateDetails ?? event?.certificateDetails ?? '',
      Image: event?.Image ?? event?.imageUrl ?? event?.image ?? ''
    });

    setShowEventModal(true);
  };
  
  // Rooms & Reservations state
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availabilityCheck, setAvailabilityCheck] = useState(null);
  const [pendingAvailabilityChecks, setPendingAvailabilityChecks] = useState({});

  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'event' | 'reservation', id: number }
  const [deletingConfirm, setDeletingConfirm] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    RoomId: '',
    EventId: '',
    StartTime: '',
    EndTime: ''
  });
  
  // General state
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // isAdmin artık backend DB rolünden gelir (AuthContext -> /api/auth/me)

  // Redirect non-admin users - only after auth is fully loaded
  useEffect(() => {
    // Wait until auth loading is complete
    if (authLoading || backendLoading) return;
    
    // If no user, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }
    
    // If user exists but is not admin, redirect to home
    if (!isAdmin) {
      navigate('/');
    }
  }, [user, authLoading, backendLoading, isAdmin, navigate]);

  // Load data
  useEffect(() => {
    if (isAdmin) {
      loadEvents();
      loadRoomsAndReservations();
    }
  }, [isAdmin]);

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const [eventsData, clubsData, categoriesData, speakersData] = await Promise.all([
        getAllEvents(),
        getAllClubs(),
        getAllCategories(),
        getAllSpeakers()
      ]);
      setEvents(eventsData || []);
      setClubs(clubsData || []);
      setCategories(categoriesData || []);
      setSpeakers(speakersData || []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Etkinlikler yüklenirken hata oluştu.');
    } finally {
      setEventsLoading(false);
    }
  };

  const loadRoomsAndReservations = async () => {
    setRoomsLoading(true);
    try {
      const [roomsData, reservationsData] = await Promise.all([
        getAllRooms(),
        getAllReservations()
      ]);
      setRooms(roomsData || []);
      // Normalize numeric ids coming from Supabase so strict equality works reliably
      const normalizedReservations = (reservationsData || []).map((r) => ({
        ...r,
        Id: r?.Id != null ? Number(r.Id) : r?.Id,
        RoomId: r?.RoomId != null ? Number(r.RoomId) : r?.RoomId,
        EventId: r?.EventId != null ? Number(r.EventId) : r?.EventId,
        Status: r?.Status != null ? Number(r.Status) : r?.Status,
      }));
      setReservations(normalizedReservations);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Odalar yüklenirken hata oluştu.');
    } finally {
      setRoomsLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error]);

  // ========== EVENT HANDLERS ==========

  const handleEventFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventForm(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      if (name === 'RoomId') {
        const roomId = parseInt(value);
        const room = rooms.find(r => r.Id === roomId);
        // Konum boşsa, seçilen odanın adını otomatik yaz
        if (room && !next.Location) {
          next.Location = room.Name;
        }
      }

      return next;
    });
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!eventForm.Title || !eventForm.Time || !eventForm.SpeakerId || !eventForm.CategoryId) {
      setError('Etkinlik başlığı, tarihi, konuşmacı ve kategori zorunludur.');
      return;
    }

    if (!eventForm.Location) {
      setError('Konum zorunludur. (Oda seçmediyseniz konumu yazın)');
      return;
    }

    const hasRoomSelection = !!eventForm.RoomId;
    const roomId = hasRoomSelection ? parseInt(eventForm.RoomId) : null;
    const startTime = eventForm.Time;
    const startDate = new Date(startTime);
    if (Number.isNaN(startDate.getTime())) {
      setError('Tarih/Saat formatı geçersiz.');
      return;
    }

    let endTime = null;
    if (hasRoomSelection) {
      const durationMinutes = parseInt(eventForm.DurationMinutes);
      if (!durationMinutes || durationMinutes < 1) {
        setError('Oda seçtiyseniz süre (dk) zorunludur.');
        return;
      }

      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      endTime = toLocalDateTimeInputValue(endDate);
    }
    
    const payload = {
      Title: eventForm.Title,
      Description: eventForm.Description || '',
      Time: eventForm.Time,
      Location: hasRoomSelection
        ? (eventForm.Location || (rooms.find(r => r.Id === roomId)?.Name ?? ''))
        : eventForm.Location,
      CategoryId: parseInt(eventForm.CategoryId),
      SpeakerId: parseInt(eventForm.SpeakerId),
      Quota: parseInt(eventForm.Quota) || 100,
      CertificateDetails: eventForm.CertificateDetails || null,
      Image: eventForm.Image || null
    };

    try {
      const existingReservation = editingEventId
        ? reservations.find(r => r.EventId === editingEventId)
        : null;

      // Only run availability check / reservation sync if reservation-related fields changed.
      // This avoids blocking simple edits like description updates.
      const reservationChangeNeeded = (() => {
        if (!editingEventId) {
          return hasRoomSelection;
        }

        const existingHasRoom = !!(existingReservation?.Id || existingReservation?.RoomId);
        if (hasRoomSelection !== existingHasRoom) return true;
        if (!hasRoomSelection && !existingHasRoom) return false;

        const existingRoomId = existingReservation?.RoomId != null ? Number(existingReservation.RoomId) : null;
        const existingStart = existingReservation?.StartTime ?? null;
        const existingEnd = existingReservation?.EndTime ?? null;

        return (
          Number(roomId) !== Number(existingRoomId) ||
          String(startTime || '') !== String(existingStart || '') ||
          String(endTime || '') !== String(existingEnd || '')
        );
      })();

      // Reservation ops: availability depending on room selection (only when reservation changed)
      if (reservationChangeNeeded && hasRoomSelection) {
        try {
          const excludeId = existingReservation?.Id ?? null;
          const availability = await checkRoomAvailability(roomId, startTime, endTime, excludeId);
          if (!availability?.isAvailable) {
            setError('Seçilen oda bu zaman diliminde müsait değil.');
            return;
          }
        } catch (err) {
          console.error('Error checking room availability for event:', err);
          setError('Oda uygunluğu kontrol edilirken hata oluştu.');
          return;
        }
      }

      let eventId = editingEventId;
      if (editingEventId) {
        await updateEvent(editingEventId, payload);
      } else {
        const created = await createEvent(payload);
        eventId = created?.Id ?? created?.id;
        if (!eventId) throw new Error('Etkinlik ID alınamadı.');
      }

      // Keep reservations in sync
      if (reservationChangeNeeded) {
        if (hasRoomSelection) {
          if (existingReservation?.Id) {
            await updateReservation(existingReservation.Id, {
              RoomId: roomId,
              StartTime: startTime,
              EndTime: endTime,
              Status: existingReservation.Status ?? ReservationStatus.APPROVED
            });
          } else {
            await createReservation({
              RoomId: roomId,
              EventId: eventId,
              StartTime: startTime,
              EndTime: endTime,
              Status: ReservationStatus.APPROVED
            });
          }
        } else {
          // roomless event: remove reservation if exists
          if (existingReservation?.Id) {
            await deleteReservation(existingReservation.Id);
          }
        }
      }

      setSuccessMsg(editingEventId ? 'Etkinlik güncellendi!' : 'Etkinlik başarıyla oluşturuldu!');
      setShowEventModal(false);
      resetEventForm();
      loadEvents();
      loadRoomsAndReservations();
    } catch (err) {
      console.error('Error submitting event:', err);
      setError('Etkinlik kaydedilirken hata oluştu: ' + (err?.message || 'Bilinmeyen hata'));
    }
  };

  const requestDeleteEvent = (eventId) => {
    const idNum = Number(eventId);
    if (!idNum) return;
    setConfirmDelete({ type: 'event', id: idNum });
  };

  const requestDeleteReservation = (reservationId) => {
    const idNum = Number(reservationId);
    if (!idNum) return;
    setConfirmDelete({ type: 'reservation', id: idNum });
  };

  const performDeleteEvent = async (eventId) => {
    await deleteEvent(eventId);
    setSuccessMsg('Etkinlik başarıyla silindi!');
    loadEvents();
  };

  // ========== RESERVATION HANDLERS ==========

  const handleReservationFormChange = (e) => {
    const { name, value } = e.target;
    setReservationForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear availability check when form changes
    setAvailabilityCheck(null);
  };

  const handleCheckAvailability = async () => {
    setError(null);
    setAvailabilityCheck(null);
    
    if (!reservationForm.RoomId || !reservationForm.StartTime || !reservationForm.EndTime) {
      setError('Lütfen oda, başlangıç ve bitiş zamanını seçin.');
      return;
    }
    
    try {
      const result = await checkRoomAvailability(
        parseInt(reservationForm.RoomId),
        reservationForm.StartTime,
        reservationForm.EndTime
      );
      setAvailabilityCheck(result);
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Uygunluk kontrolü yapılırken hata oluştu.');
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!reservationForm.RoomId || !reservationForm.EventId || 
        !reservationForm.StartTime || !reservationForm.EndTime) {
      setError('Tüm alanları doldurun.');
      return;
    }
    
    try {
      await createReservation({
        RoomId: parseInt(reservationForm.RoomId),
        EventId: parseInt(reservationForm.EventId),
        StartTime: reservationForm.StartTime,
        EndTime: reservationForm.EndTime,
        Status: ReservationStatus.APPROVED // Admin directly approves
      });
      setSuccessMsg('Rezervasyon başarıyla oluşturuldu!');
      setShowReservationModal(false);
      setReservationForm({
        RoomId: '',
        EventId: '',
        StartTime: '',
        EndTime: ''
      });
      setAvailabilityCheck(null);
      loadRoomsAndReservations();
    } catch (err) {
      console.error('Error creating reservation:', err);
      setError(err.message || 'Rezervasyon oluşturulurken hata oluştu.');
    }
  };

  const handleUpdateReservationStatus = async (reservationId, newStatus) => {
    try {
      if (newStatus === ReservationStatus.APPROVED) {
        const res = reservations.find(r => Number(r.Id) === Number(reservationId));
        if (res?.RoomId && res?.StartTime && res?.EndTime) {
          const availability = await checkRoomAvailability(
            Number(res.RoomId),
            res.StartTime,
            res.EndTime,
            Number(res.Id)
          );
          if (!availability?.isAvailable) {
            setError(`Çakışma var: Bu oda bu saatlerde dolu. (${availability.conflictingReservations?.length ?? 1} çakışan rezervasyon)`);
            return;
          }
        }
      }
      await updateReservationStatus(reservationId, newStatus);
      setSuccessMsg('Rezervasyon durumu güncellendi!');
      setPendingAvailabilityChecks((prev) => {
        const next = { ...prev };
        delete next[Number(reservationId)];
        return next;
      });
      loadRoomsAndReservations();
    } catch (err) {
      console.error('Error updating reservation:', err);
      setError('Rezervasyon güncellenirken hata oluştu.');
    }
  };

  const performDeleteReservation = async (reservationId) => {
    await deleteReservation(reservationId);
    setSuccessMsg('Rezervasyon başarıyla silindi!');
    setPendingAvailabilityChecks((prev) => {
      const next = { ...prev };
      delete next[Number(reservationId)];
      return next;
    });
    loadRoomsAndReservations();
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete?.type || !confirmDelete?.id) return;
    setError(null);
    setDeletingConfirm(true);
    try {
      if (confirmDelete.type === 'event') {
        await performDeleteEvent(confirmDelete.id);
      } else if (confirmDelete.type === 'reservation') {
        await performDeleteReservation(confirmDelete.id);
      }
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting:', err);
      if (confirmDelete.type === 'event') {
        setError('Etkinlik silinirken hata oluştu: ' + (err?.message || 'Bilinmeyen hata'));
      } else {
        setError('Rezervasyon silinirken hata oluştu: ' + (err?.message || 'Bilinmeyen hata'));
      }
    } finally {
      setDeletingConfirm(false);
    }
  };

  const handleCheckPendingReservationAvailability = async (reservation) => {
    const reservationId = Number(reservation?.Id);
    if (!reservationId) return;

    setError(null);
    setPendingAvailabilityChecks((prev) => ({
      ...prev,
      [reservationId]: { loading: true, checked: true },
    }));

    try {
      const availability = await checkRoomAvailability(
        Number(reservation.RoomId),
        reservation.StartTime,
        reservation.EndTime,
        reservationId
      );

      setPendingAvailabilityChecks((prev) => ({
        ...prev,
        [reservationId]: {
          loading: false,
          checked: true,
          isAvailable: !!availability?.isAvailable,
          conflictingCount: Array.isArray(availability?.conflictingReservations)
            ? availability.conflictingReservations.length
            : (availability?.isAvailable ? 0 : 1),
        },
      }));
    } catch (err) {
      console.error('Error checking availability:', err);
      setPendingAvailabilityChecks((prev) => ({
        ...prev,
        [reservationId]: { loading: false, checked: true, error: true },
      }));
      setError('Uygunluk kontrolü yapılırken hata oluştu.');
    }
  };

  // Get room name by ID
  const getRoomName = (roomId) => {
    const idNum = roomId != null ? Number(roomId) : roomId;
    const room = rooms.find(r => Number(r.Id) === idNum);
    return room ? room.Name : `Oda #${roomId}`;
  };

  // Get event title by ID
  const getEventTitle = (eventId) => {
    const event = events.find(e => (e.Id || e.id) === eventId);
    return event ? (event.Title || event.title) : `Etkinlik #${eventId}`;
  };

  const visibleReservations = reservations.filter(
    (r) => !selectedRoom || Number(r.RoomId) === Number(selectedRoom)
  );
  const pendingReservations = visibleReservations.filter(
    (r) => Number(r.Status) === ReservationStatus.PENDING
  );
  const nonPendingReservations = visibleReservations.filter(
    (r) => Number(r.Status) !== ReservationStatus.PENDING
  );

  // Loading state
  if (authLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">
            Admin Panel
          </h1>
          <p className="admin-subtitle">Etkinlik ve oda yönetimi</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="admin-message admin-error">
          <span className="message-icon">❌</span>
          {error}
          <button className="message-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      {successMsg && (
        <div className="admin-message admin-success">
          <span className="message-icon">✅</span>
          {successMsg}
          <button className="message-close" onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          {/* <span className="tab-icon">📅</span> */}
          Etkinlik Yönetimi
        </button>
        <button 
          className={`admin-tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          {/* <span className="tab-icon">🏛️</span> */}
          Oda Rezervasyonu
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Etkinlikler</h2>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={openCreateEventModal}
              >
                <span>+</span> Yeni Etkinlik
              </button>
            </div>

            {eventsLoading ? (
              <div className="admin-loading-inline">
                <div className="admin-spinner-small"></div>
                <span>Etkinlikler yükleniyor...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="admin-empty">
                <span className="empty-icon">📅</span>
                <p>Henüz etkinlik bulunmuyor.</p>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Başlık</th>
                      <th>Tarih</th>
                      <th>Konum</th>
                      <th>Kategori</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events
                      .slice()
                      .sort((a, b) => {
                        const aId = Number(a.Id ?? a.id ?? 0);
                        const bId = Number(b.Id ?? b.id ?? 0);
                        return aId - bId;
                      })
                      .map(event => {
                      const id = event.Id || event.id;
                      const title = event.Title || event.title || '-';
                      const time = event.Time || event.time;
                      const location = event.Location || event.location || '-';
                      const catId = event.CategoryId || event.categoryId;
                      const category = categories.find(c => c.Id === catId);
                      
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td className="event-title-cell">{title}</td>
                          <td>{formatDateTime(time)}</td>
                          <td>{location}</td>
                          <td>
                            <span className="category-badge">
                              {category?.Name || 'Genel'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="admin-btn admin-btn-sm"
                                onClick={() => openEditEventModal(event)}
                              >
                                ✏️ Düzenle
                              </button>
                              <button 
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => requestDeleteEvent(id)}
                              >
                                🗑️ Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="admin-section">
            {/* Rooms List */}
            <div className="section-header">
              <h2>Odalar</h2>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => setShowReservationModal(true)}
              >
                <span>+</span> Yeni Rezervasyon
              </button>
            </div>

            {roomsLoading ? (
              <div className="admin-loading-inline">
                <div className="admin-spinner-small"></div>
                <span>Odalar yükleniyor...</span>
              </div>
            ) : (
              <div className="rooms-grid">
                {rooms.map(room => {
                  const roomId = Number(room.Id);
                  const roomReservations = reservations.filter(r => Number(r.RoomId) === roomId);

                  // Active = not rejected and not ended yet
                  const now = new Date();
                  const activeCount = roomReservations.filter(r => {
                    if (Number(r.Status) === ReservationStatus.REJECTED) return false;
                    const end = r.EndTime ? new Date(r.EndTime) : null;
                    return !end || !Number.isNaN(end.getTime()) && end > now;
                  }).length;
                  
                  return (
                    <div 
                      key={room.Id} 
                      className={`room-card ${selectedRoom === room.Id ? 'selected' : ''}`}
                      onClick={() => setSelectedRoom(selectedRoom === room.Id ? null : room.Id)}
                    >
                      <div className="room-header">
                        <h3>{room.Name}</h3>
                        {/* {room.HasProjector && <span className="room-feature">📽️</span>} */}
                      </div>
                      <div className="room-details">
                        <p><strong>Konum:</strong> {room.Location}</p>
                        <p><strong>Kapasite:</strong> {room.Capacity} kişi</p>
                        <p className="room-reservations">
                          <strong>Aktif Rezervasyon:</strong> {activeCount}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reservations List */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
              <h2>
                Rezervasyonlar
                {selectedRoom && ` - ${getRoomName(selectedRoom)}`}
              </h2>
              {selectedRoom && (
                <button 
                  className="admin-btn admin-btn-ghost"
                  onClick={() => setSelectedRoom(null)}
                >
                  Tümünü Göster
                </button>
              )}
            </div>

            {roomsLoading ? (
              <div className="admin-loading-inline">
                <div className="admin-spinner-small"></div>
                <span>Rezervasyonlar yükleniyor...</span>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Oda</th>
                      <th>Etkinlik</th>
                      <th>Başlangıç</th>
                      <th>Bitiş</th>
                      <th>Durum</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonPendingReservations.map(res => (
                        <tr key={res.Id}>
                          <td>{res.Id}</td>
                          <td>{getRoomName(res.RoomId)}</td>
                          <td>{getEventTitle(res.EventId)}</td>
                          <td>{formatDateTime(res.StartTime)}</td>
                          <td>{formatDateTime(res.EndTime)}</td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(res.Status) }}
                            >
                              {getStatusLabel(res.Status)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => requestDeleteReservation(res.Id)}
                                title="Sil"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {nonPendingReservations.length === 0 && (
                      <tr>
                        <td colSpan="7" className="empty-row">
                          Rezervasyon bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pending Requests */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
              <h2>
                Bekleyen İşlemler
                {selectedRoom && ` - ${getRoomName(selectedRoom)}`}
              </h2>
            </div>

            {roomsLoading ? (
              <div className="admin-loading-inline">
                <div className="admin-spinner-small"></div>
                <span>Bekleyen talepler yükleniyor...</span>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Oda</th>
                      <th>Etkinlik</th>
                      <th>Başlangıç</th>
                      <th>Bitiş</th>
                      <th>Uygunluk</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReservations.map((res) => {
                      const check = pendingAvailabilityChecks?.[Number(res.Id)] ?? null;
                      const isChecking = !!check?.loading;
                      const checked = !!check?.checked;
                      const isAvailable = checked && check?.isAvailable === true;
                      const isUnavailable = checked && check?.isAvailable === false;
                      const hasError = checked && !!check?.error;

                      const suitabilityText = !checked
                        ? '-'
                        : hasError
                          ? 'Hata'
                          : isAvailable
                            ? 'Uygun'
                            : `Çakışma (${check?.conflictingCount ?? 1})`;

                      return (
                        <tr key={res.Id}>
                          <td>{res.Id}</td>
                          <td>{getRoomName(res.RoomId)}</td>
                          <td>{getEventTitle(res.EventId)}</td>
                          <td>{formatDateTime(res.StartTime)}</td>
                          <td>{formatDateTime(res.EndTime)}</td>
                          <td>{suitabilityText}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="admin-btn admin-btn-sm"
                                onClick={() => handleCheckPendingReservationAvailability(res)}
                                disabled={isChecking}
                                title="Uygunluk kontrol et"
                              >
                                {isChecking ? 'Kontrol...' : 'Uygunluk Kontrol Et'}
                              </button>

                              {checked && (
                                <>
                                  <button
                                    className="admin-btn admin-btn-success admin-btn-sm"
                                    onClick={() => handleUpdateReservationStatus(res.Id, ReservationStatus.APPROVED)}
                                    disabled={!isAvailable}
                                    title={isUnavailable ? 'Çakışma var, onaylanamaz' : 'Onayla'}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    className="admin-btn admin-btn-warning admin-btn-sm"
                                    onClick={() => handleUpdateReservationStatus(res.Id, ReservationStatus.REJECTED)}
                                    title="İptal Et"
                                  >
                                    ✗
                                  </button>
                                </>
                              )}

                              <button 
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => requestDeleteReservation(res.Id)}
                                title="Sil"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {pendingReservations.length === 0 && (
                      <tr>
                        <td colSpan="7" className="empty-row">
                          Bekleyen işlem bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="admin-modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEventId ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Oluştur'}</h3>
              <button className="modal-close" onClick={() => {
                setShowEventModal(false);
                resetEventForm();
              }}>×</button>
            </div>
            <form onSubmit={handleSubmitEvent} className="modal-form">
              <div className="form-group">
                <label>Etkinlik Başlığı *</label>
                <input
                  type="text"
                  name="Title"
                  value={eventForm.Title}
                  onChange={handleEventFormChange}
                  placeholder="Örn: Yapay Zeka Workshop"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Açıklama *</label>
                <textarea
                  name="Description"
                  value={eventForm.Description}
                  onChange={handleEventFormChange}
                  placeholder="Etkinlik açıklaması..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Fotoğraf URL</label>
                <input
                  type="url"
                  name="Image"
                  value={eventForm.Image}
                  onChange={handleEventFormChange}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>Sertifika Bilgisi</label>
                <textarea
                  name="CertificateDetails"
                  value={eventForm.CertificateDetails}
                  onChange={handleEventFormChange}
                  placeholder="Sertifika türü, şartlar, teslim, vb..."
                  rows={4}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Tarih ve Saat *</label>
                  <input
                    type="datetime-local"
                    name="Time"
                    value={eventForm.Time}
                    onChange={handleEventFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Oda (opsiyonel)</label>
                  <select
                    name="RoomId"
                    value={eventForm.RoomId}
                    onChange={handleEventFormChange}
                  >
                    <option value="">Oda seçiniz</option>
                    {rooms.map(room => (
                      <option key={room.Id} value={room.Id}>
                        {room.Name} - {room.Location} (Kapasite: {room.Capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Süre (dk)</label>
                  <input
                    type="number"
                    name="DurationMinutes"
                    value={eventForm.DurationMinutes}
                    onChange={handleEventFormChange}
                    min={1}
                  />
                </div>
                <div className="form-group">
                  <label>Konum *</label>
                  <input
                    type="text"
                    name="Location"
                    value={eventForm.Location}
                    onChange={handleEventFormChange}
                    placeholder="Örn: Konferans Salonu A"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Kategori *</label>
                  <select
                    name="CategoryId"
                    value={eventForm.CategoryId}
                    onChange={handleEventFormChange}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {categories.map(cat => (
                      <option key={cat.Id} value={cat.Id}>{cat.Name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Konuşmacı *</label>
                  <select
                    name="SpeakerId"
                    value={eventForm.SpeakerId}
                    onChange={handleEventFormChange}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {speakers.map(speaker => (
                      <option key={speaker.Id} value={speaker.Id}>{speaker.Name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Kulüp (opsiyonel)</label>
                <select
                  name="ClubsId"
                  value={eventForm.ClubsId}
                  onChange={handleEventFormChange}
                >
                  <option value="">Kulüp seçiniz</option>
                  {clubs.map((club) => {
                    const id = club.Id ?? club.id;
                    const name = club.Name ?? club.name ?? `Kulüp #${id}`;
                    return (
                      <option key={id} value={id}>{name}</option>
                    );
                  })}
                </select>
              </div>
              
              <div className="form-group">
                <label>Kontenjan (Kota)</label>
                <input
                  type="number"
                  name="Quota"
                  value={eventForm.Quota}
                  onChange={handleEventFormChange}
                  min={1}
                  placeholder="100"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => {
                  setShowEventModal(false);
                  resetEventForm();
                }}>
                  İptal
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingEventId ? 'Kaydet' : 'Etkinlik Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="admin-modal-overlay" onClick={() => setShowReservationModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Yeni Oda Rezervasyonu</h3>
              <button className="modal-close" onClick={() => {
                setShowReservationModal(false);
                setAvailabilityCheck(null);
              }}>×</button>
            </div>
            <form onSubmit={handleCreateReservation} className="modal-form">
              <div className="form-group">
                <label>Oda Seçin *</label>
                <select
                  name="RoomId"
                  value={reservationForm.RoomId}
                  onChange={handleReservationFormChange}
                  required
                >
                  <option value="">Oda seçiniz</option>
                  {rooms.map(room => (
                    <option key={room.Id} value={room.Id}>
                      {room.Name} - {room.Location} (Kapasite: {room.Capacity})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Etkinlik Seçin *</label>
                <select
                  name="EventId"
                  value={reservationForm.EventId}
                  onChange={handleReservationFormChange}
                  required
                >
                  <option value="">Etkinlik seçiniz</option>
                  {events.map(event => {
                    const id = event.Id || event.id;
                    const title = event.Title || event.title;
                    return (
                      <option key={id} value={id}>{title}</option>
                    );
                  })}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Başlangıç Zamanı *</label>
                  <input
                    type="datetime-local"
                    name="StartTime"
                    value={reservationForm.StartTime}
                    onChange={handleReservationFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bitiş Zamanı *</label>
                  <input
                    type="datetime-local"
                    name="EndTime"
                    value={reservationForm.EndTime}
                    onChange={handleReservationFormChange}
                    required
                  />
                </div>
              </div>
              
              {/* Availability Check */}
              <div className="availability-section">
                <button 
                  type="button" 
                  className="admin-btn admin-btn-secondary"
                  onClick={handleCheckAvailability}
                >
                  🔍 Uygunluk Kontrol Et
                </button>
                
                {availabilityCheck && (
                  <div className={`availability-result ${availabilityCheck.isAvailable ? 'available' : 'not-available'}`}>
                    {availabilityCheck.isAvailable ? (
                      <>
                        <span className="availability-icon">✅</span>
                        <span>Oda bu zaman diliminde müsait!</span>
                      </>
                    ) : (
                      <>
                        <span className="availability-icon">❌</span>
                        <span>
                          Oda müsait değil. {availabilityCheck.conflictingReservations.length} çakışan rezervasyon var.
                        </span>
                        <ul className="conflict-list">
                          {availabilityCheck.conflictingReservations.map(r => (
                            <li key={r.Id}>
                              {formatDateTime(r.StartTime)} - {formatDateTime(r.EndTime)} 
                              ({getStatusLabel(r.Status)})
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="admin-btn admin-btn-ghost" 
                  onClick={() => {
                    setShowReservationModal(false);
                    setAvailabilityCheck(null);
                  }}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="admin-btn admin-btn-primary"
                  disabled={availabilityCheck && !availabilityCheck.isAvailable}
                >
                  Rezervasyon Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onay Pop-up (diğer sayfalardaki club-modal stiliyle) */}
      {confirmDelete && (
        <div
          className="club-modal-overlay"
          onClick={() => !deletingConfirm && setConfirmDelete(null)}
        >
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal__icon">🗑️</div>
            <h3 className="club-modal__title">
              {confirmDelete.type === 'event' ? 'Etkinliği Sil' : 'Rezervasyonu Sil'}
            </h3>
            <p className="club-modal__message">
              Emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="club-modal__actions">
              <button
                className="club-modal__btn club-modal__btn--cancel"
                disabled={deletingConfirm}
                onClick={() => setConfirmDelete(null)}
              >
                İptal
              </button>
              <button
                className="club-modal__btn club-modal__btn--leave"
                disabled={deletingConfirm}
                onClick={handleConfirmDelete}
              >
                {deletingConfirm ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { tryGetBackendUserIdFromToken } from '../utils/jwt';
import { checkRoomAvailability } from '../services/adminApi';
import '../styles/admin.css';

export default function RoomReservationRequest() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    RoomId: '',
    EventId: '',
    StartTime: '',
    DurationMinutes: 60,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [roomsRes, eventsRes] = await Promise.all([
          supabase.from('Rooms').select('*').order('Name', { ascending: true }),
          supabase.from('Events').select('*').order('Time', { ascending: true }),
        ]);

        if (roomsRes.error) throw roomsRes.error;
        if (eventsRes.error) throw eventsRes.error;

        if (!mounted) return;
        setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      } catch (e) {
        if (!mounted) return;
        setError(`Veriler yüklenirken hata oluştu. ${e?.message ? `(${e.message})` : ''}`.trim());
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (user) load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return (events || []).filter((row) => {
      const ts = row?.Time ?? row?.time ?? null;
      if (!ts) return true;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return true;
      return d.getTime() >= now - 24 * 60 * 60 * 1000; // include last 24h + future
    });
  }, [events]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.RoomId || !form.EventId || !form.StartTime) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    const durationMinutes = Number(form.DurationMinutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      setError('Süre (dk) 1 veya daha büyük olmalı.');
      return;
    }

    const start = new Date(form.StartTime);
    if (Number.isNaN(start.getTime())) {
      setError('Tarih/saat formatı geçersiz.');
      return;
    }

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const endIsoLocal = (() => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
    })();

    setSubmitting(true);
    try {
      const backendUserId = tryGetBackendUserIdFromToken();
      if (!backendUserId) {
        throw new Error('Kullanıcı kimliği bulunamadı. Lütfen çıkış yapıp tekrar giriş yapın.');
      }

      const availability = await checkRoomAvailability(
        Number(form.RoomId),
        form.StartTime,
        endIsoLocal
      );

      if (!availability?.isAvailable) {
        const count = Array.isArray(availability?.conflictingReservations)
          ? availability.conflictingReservations.length
          : 1;
        throw new Error(`Oda bu zaman diliminde müsait değil. (${count} çakışan rezervasyon)`);
      }

      const payload = {
        RoomId: Number(form.RoomId),
        EventId: Number(form.EventId),
        StartTime: form.StartTime,
        EndTime: endIsoLocal,
        Status: 0, // Pending
        UserId: backendUserId,
      };

      const { error: insertError } = await supabase.from('Reservations').insert([payload]);
      if (insertError) throw insertError;

      setSuccess('Rezervasyon talebiniz alındı. Yönetici onayı bekleniyor.');
      setForm({ RoomId: '', EventId: '', StartTime: '', DurationMinutes: 60 });
    } catch (e2) {
      setError(
        `Talep gönderilemedi. ${e2?.message ? `(${e2.message})` : '(Tablo kolonları/kuralları kontrol edilmeli)'}
        `.trim()
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="admin-panel">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">
            Oda Rezervasyon Talebi
          </h1>
          <p className="admin-subtitle">Talep oluşturun, yönetici onaylasın</p>
        </div>
      </div>

      <div className="admin-content">
        {error && (
          <div className="admin-message admin-error">
            <span className="message-icon">❌</span>
            {error}
            <button className="message-close" onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className="admin-message admin-success">
            <span className="message-icon">✅</span>
            {success}
            <button className="message-close" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        <div className="admin-section">
          <div className="section-header">
            <h2>Yeni Talep</h2>
          </div>

          <div className="admin-table-container">
            <form onSubmit={onSubmit} className="modal-form" style={{ padding: 16 }}>
              <div className="form-group">
                <label>Oda *</label>
                <select name="RoomId" value={form.RoomId} onChange={onChange} required>
                  <option value="">Oda seçiniz</option>
                  {rooms.map((r) => (
                    <option key={r.Id} value={r.Id}>
                      {r.Name} - {r.Location} (Kapasite: {r.Capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Etkinlik *</label>
                <select name="EventId" value={form.EventId} onChange={onChange} required>
                  <option value="">Etkinlik seçiniz</option>
                  {upcomingEvents.map((ev) => {
                    const id = ev.Id ?? ev.id;
                    const title = ev.Title ?? ev.title ?? `Etkinlik #${id}`;
                    return (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Başlangıç *</label>
                  <input
                    type="datetime-local"
                    name="StartTime"
                    value={form.StartTime}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Süre (dk) *</label>
                  <input
                    type="number"
                    name="DurationMinutes"
                    value={form.DurationMinutes}
                    onChange={onChange}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Gönderiliyor...' : 'Talep Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

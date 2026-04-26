// src/services/adminApi.js
// Admin API service for event management and room reservations
import supabase from '../config/supabaseClient';
import { tryGetBackendUserIdFromToken } from '../utils/jwt';

// ========== EVENTS ==========

/**
 * Fetch all events
 */
export const getAllEvents = async () => {
  const { data, error } = await supabase
    .from('Events')
    .select('*')
    .order('Time', { ascending: true });
  
  if (error) throw error;
  return data;
};

/**
 * Create a new event
 * @param {Object} eventData - Event data object
 */
export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('Events')
    .insert([eventData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Update an existing event
 * @param {number} eventId - Event ID
 * @param {Object} eventData - Updated event data
 */
export const updateEvent = async (eventId, eventData) => {
  const { data, error } = await supabase
    .from('Events')
    .update(eventData)
    .eq('Id', eventId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Delete an event
 * @param {number} eventId - Event ID to delete
 */
export const deleteEvent = async (eventId) => {
  const { error } = await supabase
    .from('Events')
    .delete()
    .eq('Id', eventId);
  
  if (error) throw error;
  return true;
};

/**
 * Fetch all clubs
 */
export const getAllClubs = async () => {
  const { data, error } = await supabase
    .from('Clubs')
    .select('*')
    .order('Name', { ascending: true });

  if (error) throw error;
  return data;
};

// ========== ROOMS ==========

/**
 * Fetch all rooms
 */
export const getAllRooms = async () => {
  const { data, error } = await supabase
    .from('Rooms')
    .select('*')
    .order('Name', { ascending: true });
  
  if (error) throw error;
  return data;
};

/**
 * Get room by ID
 * @param {number} roomId - Room ID
 */
export const getRoomById = async (roomId) => {
  const { data, error } = await supabase
    .from('Rooms')
    .select('*')
    .eq('Id', roomId)
    .single();
  
  if (error) throw error;
  return data;
};

// ========== RESERVATIONS ==========

/**
 * Fetch all reservations
 */
export const getAllReservations = async () => {
  const { data, error } = await supabase
    .from('Reservations')
    .select('*')
    .order('StartTime', { ascending: true });
  
  if (error) throw error;
  return data;
};

/**
 * Check if a room is available for the given time range
 * @param {number} roomId - Room ID
 * @param {string} startTime - Start time (ISO string)
 * @param {string} endTime - End time (ISO string)
 * @param {number|null} excludeReservationId - Reservation ID to exclude (for updates)
 * @returns {Object} - { isAvailable: boolean, conflictingReservations: [] }
 */
export const checkRoomAvailability = async (roomId, startTime, endTime, excludeReservationId = null) => {
  // Fetch all reservations for this room
  let query = supabase
    .from('Reservations')
    .select('*')
    .eq('RoomId', roomId);
  
  if (excludeReservationId) {
    query = query.neq('Id', excludeReservationId);
  }
  
  const { data: reservations, error } = await query;
  
  if (error) throw error;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Check for overlapping reservations
  // Overlap occurs when: existingStart < newEnd AND existingEnd > newStart
  const conflicting = (reservations || []).filter(res => {
    const resStart = new Date(res.StartTime);
    const resEnd = new Date(res.EndTime);
    // Only check approved (Status = 1) or pending (Status = 0) reservations
    // Status: 0 = Pending, 1 = Approved, 2 = Rejected
    if (res.Status === 2) return false; // Rejected reservations don't block
    return resStart < end && resEnd > start;
  });
  
  return {
    isAvailable: conflicting.length === 0,
    conflictingReservations: conflicting
  };
};

/**
 * Check conflicts only against APPROVED reservations.
 * Useful for admin approval flow so multiple pending requests can coexist.
 */
export const checkRoomAvailabilityApprovedOnly = async (roomId, startTime, endTime, excludeReservationId = null) => {
  let query = supabase
    .from('Reservations')
    .select('*')
    .eq('RoomId', roomId)
    .eq('Status', 1);

  if (excludeReservationId) {
    query = query.neq('Id', excludeReservationId);
  }

  const { data: reservations, error } = await query;
  if (error) throw error;

  const start = new Date(startTime);
  const end = new Date(endTime);

  const conflicting = (reservations || []).filter((res) => {
    const resStart = new Date(res.StartTime);
    const resEnd = new Date(res.EndTime);
    return resStart < end && resEnd > start;
  });

  return {
    isAvailable: conflicting.length === 0,
    conflictingReservations: conflicting,
  };
};

/**
 * Create a new reservation
 * @param {Object} reservationData - { RoomId, EventId, StartTime, EndTime, Status }
 */
export const createReservation = async (reservationData) => {
  // First check availability
  const { isAvailable, conflictingReservations } = await checkRoomAvailability(
    reservationData.RoomId,
    reservationData.StartTime,
    reservationData.EndTime
  );
  
  if (!isAvailable) {
    throw new Error(`Oda bu zaman diliminde müsait değil. ${conflictingReservations.length} çakışan rezervasyon var.`);
  }
  
  const resolvedUserId = reservationData?.UserId ?? tryGetBackendUserIdFromToken();

  const { data, error } = await supabase
    .from('Reservations')
    .insert([{
      ...reservationData,
      Status: reservationData.Status ?? 0, // Default to Pending
      ...(resolvedUserId ? { UserId: resolvedUserId } : {}),
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Update a reservation's status
 * @param {number} reservationId - Reservation ID
 * @param {number} status - New status (0 = Pending, 1 = Approved, 2 = Rejected)
 */
export const updateReservationStatus = async (reservationId, status) => {
  const { data, error } = await supabase
    .from('Reservations')
    .update({ Status: status })
    .eq('Id', reservationId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Update reservation fields (room/time etc.)
 * @param {number} reservationId - Reservation ID
 * @param {Object} patch - Partial fields to update
 */
export const updateReservation = async (reservationId, patch) => {
  const { data, error } = await supabase
    .from('Reservations')
    .update(patch)
    .eq('Id', reservationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a reservation
 * @param {number} reservationId - Reservation ID
 */
export const deleteReservation = async (reservationId) => {
  const { error } = await supabase
    .from('Reservations')
    .delete()
    .eq('Id', reservationId);
  
  if (error) throw error;
  return true;
};

/**
 * Get reservations for a specific room
 * @param {number} roomId - Room ID
 */
export const getReservationsByRoom = async (roomId) => {
  const { data, error } = await supabase
    .from('Reservations')
    .select('*')
    .eq('RoomId', roomId)
    .order('StartTime', { ascending: true });
  
  if (error) throw error;
  return data;
};

/**
 * Get reservations for a specific event
 * @param {number} eventId - Event ID
 */
export const getReservationsByEvent = async (eventId) => {
  const { data, error } = await supabase
    .from('Reservations')
    .select('*')
    .eq('EventId', eventId)
    .order('StartTime', { ascending: true });
  
  if (error) throw error;
  return data;
};

// ========== CATEGORIES ==========

/**
 * Fetch all categories
 */
export const getAllCategories = async () => {
  const { data, error } = await supabase
    .from('Categories')
    .select('*')
    .order('Name', { ascending: true });
  
  if (error) throw error;
  return data;
};

// ========== SPEAKERS ==========

/**
 * Fetch all speakers
 */
export const getAllSpeakers = async () => {
  const { data, error } = await supabase
    .from('Speakers')
    .select('*')
    .order('Name', { ascending: true });
  
  if (error) throw error;
  return data;
};

// ========== UTILITY ==========

/**
 * Reservation status mapping
 */
export const ReservationStatus = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 0: return 'Beklemede';
    case 1: return 'Onaylandı';
    case 2: return 'Reddedildi';
    default: return 'Bilinmiyor';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 0: return '#f59e0b'; // Yellow/Orange
    case 1: return '#10b981'; // Green
    case 2: return '#ef4444'; // Red
    default: return '#6b7280'; // Gray
  }
};

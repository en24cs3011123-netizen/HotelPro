import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiUsers, FiSearch, FiHome } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AvailabilitySearch = ({ initialParams = {}, onSearch }) => {
  const navigate = useNavigate();

  // Helper date strings (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(initialParams.checkIn || todayStr);
  const [checkOut, setCheckOut] = useState(initialParams.checkOut || tomorrowStr);
  const [guests, setGuests] = useState(initialParams.guests || 2);
  const [roomType, setRoomType] = useState(initialParams.roomType || 'all');

  const handleSubmit = (e) => {
    e.preventDefault();

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (outDate <= inDate) {
      toast.error('Check-out date must be strictly after check-in date.');
      return;
    }

    const searchParams = {
      checkIn,
      checkOut,
      guests: Number(guests),
      roomType: roomType !== 'all' ? roomType : undefined
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      const queryString = new URLSearchParams(
        Object.entries(searchParams).filter(([_, v]) => v !== undefined)
      ).toString();
      navigate(`/rooms?${queryString}`);
    }
  };

  return (
    <div
      className="card border-0 shadow-lg rounded-4 p-4 bg-white"
      style={{
        boxShadow: '0 12px 36px rgba(13, 27, 42, 0.12)',
        border: '1px solid rgba(197, 168, 128, 0.25)'
      }}
    >
      <form onSubmit={handleSubmit} className="row g-3 align-items-end">
        {/* Check-In Date */}
        <div className="col-lg-3 col-md-6">
          <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1 mb-1">
            <FiCalendar style={{ color: 'var(--hp-primary-gold)' }} /> Check-In Date
          </label>
          <input
            type="date"
            className="form-control rounded-pill px-3 py-2"
            min={todayStr}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
        </div>

        {/* Check-Out Date */}
        <div className="col-lg-3 col-md-6">
          <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1 mb-1">
            <FiCalendar style={{ color: 'var(--hp-primary-gold)' }} /> Check-Out Date
          </label>
          <input
            type="date"
            className="form-control rounded-pill px-3 py-2"
            min={checkIn || todayStr}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>

        {/* Guests Count */}
        <div className="col-lg-2 col-md-6">
          <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1 mb-1">
            <FiUsers style={{ color: 'var(--hp-primary-gold)' }} /> Guests
          </label>
          <select
            className="form-select rounded-pill px-3 py-2"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          >
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="3">3 Guests</option>
            <option value="4">4 Guests</option>
            <option value="6">6+ (Villa)</option>
          </select>
        </div>

        {/* Room Category */}
        <div className="col-lg-2 col-md-6">
          <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1 mb-1">
            <FiHome style={{ color: 'var(--hp-primary-gold)' }} /> Category
          </label>
          <select
            className="form-select rounded-pill px-3 py-2"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
          >
            <option value="all">All Suites</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
            <option value="single">Single</option>
            <option value="family_villa">Villa</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="col-lg-2 col-12">
          <button
            type="submit"
            className="btn btn-hp-gold w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
          >
            <FiSearch size={16} /> Check Rates
          </button>
        </div>
      </form>
    </div>
  );
};

export default AvailabilitySearch;

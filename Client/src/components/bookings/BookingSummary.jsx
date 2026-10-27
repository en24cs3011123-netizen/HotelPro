import React from 'react';
import { FiCalendar, FiClock, FiShield, FiInfo } from 'react-icons/fi';

const BookingSummary = ({
  room,
  checkIn,
  checkOut,
  numberOfGuests = 1,
  numberOfRooms = 1
}) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = Math.abs(outDate - inDate);
  const numberOfNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const pricePerNight = room?.rent || room?.pricePerNight || 0;
  const subtotal = pricePerNight * numberOfNights * numberOfRooms;
  const taxes = Math.round(subtotal * 0.18); // 18% GST standard
  const totalAmount = subtotal + taxes;

  const roomTypeFormatted = (room?.type || room?.roomType || 'Deluxe')
    .replace('_', ' ')
    .toUpperCase();

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
      <h5 className="fw-bold text-dark brand-font pb-3 border-bottom mb-3">
        Reservation Summary
      </h5>

      {/* Room Details */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <img
          src={(room?.photos && room.photos[0]) || (room?.images && room.images[0]) || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80'}
          alt="Room Thumbnail"
          className="rounded-3 object-fit-cover"
          style={{ width: '80px', height: '65px' }}
        />
        <div>
          <span className="badge bg-light text-dark text-uppercase small fw-bold mb-1">
            {roomTypeFormatted}
          </span>
          <p className="mb-0 fw-bold text-dark">Suite #{room?.roomNumber || '101'}</p>
          <small className="text-muted">{room?.hotel?.name || 'The Grand Palace Resort & Spa'}</small>
        </div>
      </div>

      {/* Dates & Duration */}
      <div className="bg-light p-3 rounded-3 mb-3 small">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted d-flex align-items-center gap-1">
            <FiCalendar /> Check-In:
          </span>
          <span className="fw-semibold text-dark">{checkIn}</span>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted d-flex align-items-center gap-1">
            <FiCalendar /> Check-Out:
          </span>
          <span className="fw-semibold text-dark">{checkOut}</span>
        </div>
        <div className="d-flex justify-content-between pt-2 border-top">
          <span className="text-muted d-flex align-items-center gap-1">
            <FiClock /> Duration:
          </span>
          <span className="fw-bold" style={{ color: 'var(--hp-primary-gold)' }}>
            {numberOfNights} Night{numberOfNights > 1 ? 's' : ''} ({numberOfRooms} Room)
          </span>
        </div>
      </div>

      {/* Transparent Pricing Breakdown */}
      <div className="mb-3 small">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Rate (₹{pricePerNight.toLocaleString('en-IN')} × {numberOfNights} nights)</span>
          <span className="fw-medium">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted d-flex align-items-center gap-1">
            GST &amp; Luxury Hospitality Tax (18%) <FiInfo size={12} title="Government Goods & Services Tax" />
          </span>
          <span className="fw-medium">₹{taxes.toLocaleString('en-IN')}</span>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Resort &amp; Booking Fees</span>
          <span className="text-success fw-medium">FREE</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="p-3 rounded-3 bg-dark text-white d-flex justify-content-between align-items-center mb-3">
        <div>
          <p className="mb-0 small text-white-50">Total Payable Amount</p>
          <h4 className="mb-0 fw-bold brand-font" style={{ color: 'var(--hp-primary-gold)' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </h4>
        </div>
        <span className="badge bg-secondary-subtle text-white small px-2 py-1">INR</span>
      </div>

      <div className="d-flex align-items-center gap-2 text-muted small">
        <FiShield className="text-success" size={16} />
        <span>15-Minute Temporary Hold Guarantee • No Card Data Stored</span>
      </div>
    </div>
  );
};

export default BookingSummary;

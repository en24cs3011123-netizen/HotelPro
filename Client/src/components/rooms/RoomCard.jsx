import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCheck, FiArrowRight } from 'react-icons/fi';

const FALLBACK_ROOM_IMG =
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

const RoomCard = ({ room }) => {
  const photoUrl =
    (room.photos && room.photos[0]) ||
    (room.images && room.images[0]) ||
    FALLBACK_ROOM_IMG;

  const price = room.rent || room.pricePerNight || 0;
  const roomTypeFormatted = (room.type || room.roomType || 'standard')
    .replace('_', ' ')
    .toUpperCase();

  return (
    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hp-card d-flex flex-column">
      {/* Room Image Container */}
      <div className="position-relative" style={{ height: '240px', overflow: 'hidden' }}>
        <img
          src={photoUrl}
          alt={`Room ${room.roomNumber} - ${roomTypeFormatted}`}
          className="w-100 h-100 object-fit-cover transition-transform"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_ROOM_IMG;
          }}
          loading="lazy"
        />
        <div className="position-absolute top-0 start-0 m-3">
          <span
            className="badge rounded-pill px-3 py-2 text-uppercase fw-bold shadow-sm"
            style={{
              backgroundColor: 'var(--hp-dark-navy)',
              color: 'var(--hp-primary-gold)',
              fontSize: '0.72rem',
              letterSpacing: '1px'
            }}
          >
            {roomTypeFormatted}
          </span>
        </div>
        <div className="position-absolute bottom-0 end-0 m-3">
          <span className="badge bg-white text-dark rounded-pill px-3 py-2 shadow-sm fw-bold">
            <span style={{ color: 'var(--hp-primary-gold)' }}>₹{price.toLocaleString('en-IN')}</span> / night
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="card-body p-4 d-flex flex-column flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="fw-bold text-dark mb-0 brand-font">
            Suite #{room.roomNumber || 'Luxury'}
          </h5>
          <span className="text-muted small d-flex align-items-center gap-1">
            <FiUsers /> Up to {room.capacity || 2} Guests
          </span>
        </div>

        <p className="text-muted small mb-3 flex-grow-1 text-truncate-2" style={{ minHeight: '40px' }}>
          {room.description || 'Experience refined luxury with tailored comfort and world-class amenities.'}
        </p>

        {/* Key Amenities */}
        <div className="d-flex flex-wrap gap-1 mb-4">
          {(room.amenities || ['King Bed', 'Free WiFi', 'City View']).slice(0, 3).map((amenity, idx) => (
            <span
              key={idx}
              className="badge bg-light text-secondary rounded-pill px-2 py-1 small fw-normal d-inline-flex align-items-center gap-1"
            >
              <FiCheck className="text-success" size={12} /> {amenity}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 pt-2 border-top">
          <Link
            to={`/rooms/${room._id}`}
            className="btn btn-outline-dark btn-sm flex-grow-1 rounded-pill py-2"
          >
            Details
          </Link>
          <Link
            to={`/booking/${room._id}`}
            className="btn btn-hp-gold btn-sm flex-grow-1 rounded-pill py-2 d-inline-flex align-items-center justify-content-center gap-1"
          >
            Reserve <FiArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;

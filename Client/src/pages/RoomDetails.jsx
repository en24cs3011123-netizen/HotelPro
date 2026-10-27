import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roomService, LUXURY_FALLBACK_ROOMS } from '../services/roomService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  FiUsers,
  FiCheck,
  FiCalendar,
  FiClock,
  FiShield,
  FiMapPin,
  FiArrowRight,
  FiStar
} from 'react-icons/fi';

const RoomDetails = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const fetchRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomService.getRoomById(id);
      setRoom(res.data);
    } catch (err) {
      const fallback = LUXURY_FALLBACK_ROOMS.find((r) => r._id === id) || LUXURY_FALLBACK_ROOMS[0];
      setRoom(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Fetching suite details and specifications..." />;
  }

  if (error || !room) {
    return <ErrorMessage message={error || 'Suite not found.'} onRetry={fetchRoom} />;
  }

  const photos =
    (room.photos && room.photos.length > 0 && room.photos) ||
    (room.images && room.images.length > 0 && room.images) || [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
    ];

  const price = room.rent || room.pricePerNight || 0;
  const roomTypeFormatted = (room.type || room.roomType || 'Deluxe')
    .replace('_', ' ')
    .toUpperCase();

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)' }}>
      <div className="container py-2">
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item"><Link to="/" className="text-muted">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/rooms" className="text-muted">Suites &amp; Villas</Link></li>
            <li className="breadcrumb-item active text-dark fw-semibold" aria-current="page">
              Suite #{room.roomNumber}
            </li>
          </ol>
        </nav>

        {/* Gallery Section */}
        <div className="row g-3 mb-4">
          <div className="col-lg-8">
            <div className="rounded-4 overflow-hidden shadow-sm position-relative" style={{ height: '440px' }}>
              <img
                src={photos[activePhotoIdx]}
                alt={`Suite ${room.roomNumber}`}
                className="w-100 h-100 object-fit-cover"
              />
              <span
                className="position-absolute top-0 start-0 m-3 badge rounded-pill px-3 py-2 text-uppercase fw-bold shadow-sm"
                style={{
                  backgroundColor: 'var(--hp-dark-navy)',
                  color: 'var(--hp-primary-gold)',
                  fontSize: '0.75rem',
                  letterSpacing: '1px'
                }}
              >
                ★ {roomTypeFormatted}
              </span>
            </div>
          </div>
          <div className="col-lg-4 d-flex flex-column gap-3">
            {photos.slice(0, 3).map((photo, index) => (
              <div
                key={index}
                onClick={() => setActivePhotoIdx(index)}
                className={`rounded-3 overflow-hidden shadow-sm cursor-pointer border ${
                  activePhotoIdx === index ? 'border-warning border-2' : 'border-transparent'
                }`}
                style={{ height: '135px', cursor: 'pointer' }}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Suite Details & Booking Widget Grid */}
        <div className="row g-4">
          {/* Main Details Column */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <div>
                  <h2 className="display-6 fw-bold text-dark mb-1 brand-font">
                    Suite #{room.roomNumber} — {roomTypeFormatted}
                  </h2>
                  <p className="text-muted small d-flex align-items-center gap-1 mb-0">
                    <FiMapPin style={{ color: 'var(--hp-primary-gold)' }} />
                    {room.hotel?.name || 'The Grand Palace Resort & Spa'}, {room.hotel?.city || 'Mumbai'}
                  </p>
                </div>
                <div className="text-end mt-2 mt-md-0">
                  <span className="text-muted small">Nightly Rate</span>
                  <h3 className="fw-bold brand-font mb-0" style={{ color: 'var(--hp-primary-gold)' }}>
                    ₹{price.toLocaleString('en-IN')}
                    <span className="fs-6 fw-normal text-muted"> / night</span>
                  </h3>
                </div>
              </div>

              {/* Highlights Pill Row */}
              <div className="d-flex flex-wrap gap-2 py-3 border-top border-bottom my-3">
                <span className="badge bg-light text-dark rounded-pill px-3 py-2 small d-inline-flex align-items-center gap-1">
                  <FiUsers className="text-primary" /> Up to {room.capacity || 2} Guests
                </span>
                <span className="badge bg-light text-dark rounded-pill px-3 py-2 small d-inline-flex align-items-center gap-1">
                  <FiClock className="text-warning" /> Check-in: 14:00 • Check-out: 11:00
                </span>
                <span className="badge bg-light text-dark rounded-pill px-3 py-2 small d-inline-flex align-items-center gap-1">
                  <FiShield className="text-success" /> Guaranteed Direct Booking Rate
                </span>
              </div>

              {/* Description */}
              <h5 className="fw-bold text-dark brand-font mt-3 mb-2">About This Accommodation</h5>
              <p className="text-muted" style={{ lineHeight: '1.75' }}>
                {room.description}
              </p>

              {/* Amenities */}
              <h5 className="fw-bold text-dark brand-font mt-4 mb-3">Bespoke Suite Amenities</h5>
              <div className="row g-2 mb-4">
                {(room.amenities || ['King Bed', 'Free High-Speed WiFi', 'Marble Bath', 'Espresso Machine']).map(
                  (amenity, idx) => (
                    <div key={idx} className="col-md-6">
                      <div className="d-flex align-items-center gap-2 text-dark small p-2 rounded-3 bg-light">
                        <FiCheck className="text-success flex-shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Property Policies */}
              <h5 className="fw-bold text-dark brand-font mt-3 mb-2">Hospitality &amp; Cancellation Policies</h5>
              <div className="bg-light p-3 rounded-3 small text-muted">
                <ul className="mb-0 ps-3">
                  <li className="mb-1">Free cancellation up to 48 hours prior to official check-in time.</li>
                  <li className="mb-1">Valid government photo identification is required upon arrival.</li>
                  <li className="mb-1">Early check-in and late checkout are subject to availability.</li>
                  <li>Pet policy: Well-behaved service animals and small pets welcome in designated suites.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sticky Booking CTA Sidebar */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
              <div className="d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
                <span className="text-muted small">Standard Rate</span>
                <h4 className="fw-bold brand-font mb-0" style={{ color: 'var(--hp-primary-gold)' }}>
                  ₹{price.toLocaleString('en-IN')}
                  <span className="fs-6 fw-normal text-muted">/nt</span>
                </h4>
              </div>

              <div className="bg-light p-3 rounded-3 mb-3 small">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Total Available Units:</span>
                  <span className="fw-bold text-success">{room.count || room.totalInventory || 1} Rooms</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Tax Estimate:</span>
                  <span className="fw-semibold">18% GST</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Hold Period:</span>
                  <span className="fw-semibold text-warning">15-Min Hold Window</span>
                </div>
              </div>

              <Link
                to={`/booking/${room._id}`}
                className="btn btn-hp-gold w-100 rounded-pill py-3 fw-bold d-flex align-items-center justify-content-center gap-2 fs-6 shadow-sm mb-3"
              >
                Proceed to Reservation <FiArrowRight />
              </Link>

              <div className="text-center text-muted small">
                <FiShield className="text-success me-1 mb-1" />
                Zero Card Data Stored • Instant Confirmation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;

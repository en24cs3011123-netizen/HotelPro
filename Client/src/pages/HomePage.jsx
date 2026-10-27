import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AvailabilitySearch from '../components/rooms/AvailabilitySearch';
import RoomCard from '../components/rooms/RoomCard';
import { roomService, LUXURY_FALLBACK_ROOMS } from '../services/roomService';
import { FiAward, FiShield, FiWifi, FiCoffee, FiCompass, FiStar, FiCheckCircle } from 'react-icons/fi';

const HomePage = () => {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    // 1. Fetch featured rooms
    const loadRooms = async () => {
      try {
        const result = await roomService.getRooms({ limit: 3 });
        setFeaturedRooms(result.data?.slice(0, 3) || LUXURY_FALLBACK_ROOMS.slice(0, 3));
      } catch {
        setFeaturedRooms(LUXURY_FALLBACK_ROOMS.slice(0, 3));
      } finally {
        setLoadingRooms(false);
      }
    };

    loadRooms();
  }, []);

  return (
    <div>
      {/* Hero Section with Luxury Backdrop */}
      <section
        className="position-relative text-white py-5"
        style={{
          minHeight: '620px',
          background: 'linear-gradient(rgba(13, 27, 42, 0.78), rgba(13, 27, 42, 0.88)), url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80) center/cover no-repeat'
        }}
      >
        <div className="container py-5 d-flex flex-column justify-content-center" style={{ minHeight: '480px' }}>
          <div className="row justify-content-center text-center">
            <div className="col-lg-10">
              <h1 className="display-3 fw-bold mb-3 brand-font">
                Where Timeless Elegance Meets <br />
                <span style={{ color: 'var(--hp-primary-gold)' }}>Unrivaled Hospitality</span>
              </h1>

              <p className="lead text-white-50 mx-auto mb-5" style={{ maxWidth: '780px' }}>
                Discover hand-crafted ocean suites, bespoke Michelin-inspired dining, and tranquil wellness retreats designed for unforgettable memories.
              </p>
            </div>
          </div>

          {/* Floating Availability Search Widget */}
          <div className="row justify-content-center">
            <div className="col-xl-11 col-12">
              <AvailabilitySearch />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Suites Section */}
      <section className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)' }}>
        <div className="container py-4">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
            <div>
              <span
                className="text-uppercase fw-bold small"
                style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
              >
                Signature Accommodations
              </span>
              <h2 className="display-6 fw-bold text-dark mb-0 brand-font">
                Featured Suites &amp; Private Villas
              </h2>
            </div>
            <Link to="/rooms" className="btn btn-outline-dark rounded-pill px-4 mt-3 mt-sm-0">
              View All Accommodations &rarr;
            </Link>
          </div>

          {loadingRooms ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Loading suites...</span>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {featuredRooms.map((room) => (
                <div key={room._id} className="col-lg-4 col-md-6">
                  <RoomCard room={room} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Luxury Amenities & Signature Experiences */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span
              className="text-uppercase fw-bold small"
              style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
            >
              World-Class Service
            </span>
            <h2 className="display-6 fw-bold text-dark brand-font mb-2">
              Curated Amenities for Discerning Guests
            </h2>
            <p className="text-muted">
              Every detail of your stay is curated with precision, ensuring unparalleled privacy, comfort, and effortless leisure.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-3 col-sm-6">
              <div className="card h-100 border-0 p-4 rounded-4 text-center bg-light hp-card">
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ width: '60px', height: '60px', backgroundColor: 'var(--hp-dark-navy)', color: 'var(--hp-primary-gold)' }}
                >
                  <FiCoffee size={24} />
                </div>
                <h5 className="fw-bold mb-2 brand-font">Artisan Dining</h5>
                <p className="text-muted small mb-0">
                  Three award-winning restaurants delivering Michelin-inspired gastronomy and curated sommelier cellars.
                </p>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card h-100 border-0 p-4 rounded-4 text-center bg-light hp-card">
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ width: '60px', height: '60px', backgroundColor: 'var(--hp-dark-navy)', color: 'var(--hp-primary-gold)' }}
                >
                  <FiAward size={24} />
                </div>
                <h5 className="fw-bold mb-2 brand-font">Wellness Spa</h5>
                <p className="text-muted small mb-0">
                  Holistic Ayurvedic treatments, thermal hydrotherapy, and private steam pavilions for deep restoration.
                </p>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card h-100 border-0 p-4 rounded-4 text-center bg-light hp-card">
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ width: '60px', height: '60px', backgroundColor: 'var(--hp-dark-navy)', color: 'var(--hp-primary-gold)' }}
                >
                  <FiCompass size={24} />
                </div>
                <h5 className="fw-bold mb-2 brand-font">Private Infinity Pool</h5>
                <p className="text-muted small mb-0">
                  Temperature-controlled heated horizon pool overlooking panoramic coastal waters with private cabanas.
                </p>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card h-100 border-0 p-4 rounded-4 text-center bg-light hp-card">
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ width: '60px', height: '60px', backgroundColor: 'var(--hp-dark-navy)', color: 'var(--hp-primary-gold)' }}
                >
                  <FiShield size={24} />
                </div>
                <h5 className="fw-bold mb-2 brand-font">24/7 Concierge Butler</h5>
                <p className="text-muted small mb-0">
                  Dedicated personal concierge service managing bespoke excursions, luxury transfers, and private dinners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose HotelPro */}
      <section className="py-5" style={{ backgroundColor: 'var(--hp-dark-navy)' }}>
        <div className="container py-4 text-white">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span
                className="text-uppercase fw-bold small"
                style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
              >
                The HotelPro Guarantee
              </span>
              <h2 className="display-6 fw-bold mb-4 brand-font">
                Engineered for Complete Peace of Mind
              </h2>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex gap-3">
                  <FiCheckCircle className="text-warning flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h6 className="fw-bold mb-1">Guaranteed Zero Overbooking</h6>
                    <p className="text-white-50 small mb-0">
                      Our proprietary date-range inventory engine and 15-minute temporary holds eliminate conflicting double bookings.
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <FiCheckCircle className="text-warning flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h6 className="fw-bold mb-1">Zero-Card-Data Retention (PCI-DSS)</h6>
                    <p className="text-white-50 small mb-0">
                      Payments are processed through official Razorpay hosted checkouts with cryptographic HMAC signatures. We never store raw card numbers.
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <FiCheckCircle className="text-warning flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h6 className="fw-bold mb-1">Flexible Cancellation Policy</h6>
                    <p className="text-white-50 small mb-0">
                      Free cancellation up to 48 hours before check-in with transparent automatic refunds to the original payment source.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="position-relative">
                <img
                  src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80"
                  alt="Hotel Resort"
                  className="rounded-4 shadow-lg w-100 object-fit-cover"
                  style={{ height: '380px' }}
                />
                <div
                  className="position-absolute bottom-0 start-0 m-4 p-3 rounded-3 bg-dark bg-opacity-75 text-white border border-secondary"
                  style={{ maxWidth: '320px' }}
                >
                  <p className="mb-1 fw-bold text-warning small">★ Top Luxury Destination 2026</p>
                  <p className="mb-0 small text-white-50">
                    Voted #1 Premier Beachfront Hotel &amp; Resort by International Traveler Review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Testimonials */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span
              className="text-uppercase fw-bold small"
              style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
            >
              Guest Experiences
            </span>
            <h2 className="display-6 fw-bold text-dark brand-font mb-2">
              Words From Our Esteemed Guests
            </h2>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 rounded-4 bg-light hp-card">
                <div className="d-flex text-warning mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} fill="currentColor" size={16} />
                  ))}
                </div>
                <p className="text-muted small fst-italic mb-3">
                  "The Presidential Suite exceeded all expectations. From the horizon sunset on the balcony to the concierge butler, our anniversary was unforgettable."
                </p>
                <div className="d-flex align-items-center gap-2 mt-auto">
                  <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                    RS
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold small text-dark">Rajesh &amp; Sunita Singhania</h6>
                    <small className="text-muted">Stayed 4 Nights • Deluxe Ocean Suite</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 rounded-4 bg-light hp-card">
                <div className="d-flex text-warning mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} fill="currentColor" size={16} />
                  ))}
                </div>
                <p className="text-muted small fst-italic mb-3">
                  "Booking was completely seamless. The instant reservation hold gave us peace of mind, and the private family villa was pristine."
                </p>
                <div className="d-flex align-items-center gap-2 mt-auto">
                  <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                    AK
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold small text-dark">Aanya Kapoor</h6>
                    <small className="text-muted">Stayed 6 Nights • Family Villa Retreat</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 rounded-4 bg-light hp-card">
                <div className="d-flex text-warning mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} fill="currentColor" size={16} />
                  ))}
                </div>
                <p className="text-muted small fst-italic mb-3">
                  "As a frequent business traveler, the high-speed fiber WiFi and quiet executive rooms made remote meetings feel like a vacation."
                </p>
                <div className="d-flex align-items-center gap-2 mt-auto">
                  <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                    DM
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold small text-dark">David Miller</h6>
                    <small className="text-muted">Stayed 3 Nights • Single Executive</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking CTA Banner */}
      <section className="py-5 text-center text-white" style={{ backgroundColor: 'var(--hp-dark-navy)' }}>
        <div className="container py-4">
          <h2 className="display-6 fw-bold mb-3 brand-font">
            Ready for an Unforgettable Escape?
          </h2>
          <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: '600px' }}>
            Book direct today for our guaranteed best rate, complimentary breakfast, and flexible cancellation privileges.
          </p>
          <Link to="/rooms" className="btn btn-hp-gold btn-lg rounded-pill px-5 fw-semibold">
            Explore All Rooms
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

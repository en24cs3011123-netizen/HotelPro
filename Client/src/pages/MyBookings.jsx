import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import BookingCard from '../components/bookings/BookingCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { FiCalendar, FiPlusCircle, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [payingBookingId, setPayingBookingId] = useState(null);

  // Cancel Modal state
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve reservation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePayBooking = async (booking) => {
    setPayingBookingId(booking._id);
    try {
      toast.info(`Processing secure settlement for ${booking.bookingReference}...`);
      await paymentService.processPayment(booking._id);
      toast.success(`Payment verified! Reservation ${booking.bookingReference} is now Confirmed.`);
      await fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleOpenCancelModal = (booking) => {
    setCancellingBooking(booking);
    setCancelReason('Change of travel itinerary');
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancellingBooking) return;

    setCancelLoading(true);
    try {
      await bookingService.cancelBooking(cancellingBooking._id, cancelReason);
      toast.success(`Reservation ${cancellingBooking.bookingReference} has been cancelled.`);
      setCancellingBooking(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Unable to cancel reservation under active policy window.');
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'confirmed') return b.bookingStatus === 'confirmed' || b.status === 'confirmed';
    if (activeTab === 'pending') return b.bookingStatus === 'pending' || b.status === 'pending';
    if (activeTab === 'completed') return b.bookingStatus === 'checked_out' || b.status === 'completed';
    if (activeTab === 'cancelled') return b.bookingStatus === 'cancelled' || b.status === 'cancelled';
    return true;
  });

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)', minHeight: '85vh' }}>
      <div className="container py-2">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <span
              className="text-uppercase fw-bold small"
              style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
            >
              Guest Portal
            </span>
            <h2 className="display-6 fw-bold text-dark mb-0 brand-font">
              My Reservations &amp; Stays
            </h2>
          </div>
          <Link to="/rooms" className="btn btn-hp-gold rounded-pill px-4 mt-3 mt-sm-0 d-inline-flex align-items-center gap-2">
            <FiPlusCircle /> Reserve Another Suite
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="d-flex gap-2 pb-3 mb-4 overflow-x-auto border-bottom">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'pending', label: 'Pending Payment' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm rounded-pill px-3 py-2 fw-medium ${
                activeTab === tab.id ? 'btn-dark' : 'btn-light border text-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Retrieving your reservation records..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchBookings} />
        ) : filteredBookings.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
            <FiCalendar size={48} className="text-muted mx-auto mb-3" />
            <h5 className="fw-bold text-dark mb-1">No Reservations Found</h5>
            <p className="text-muted small mb-3">
              {activeTab === 'all'
                ? "You haven't reserved any accommodations yet. Discover our signature luxury suites today!"
                : `No reservations under the '${activeTab}' category.`}
            </p>
            <div>
              <Link to="/rooms" className="btn btn-hp-gold btn-sm rounded-pill px-4">
                Explore Available Suites
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onCancel={handleOpenCancelModal}
                onPay={handlePayBooking}
                isPaying={payingBookingId === booking._id}
              />
            ))}
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancellingBooking && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(13, 27, 42, 0.7)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4 p-3">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                    <FiAlertTriangle /> Confirm Stay Cancellation
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setCancellingBooking(null)}
                  ></button>
                </div>

                <form onSubmit={handleConfirmCancel}>
                  <div className="modal-body py-3">
                    <p className="text-muted small mb-3">
                      Are you sure you wish to cancel reservation{' '}
                      <strong>{cancellingBooking.bookingReference}</strong>?
                    </p>

                    <div className="mb-3">
                      <label className="form-label small fw-bold text-dark">Reason for Cancellation</label>
                      <select
                        className="form-select rounded-3 small"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        required
                      >
                        <option value="Change of travel itinerary">Change of travel itinerary</option>
                        <option value="Emergency circumstances">Emergency circumstances</option>
                        <option value="Booking error / duplicate reservation">Booking error / duplicate</option>
                        <option value="Found alternative accommodation">Alternative accommodation</option>
                      </select>
                    </div>

                    <div className="p-3 bg-light rounded-3 small text-muted">
                      <strong>Cancellation Policy:</strong> Free cancellation applies up to 48 hours before arrival. Eligible refunds are refunded automatically to the payment source.
                    </div>
                  </div>

                  <div className="modal-footer border-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-light rounded-pill px-3"
                      onClick={() => setCancellingBooking(null)}
                      disabled={cancelLoading}
                    >
                      Keep Reservation
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger rounded-pill px-4"
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? 'Processing Cancellation...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;

import React from 'react';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiCreditCard, FiAlertCircle } from 'react-icons/fi';

const STATUS_BADGES = {
  confirmed: { bg: 'bg-success', label: 'Confirmed', icon: FiCheckCircle },
  pending: { bg: 'bg-warning text-dark', label: 'Pending Payment', icon: FiClock },
  checked_in: { bg: 'bg-primary', label: 'Checked In', icon: FiCheckCircle },
  checked_out: { bg: 'bg-secondary', label: 'Completed', icon: FiCheckCircle },
  cancelled: { bg: 'bg-danger', label: 'Cancelled', icon: FiXCircle }
};

const PAYMENT_BADGES = {
  paid: { bg: 'bg-success-subtle text-success', label: 'Paid' },
  pending: { bg: 'bg-warning-subtle text-dark', label: 'Unpaid' },
  refunded: { bg: 'bg-info-subtle text-info', label: 'Refunded' },
  failed: { bg: 'bg-danger-subtle text-danger', label: 'Payment Failed' }
};

const BookingCard = ({ booking, onCancel, onPay, isPaying = false }) => {
  const statusInfo = STATUS_BADGES[booking.bookingStatus] || STATUS_BADGES[booking.status] || STATUS_BADGES.pending;
  const paymentInfo = PAYMENT_BADGES[booking.paymentStatus] || PAYMENT_BADGES.pending;
  const StatusIcon = statusInfo.icon;

  const checkInDate = new Date(booking.checkIn || booking.fromDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const checkOutDate = new Date(booking.checkOut || booking.toDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const canCancel =
    booking.bookingStatus !== 'cancelled' &&
    booking.bookingStatus !== 'checked_out' &&
    booking.status !== 'cancelled' &&
    new Date(booking.checkIn || booking.fromDate) > new Date();

  const isPendingPayment =
    (booking.paymentStatus === 'pending' || booking.paymentStatus === 'unpaid' || booking.bookingStatus === 'pending') &&
    booking.bookingStatus !== 'cancelled';

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white hp-card">
      <div className="d-flex flex-wrap justify-content-between align-items-center pb-3 border-bottom mb-3">
        <div>
          <span className="text-muted small text-uppercase">Reference Code</span>
          <h6 className="fw-bold text-dark mb-0 brand-font" style={{ letterSpacing: '0.5px' }}>
            {booking.bookingReference}
          </h6>
        </div>
        <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">
          <span className={`badge ${statusInfo.bg} rounded-pill px-3 py-2 small d-inline-flex align-items-center gap-1`}>
            <StatusIcon size={13} /> {statusInfo.label}
          </span>
          <span className={`badge ${paymentInfo.bg} rounded-pill px-3 py-2 small border`}>
            {paymentInfo.label}
          </span>
        </div>
      </div>

      <div className="row g-3 align-items-center">
        {/* Room & Hotel */}
        <div className="col-md-5">
          <p className="mb-0 fw-bold text-dark fs-6">
            Suite #{booking.room?.roomNumber || 'Luxury'} — {(booking.room?.roomType || booking.room?.type || 'Deluxe Suite').toUpperCase()}
          </p>
          <p className="text-muted small mb-0">
            {booking.hotel?.name || 'The Grand Palace Resort & Spa'} ({booking.hotel?.city || 'Mumbai'})
          </p>
          <small className="text-muted">
            Guest: {booking.guestDetails?.fullName || booking.username || 'Valued Guest'} ({booking.guestDetails?.phone || booking.phone || ''})
          </small>
        </div>

        {/* Dates */}
        <div className="col-md-4">
          <div className="d-flex align-items-center gap-2 small mb-1">
            <FiCalendar style={{ color: 'var(--hp-primary-gold)' }} />
            <span className="text-dark fw-medium">
              {checkInDate} <span className="text-muted">to</span> {checkOutDate}
            </span>
          </div>
          <p className="text-muted small mb-0 ps-4">
            {booking.numberOfNights || booking.totalDays || 1} Night(s) • {booking.numberOfRooms || 1} Room(s)
          </p>
        </div>

        {/* Total & Actions */}
        <div className="col-md-3 text-md-end">
          <p className="mb-0 small text-muted">Total Paid / Due</p>
          <h5 className="fw-bold brand-font mb-2" style={{ color: 'var(--hp-primary-gold)' }}>
            ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
          </h5>

          <div className="d-flex flex-wrap justify-content-md-end gap-2 align-items-center">
            {isPendingPayment && onPay && (
              <button
                onClick={() => onPay(booking)}
                className="btn btn-hp-gold btn-sm rounded-pill px-3 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                disabled={isPaying}
              >
                <FiCreditCard size={14} />
                {isPaying ? 'Processing...' : 'Pay Now'}
              </button>
            )}

            {canCancel && onCancel && (
              <button
                onClick={() => onCancel(booking)}
                className="btn btn-outline-danger btn-sm rounded-pill px-3"
              >
                Cancel Stay
              </button>
            )}
          </div>

          {booking.bookingStatus === 'cancelled' && booking.cancellationDetails?.reason && (
            <small className="text-danger d-block mt-1">
              Cancelled: {booking.cancellationDetails.reason}
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;

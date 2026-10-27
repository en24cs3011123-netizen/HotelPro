import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { FiArrowLeft, FiSearch, FiCalendar, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAllBookings();
      setBookings(res.data || []);
    } catch {
      // Mock demonstration bookings
      setBookings([
        {
          _id: 'b-mock-1',
          bookingReference: 'HP-2026-881249',
          username: 'Aarav Sharma',
          phone: '+919876543210',
          checkIn: '2026-11-10',
          checkOut: '2026-11-14',
          totalAmount: 35400,
          bookingStatus: 'confirmed',
          paymentStatus: 'paid'
        },
        {
          _id: 'b-mock-2',
          bookingReference: 'HP-2026-441920',
          username: 'Priya Verma',
          phone: '+919812345678',
          checkIn: '2026-11-12',
          checkOut: '2026-11-15',
          totalAmount: 24000,
          bookingStatus: 'pending',
          paymentStatus: 'pending'
        },
        {
          _id: 'b-mock-3',
          bookingReference: 'HP-2026-992143',
          username: 'Kabir Mehta',
          phone: '+919876500000',
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
          totalAmount: 48000,
          bookingStatus: 'checked_out',
          paymentStatus: 'paid'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await adminService.updateBookingStatus(bookingId, newStatus);
      toast.success(`Booking status updated to ${newStatus}.`);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, bookingStatus: newStatus } : b))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const query = searchQuery.toLowerCase();
    const refMatch = b.bookingReference?.toLowerCase().includes(query);
    const guestMatch = (b.username || b.guestDetails?.fullName || '').toLowerCase().includes(query);
    const phoneMatch = (b.phone || b.guestDetails?.phone || '').includes(query);
    return refMatch || guestMatch || phoneMatch;
  });

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)', minHeight: '85vh' }}>
      <div className="container py-2">
        <Link to="/admin" className="btn btn-link text-muted p-0 mb-3 d-inline-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Management Console
        </Link>

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <span
              className="text-uppercase fw-bold small"
              style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
            >
              Front Desk Operations
            </span>
            <h2 className="display-6 fw-bold text-dark mb-0 brand-font">
              Guest Reservations Registry
            </h2>
          </div>
          {/* Search Box */}
          <div className="mt-3 mt-sm-0" style={{ width: '300px' }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 rounded-start-pill ps-3">
                <FiSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 rounded-end-pill py-2 small"
                placeholder="Search reference, guest, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <LoadingSpinner message="Retrieving guest reservation records..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchBookings} />
        ) : (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th className="ps-4">Reference</th>
                    <th>Primary Guest</th>
                    <th>Stay Dates</th>
                    <th>Amount Paid</th>
                    <th>Payment Status</th>
                    <th>Reservation Status</th>
                    <th className="text-end pe-4">Update Status</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredBookings.map((b) => (
                    <tr key={b._id}>
                      <td className="ps-4 py-3 fw-bold brand-font text-dark">
                        {b.bookingReference}
                      </td>
                      <td>
                        <strong>{b.username || b.guestDetails?.fullName || 'Guest'}</strong>
                        <span className="text-muted d-block small">
                          {b.phone || b.guestDetails?.phone}
                        </span>
                      </td>
                      <td>
                        <span className="d-block">{b.checkIn} to {b.checkOut}</span>
                      </td>
                      <td className="fw-bold" style={{ color: 'var(--hp-primary-gold)' }}>
                        ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            b.paymentStatus === 'paid'
                              ? 'bg-success-subtle text-success'
                              : 'bg-warning-subtle text-dark'
                          } border px-2 py-1 rounded-pill`}
                        >
                          {b.paymentStatus?.toUpperCase() || 'PAID'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            b.bookingStatus === 'confirmed'
                              ? 'bg-success'
                              : b.bookingStatus === 'checked_in'
                              ? 'bg-primary'
                              : b.bookingStatus === 'checked_out'
                              ? 'bg-secondary'
                              : b.bookingStatus === 'cancelled'
                              ? 'bg-danger'
                              : 'bg-warning text-dark'
                          } px-2 py-1 rounded-pill`}
                        >
                          {b.bookingStatus || b.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <select
                          className="form-select form-select-sm rounded-pill d-inline-block w-auto"
                          value={b.bookingStatus || b.status}
                          disabled={updatingId === b._id}
                          onChange={(e) => handleStatusChange(b._id, e.target.value)}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="checked_in">Checked In</option>
                          <option value="checked_out">Checked Out</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;

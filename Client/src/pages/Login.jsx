import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn, FiAlertCircle, FiUser, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Login = () => {
  const { login, logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [roleTab, setRoleTab] = useState('guest');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Target destination after successful login
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await login(formData);
      toast.success(res?.message || 'Welcome back to HotelPro!');

      // Redirect admin to admin dashboard, guests to their destination or my-bookings
      const userRole = res?.data?.user?.role || res?.data?.user?.userType;
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate(from === '/' ? '/my-bookings' : from);
      }
    } catch (err) {
      const msg = err.message || 'Invalid email or password credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (role) => {
    setRoleTab(role);
    if (role === 'admin') {
      setFormData({
        email: 'admin@hotelpro.com',
        password: 'AdminPassword2026!'
      });
    } else {
      setFormData({
        email: 'priya.sharma@example.com',
        password: 'LuxuryHotelPassword2026!'
      });
    }
  };

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)', minHeight: '80vh' }}>
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white">
              {/* Header */}
              <div className="text-center mb-4">
                <span className="brand-font fs-3 fw-bold" style={{ color: 'var(--hp-dark-navy)' }}>
                  ★ HOTEL<span style={{ color: 'var(--hp-primary-gold)' }}>PRO</span>
                </span>
                <h4 className="fw-bold text-dark mt-2 mb-1 brand-font">
                  {roleTab === 'admin' ? 'Admin Management Portal' : 'Guest Reservation Portal'}
                </h4>
                <p className="text-muted small">
                  {roleTab === 'admin'
                    ? 'Sign in to access analytics, room management & bookings'
                    : 'Sign in to manage your luxury stay and reservations'}
                </p>
              </div>

              {/* Already Authenticated Banner */}
              {isAuthenticated && (
                <div className="alert alert-info py-2 px-3 small rounded-3 d-flex justify-content-between align-items-center mb-3">
                  <div>
                    Signed in as <strong>{user?.name}</strong> ({user?.role?.toUpperCase()})
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      toast.info('Signed out. Select a role and sign in.');
                    }}
                    className="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill fw-semibold"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {/* Guest vs Admin Switcher Tabs */}
              <div className="d-flex p-1 bg-light rounded-pill mb-4 border">
                <button
                  type="button"
                  className={`btn btn-sm w-50 rounded-pill fw-semibold py-2 d-flex align-items-center justify-content-center gap-2 ${
                    roleTab === 'guest'
                      ? 'btn-hp-gold text-white shadow-sm'
                      : 'text-muted border-0 bg-transparent'
                  }`}
                  onClick={() => fillDemoAccount('guest')}
                >
                  <FiUser /> Guest Login
                </button>
                <button
                  type="button"
                  className={`btn btn-sm w-50 rounded-pill fw-semibold py-2 d-flex align-items-center justify-content-center gap-2 ${
                    roleTab === 'admin'
                      ? 'btn-dark text-white shadow-sm'
                      : 'text-muted border-0 bg-transparent'
                  }`}
                  onClick={() => fillDemoAccount('admin')}
                >
                  <FiShield /> Admin Login
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
                  <FiAlertCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                      <FiMail className="text-muted" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className="form-control bg-light border-start-0 rounded-end-pill py-2"
                      placeholder={roleTab === 'admin' ? 'admin@hotelpro.com' : 'priya.sharma@example.com'}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-bold text-muted mb-0">Password</label>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      Case sensitive
                    </span>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                      <FiLock className="text-muted" />
                    </span>
                    <input
                      type="password"
                      name="password"
                      className="form-control bg-light border-start-0 rounded-end-pill py-2"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3 ${
                    roleTab === 'admin' ? 'btn-dark' : 'btn-hp-gold'
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <FiLogIn /> Sign In as {roleTab === 'admin' ? 'Administrator' : 'Guest'}
                    </>
                  )}
                </button>
              </form>

              {/* Demo Accounts Quick-Fill Helper */}
              <div className="border-top pt-3 text-center">
                <small className="text-muted d-block mb-2">Instant Demo Autofill:</small>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('guest')}
                    className={`btn btn-sm rounded-pill px-3 py-1 ${
                      roleTab === 'guest' ? 'btn-secondary text-white' : 'btn-outline-secondary'
                    }`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Demo Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('admin')}
                    className={`btn btn-sm rounded-pill px-3 py-1 ${
                      roleTab === 'admin' ? 'btn-dark text-white' : 'btn-outline-dark'
                    }`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Demo Admin
                  </button>
                </div>
              </div>

              {/* Registration Link */}
              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted small mb-0">
                  New to HotelPro?{' '}
                  <Link to="/register" className="fw-bold" style={{ color: 'var(--hp-primary-gold)' }}>
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

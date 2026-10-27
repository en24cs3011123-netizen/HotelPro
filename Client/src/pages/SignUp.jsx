import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const SignUp = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    if (formData.phone.replace(/\D/g, '').length < 10) {
      setError('Please provide a valid 10-digit contact phone number.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await register(formData);
      toast.success(res?.message || 'Registration successful! Welcome to HotelPro.');
      navigate('/my-bookings');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please review your details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)', minHeight: '85vh' }}>
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white">
              {/* Header */}
              <div className="text-center mb-4">
                <span className="brand-font fs-3 fw-bold" style={{ color: 'var(--hp-dark-navy)' }}>
                  ★ HOTEL<span style={{ color: 'var(--hp-primary-gold)' }}>PRO</span>
                </span>
                <h4 className="fw-bold text-dark mt-2 mb-1 brand-font">Join HotelPro Club</h4>
                <p className="text-muted small">Create your account for exclusive rates and seamless reservations</p>
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
                {/* Full Name */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                      <FiUser className="text-muted" />
                    </span>
                    <input
                      type="text"
                      name="name"
                      className="form-control bg-light border-start-0 rounded-end-pill py-2"
                      placeholder="e.g. Ananya Roy"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
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
                      placeholder="ananya@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Mobile Phone</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                      <FiPhone className="text-muted" />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control bg-light border-start-0 rounded-end-pill py-2"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                      <FiLock className="text-muted" />
                    </span>
                    <input
                      type="password"
                      name="password"
                      className="form-control bg-light border-start-0 rounded-end-pill py-2"
                      placeholder="At least 8 characters (A-Z, a-z, 0-9)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                      <FiLock className="text-muted" />
                    </span>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control bg-light border-start-0 rounded-end-pill py-2"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-hp-gold w-100 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Registering Account...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle /> Create Guest Account
                    </>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center mt-3 pt-3 border-top">
                <p className="text-muted small mb-0">
                  Already have a HotelPro account?{' '}
                  <Link to="/login" className="fw-bold" style={{ color: 'var(--hp-primary-gold)' }}>
                    Sign in here
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

export default SignUp;

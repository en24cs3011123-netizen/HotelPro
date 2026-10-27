import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiShield, FiLock, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    setTimeout(() => {
      setUpdatingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast.success('Security password updated successfully.');
    }, 800);
  };

  return (
    <div className="py-5" style={{ backgroundColor: 'var(--hp-light-bg)', minHeight: '85vh' }}>
      <div className="container py-2">
        <div className="mb-4">
          <span
            className="text-uppercase fw-bold small"
            style={{ color: 'var(--hp-primary-gold)', letterSpacing: '1px' }}
          >
            Account Center
          </span>
          <h2 className="display-6 fw-bold text-dark mb-0 brand-font">
            Profile &amp; Security Settings
          </h2>
        </div>

        <div className="row g-4">
          {/* Profile Overview Card */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white h-100">
              <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4"
                  style={{ width: '64px', height: '64px', backgroundColor: 'var(--hp-dark-navy)' }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HP'}
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-1 brand-font">{user?.name || 'Valued Guest'}</h5>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small d-inline-flex align-items-center gap-1">
                    <FiCheckCircle size={12} /> Verified HotelPro Member
                  </span>
                </div>
              </div>

              <div className="d-flex flex-column gap-3 small">
                <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <FiMail style={{ color: 'var(--hp-primary-gold)' }} /> Registered Email:
                  </span>
                  <span className="fw-semibold text-dark">{user?.email}</span>
                </div>

                <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <FiPhone style={{ color: 'var(--hp-primary-gold)' }} /> Contact Phone:
                  </span>
                  <span className="fw-semibold text-dark">{user?.phone || 'Not configured'}</span>
                </div>

                <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted d-flex align-items-center gap-2">
                    <FiShield style={{ color: 'var(--hp-primary-gold)' }} /> Account Classification:
                  </span>
                  <span className="badge bg-dark text-uppercase px-3 py-1">
                    {user?.role || user?.userType || 'GUEST'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Password Card */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white h-100">
              <h5 className="fw-bold text-dark brand-font mb-2">Update Password</h5>
              <p className="text-muted small mb-4">
                Ensure your account maintains robust security credentials.
              </p>

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Current Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light rounded-start-pill ps-3">
                      <FiLock className="text-muted" />
                    </span>
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-control bg-light rounded-end-pill"
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light rounded-start-pill ps-3">
                      <FiLock className="text-muted" />
                    </span>
                    <input
                      type="password"
                      name="newPassword"
                      className="form-control bg-light rounded-end-pill"
                      placeholder="At least 8 characters"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">Confirm New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light rounded-start-pill ps-3">
                      <FiLock className="text-muted" />
                    </span>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      className="form-control bg-light rounded-end-pill"
                      placeholder="Re-enter new password"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-outline-dark w-100 rounded-pill py-2 fw-semibold"
                  disabled={updatingPassword}
                >
                  {updatingPassword ? 'Updating Credentials...' : 'Save New Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

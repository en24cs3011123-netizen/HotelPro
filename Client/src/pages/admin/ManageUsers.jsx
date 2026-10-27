import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { FiArrowLeft, FiSearch, FiUser, FiCheckCircle, FiXCircle, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAllUsers();
      setUsers(res.data || []);
    } catch {
      // Mock demonstration users
      setUsers([
        {
          _id: 'u-1',
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          phone: '+919876543210',
          role: 'guest',
          userType: 'customer',
          isActive: true
        },
        {
          _id: 'u-2',
          name: 'Vikram Singh',
          email: 'vikram.singh@example.com',
          phone: '+919812345678',
          role: 'staff',
          userType: 'customer',
          isActive: true
        },
        {
          _id: 'u-3',
          name: 'Admin Executive',
          email: 'admin@hotelpro.com',
          phone: '+919800000000',
          role: 'admin',
          userType: 'admin',
          isActive: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    setUpdatingId(user._id);
    const newActiveState = !user.isActive;

    try {
      await adminService.updateUserRoleStatus(user._id, { isActive: newActiveState });
      toast.success(`User ${user.name} is now ${newActiveState ? 'Active' : 'Deactivated'}.`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: newActiveState } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
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
              Account Governance
            </span>
            <h2 className="display-6 fw-bold text-dark mb-0 brand-font">
              Registered Accounts &amp; Roles
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
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <LoadingSpinner message="Auditing user accounts directory..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchUsers} />
        ) : (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-uppercase text-muted">
                  <tr>
                    <th className="ps-4">User</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Role Classification</th>
                    <th>Account Status</th>
                    <th className="text-end pe-4">Status Action</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: '36px',
                              height: '36px',
                              backgroundColor: u.role === 'admin' ? '#0d1b2a' : '#415a77'
                            }}
                          >
                            {u.name?.slice(0, 1).toUpperCase()}
                          </div>
                          <strong>{u.name}</strong>
                        </div>
                      </td>
                      <td className="text-muted">{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'admin'
                              ? 'bg-danger'
                              : u.role === 'staff'
                              ? 'bg-warning text-dark'
                              : 'bg-secondary'
                          } text-uppercase px-2 py-1 rounded-pill`}
                        >
                          {u.role || u.userType}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                          } border px-2 py-1 rounded-pill`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={updatingId === u._id || u.role === 'admin'}
                          className={`btn btn-sm rounded-pill px-3 ${
                            u.isActive ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
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

export default ManageUsers;

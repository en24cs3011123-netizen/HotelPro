import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiLogOut, FiCalendar, FiShield, FiHome, FiGrid, FiRepeat } from 'react-icons/fi';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(true);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark py-3 sticky-top shadow-sm"
      style={{ backgroundColor: 'var(--hp-dark-navy)', borderBottom: '1px solid rgba(197, 168, 128, 0.2)' }}
    >
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2 brand-font fs-4 text-white" to="/" onClick={() => setNavCollapsed(true)}>
          <span style={{ color: 'var(--hp-primary-gold)', fontWeight: 800 }}>★</span>
          <span className="text-white" style={{ letterSpacing: '1.5px', fontWeight: 700, color: '#ffffff' }}>
            HOTEL<span style={{ color: 'var(--hp-primary-gold)' }}>PRO</span>
          </span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setNavCollapsed(prev => !prev)}
          aria-controls="navbarNav"
          aria-expanded={!navCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${!navCollapsed ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <Link className="nav-link px-3 text-white-50 hover-text-gold" to="/" onClick={() => setNavCollapsed(true)}>
                <FiHome className="me-1 mb-1" /> Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link px-3 text-white-50 hover-text-gold" to="/rooms" onClick={() => setNavCollapsed(true)}>
                <FiGrid className="me-1 mb-1" /> Rooms &amp; Suites
              </Link>
            </li>

            {/* Authenticated Guest Navigation */}
            {isAuthenticated && !isAdmin && (
              <li className="nav-item">
                <Link className="nav-link px-3 text-white-50 hover-text-gold" to="/my-bookings" onClick={() => setNavCollapsed(true)}>
                  <FiCalendar className="me-1 mb-1" /> My Bookings
                </Link>
              </li>
            )}

            {/* Authenticated Admin Navigation */}
            {isAuthenticated && isAdmin && (
              <li className="nav-item">
                <Link
                  className="nav-link px-3 text-warning fw-semibold d-inline-flex align-items-center gap-1"
                  to="/admin"
                  onClick={() => setNavCollapsed(true)}
                >
                  <FiShield /> Admin Console
                </Link>
              </li>
            )}

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="d-flex align-items-center ms-lg-3 mt-2 mt-lg-0">
                <div className="nav-item dropdown position-relative" ref={dropdownRef}>
                  <button
                    className={`btn btn-outline-light btn-sm rounded-pill px-3 dropdown-toggle d-inline-flex align-items-center gap-2 ${dropdownOpen ? 'show' : ''}`}
                    type="button"
                    id="userDropdown"
                    onClick={() => setDropdownOpen(prev => !prev)}
                    aria-expanded={dropdownOpen}
                  >
                    <FiUser style={{ color: 'var(--hp-primary-gold)' }} />
                    <span className="fw-medium text-truncate" style={{ maxWidth: '120px' }}>
                      {user?.name || 'My Account'}
                    </span>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: isAdmin ? '#dc3545' : 'var(--hp-primary-gold)',
                        fontSize: '0.65rem'
                      }}
                    >
                      {user?.role?.toUpperCase() || 'GUEST'}
                    </span>
                  </button>
                  <ul
                    className={`dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2 py-2 ${dropdownOpen ? 'show' : ''}`}
                    style={{
                      display: dropdownOpen ? 'block' : 'none',
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      zIndex: 1050,
                      minWidth: '220px'
                    }}
                    aria-labelledby="userDropdown"
                  >
                    <li className="px-3 py-2 border-bottom">
                      <p className="mb-0 small fw-bold text-dark">{user?.name}</p>
                      <p className="mb-0 text-muted small text-truncate">{user?.email}</p>
                      <span
                        className="badge mt-1"
                        style={{
                          backgroundColor: isAdmin ? '#dc3545' : 'var(--hp-primary-gold)',
                          fontSize: '0.7rem'
                        }}
                      >
                        {isAdmin ? 'ADMINISTRATOR' : 'GUEST USER'}
                      </span>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item py-2 small d-flex align-items-center gap-2"
                        to="/profile"
                        onClick={() => {
                          setDropdownOpen(false);
                          setNavCollapsed(true);
                        }}
                      >
                        <FiUser /> Profile Overview
                      </Link>
                    </li>
                    {!isAdmin && (
                      <li>
                        <Link
                          className="dropdown-item py-2 small d-flex align-items-center gap-2"
                          to="/my-bookings"
                          onClick={() => {
                            setDropdownOpen(false);
                            setNavCollapsed(true);
                          }}
                        >
                          <FiCalendar /> Reservation History
                        </Link>
                      </li>
                    )}
                    {isAdmin && (
                      <li>
                        <Link
                          className="dropdown-item py-2 small d-flex align-items-center gap-2 text-primary"
                          to="/admin"
                          onClick={() => {
                            setDropdownOpen(false);
                            setNavCollapsed(true);
                          }}
                        >
                          <FiShield /> Management Portal
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider my-2" /></li>
                    <li>
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await logout();
                          navigate('/login');
                        }}
                        className="dropdown-item py-2 small text-primary d-flex align-items-center gap-2"
                      >
                        <FiRepeat /> Switch Account / Role
                      </button>
                    </li>
                    <li>
                      <button
                        id="dropdownSignOutBtn"
                        onClick={handleLogout}
                        className="dropdown-item py-2 small text-danger d-flex align-items-center gap-2"
                      >
                        <FiLogOut /> Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 ms-lg-3 mt-2 mt-lg-0">
                <Link className="btn btn-outline-light btn-sm px-3 rounded-pill" to="/login" onClick={() => setNavCollapsed(true)}>
                  Sign In
                </Link>
                <Link className="btn btn-hp-gold btn-sm px-3 rounded-pill" to="/register" onClick={() => setNavCollapsed(true)}>
                  Register
                </Link>
              </div>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

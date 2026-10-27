import React from 'react';

const Footer = () => {
  return (
    <footer className="text-white py-5 mt-auto" style={{ backgroundColor: 'var(--hp-dark-navy)', borderTop: '2px solid var(--hp-primary-gold)' }}>
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <h5 className="brand-font mb-3 text-white">
              HOTEL<span style={{ color: 'var(--hp-primary-gold)' }}>PRO</span>
            </h5>
            <p className="text-white-50 small pe-lg-4">
              A bespoke luxury hotel management and reservation system delivering refined guest experiences, operational precision, and seamless booking.
            </p>
          </div>
          <div className="col-lg-2 col-md-6">
            <h6 className="text-uppercase small fw-bold mb-3" style={{ color: 'var(--hp-primary-gold)' }}>Navigation</h6>
            <ul className="list-unstyled text-white-50 small d-flex flex-column gap-2 mb-0">
              <li><a href="/" className="text-decoration-none text-white-50">Home</a></li>
              <li><a href="/rooms" className="text-decoration-none text-white-50">Rooms & Suites</a></li>
              <li><a href="/about" className="text-decoration-none text-white-50">About Property</a></li>
              <li><a href="/contact" className="text-decoration-none text-white-50">Contact & Concierge</a></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-uppercase small fw-bold mb-3" style={{ color: 'var(--hp-primary-gold)' }}>Architecture</h6>
            <ul className="list-unstyled text-white-50 small d-flex flex-column gap-2 mb-0">
              <li>Modular Monolith Backend</li>
              <li>MongoDB ACID Transactions</li>
              <li>Razorpay PCI-DSS Level 1 Vault</li>
              <li>Zero-Card-Data Retention</li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-uppercase small fw-bold mb-3" style={{ color: 'var(--hp-primary-gold)' }}>Security & Status</h6>
            <p className="text-white-50 small mb-2">Restricted RBAC Tier: Guest / Staff / Admin</p>
            <span className="badge bg-success text-white small">API v1 Connected</span>
          </div>
        </div>
        <hr className="border-secondary my-4" />
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center text-white-50 small">
          <div>&copy; {new Date().getFullYear()} HotelPro Management System. All rights reserved.</div>
          <div className="mt-2 mt-sm-0">Phase 2: Environment Setup &amp; Configuration Active</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

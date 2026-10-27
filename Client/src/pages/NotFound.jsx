import React from 'react';
import { Link } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="py-5 text-center d-flex align-items-center" style={{ minHeight: '75vh', backgroundColor: 'var(--hp-light-bg)' }}>
      <div className="container">
        <div className="card border-0 shadow-lg rounded-4 p-5 mx-auto bg-white" style={{ maxWidth: '540px' }}>
          <div
            className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
            style={{ width: '80px', height: '80px', backgroundColor: 'var(--hp-dark-navy)', color: 'var(--hp-primary-gold)' }}
          >
            <FiCompass size={40} />
          </div>
          <h1 className="display-4 fw-bold brand-font text-dark mb-1">404</h1>
          <h4 className="fw-bold text-dark mb-2 brand-font">Page Not Found</h4>
          <p className="text-muted small mb-4">
            The luxury experience or suite view you requested appears to have wandered off the resort grounds.
          </p>
          <div>
            <Link to="/" className="btn btn-hp-gold rounded-pill px-5 fw-semibold">
              Return to Resort Lobby
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

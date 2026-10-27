import React from 'react';

const LoadingSpinner = ({ message = 'Loading luxury experience...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 my-4">
      <div
        className="spinner-border mb-3"
        role="status"
        style={{ width: '3rem', height: '3rem', color: 'var(--hp-primary-gold)' }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted fw-medium small mb-0">{message}</p>
    </div>
  );
};

export default LoadingSpinner;

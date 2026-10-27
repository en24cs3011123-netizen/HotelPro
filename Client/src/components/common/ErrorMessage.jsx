import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const ErrorMessage = ({ message = 'Failed to load content.', onRetry }) => {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 my-4 bg-light text-center">
      <div className="d-flex justify-content-center mb-2">
        <FiAlertCircle size={36} className="text-danger" />
      </div>
      <h6 className="fw-bold text-dark mb-1">Something went wrong</h6>
      <p className="text-muted small mb-3">{message}</p>
      {onRetry && (
        <div className="d-flex justify-content-center">
          <button
            onClick={onRetry}
            className="btn btn-sm btn-outline-dark rounded-pill px-3 d-inline-flex align-items-center gap-2"
          >
            <FiRefreshCw size={14} /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;

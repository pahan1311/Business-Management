import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="mb-4">
              <i className="bi bi-exclamation-triangle display-1 text-warning"></i>
            </div>
            <h1 className="display-4 fw-bold text-primary">404</h1>
            <h2 className="mb-4">Page Not Found</h2>
            <p className="lead text-muted mb-4">
              The page you are looking for doesn't exist or has been moved.
            </p>
            <Link to="/" className="btn btn-primary">
              <i className="bi bi-house me-2"></i>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

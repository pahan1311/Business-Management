import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const spinnerSize = size === 'sm' ? 'spinner-border-sm' : '';
  
  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      <div className="text-center">
        <div className={`spinner-border text-primary ${spinnerSize}`} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        {text && <div className="mt-2 text-muted">{text}</div>}
      </div>
    </div>
  );
};

export default LoadingSpinner;

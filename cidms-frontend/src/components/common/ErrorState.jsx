const ErrorState = ({ 
  title = "Something went wrong", 
  description = "An error occurred while loading the data.", 
  onRetry = null 
}) => {
  return (
    <div className="error-state">
      <i className="bi bi-exclamation-triangle"></i>
      <h5>{title}</h5>
      <p>{description}</p>
      {onRetry && (
        <button className="btn btn-outline-danger" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;

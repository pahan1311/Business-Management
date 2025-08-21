const LoadingBlock = ({ text = "Loading..." }) => {
  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      <div className="spinner-border me-3" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <span>{text}</span>
    </div>
  );
};

export default LoadingBlock;

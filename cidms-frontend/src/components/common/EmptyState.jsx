const EmptyState = ({ 
  icon = "inbox", 
  title = "No data available", 
  description = "There are no items to display.", 
  actionButton = null 
}) => {
  return (
    <div className="empty-state">
      <i className={`bi bi-${icon}`}></i>
      <h5>{title}</h5>
      <p>{description}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;

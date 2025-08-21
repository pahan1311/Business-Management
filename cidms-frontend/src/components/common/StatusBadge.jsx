const StatusBadge = ({ status, type = 'order' }) => {
  const getStatusConfig = (status, type) => {
    const configs = {
      order: {
        'PENDING': { class: 'bg-warning', text: 'Pending' },
        'CONFIRMED': { class: 'bg-info', text: 'Confirmed' },
        'PREPARING': { class: 'bg-primary', text: 'Preparing' },
        'READY_FOR_DISPATCH': { class: 'bg-success', text: 'Ready for Dispatch' },
        'OUT_FOR_DELIVERY': { class: 'bg-warning', text: 'Out for Delivery' },
        'DELIVERED': { class: 'bg-success', text: 'Delivered' },
        'CANCELED': { class: 'bg-danger', text: 'Canceled' },
      },
      delivery: {
        'ASSIGNED': { class: 'bg-info', text: 'Assigned' },
        'PICKED_UP': { class: 'bg-primary', text: 'Picked Up' },
        'OUT_FOR_DELIVERY': { class: 'bg-warning', text: 'Out for Delivery' },
        'DELIVERED': { class: 'bg-success', text: 'Delivered' },
        'FAILED': { class: 'bg-danger', text: 'Failed' },
        'CANCELED': { class: 'bg-danger', text: 'Canceled' },
      },
      task: {
        'PENDING': { class: 'bg-warning', text: 'Pending' },
        'IN_PROGRESS': { class: 'bg-primary', text: 'In Progress' },
        'COMPLETED': { class: 'bg-success', text: 'Completed' },
        'CANCELED': { class: 'bg-danger', text: 'Canceled' },
      },
      inquiry: {
        'OPEN': { class: 'bg-info', text: 'Open' },
        'IN_PROGRESS': { class: 'bg-primary', text: 'In Progress' },
        'RESOLVED': { class: 'bg-success', text: 'Resolved' },
        'CLOSED': { class: 'bg-secondary', text: 'Closed' },
      },
      stock: {
        'LOW': { class: 'bg-danger', text: 'Low Stock' },
        'OK': { class: 'bg-success', text: 'In Stock' },
        'OUT': { class: 'bg-warning', text: 'Out of Stock' },
      },
    };

    return configs[type]?.[status] || { class: 'bg-secondary', text: status };
  };

  const config = getStatusConfig(status, type);

  return (
    <span className={`badge status-badge ${config.class}`}>
      {config.text}
    </span>
  );
};

export default StatusBadge;

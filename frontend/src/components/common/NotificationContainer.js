import React from 'react';
import { useApp } from '../../context/AppContext';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`alert alert-${notification.type === 'error' ? 'danger' : notification.type} alert-dismissible fade show`}
          role="alert"
        >
          <div className="d-flex align-items-center">
            <i className={`bi bi-${getNotificationIcon(notification.type)} me-2`}></i>
            {notification.message}
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => removeNotification(notification.id)}
          ></button>
        </div>
      ))}
    </div>
  );
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return 'check-circle';
    case 'error':
      return 'exclamation-circle';
    case 'warning':
      return 'exclamation-triangle';
    case 'info':
    default:
      return 'info-circle';
  }
};

export default NotificationContainer;

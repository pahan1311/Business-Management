import React from 'react';
import { getStatusBadgeColor } from '../../utils/helpers';

const StatusBadge = ({ status, onClick, className = '' }) => {
  const badgeColor = getStatusBadgeColor(status);
  const badgeClass = `badge bg-${badgeColor} ${onClick ? 'cursor-pointer' : ''} ${className}`;
  
  const formatStatus = (status) => {
    if (!status) return '';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <span 
      className={badgeClass}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;

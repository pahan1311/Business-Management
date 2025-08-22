import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RequireAuth = ({ children, roles = [] }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Convert roles to uppercase for case-insensitive comparison
  const normalizedRoles = roles.map(role => role.toUpperCase());
  const userRole = user.role.toUpperCase();
  
  console.log('Checking role access:', { 
    userRole, 
    requiredRoles: normalizedRoles,
    hasAccess: normalizedRoles.includes(userRole)
  });

  if (roles.length > 0 && !normalizedRoles.includes(userRole)) {
    console.log('Unauthorized role, redirecting to root');
    return <Navigate to="/" replace />;
  }

  console.log('Access granted for role:', user.role);
  return children;
};

export default RequireAuth;

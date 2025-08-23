import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isCustomer, isStaff, isDeliveryPerson } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getNavLinks = () => {
    if (!isAuthenticated) return [];

    const links = [];
    
    if (isAdmin()) {
      links.push(
        { path: '/admin', label: 'Admin Dashboard', icon: 'speedometer2' },
        { path: '/admin/customers', label: 'Customers', icon: 'people' },
        { path: '/admin/inventory', label: 'Inventory', icon: 'box-seam' },
        { path: '/admin/orders', label: 'Orders', icon: 'cart' },
        { path: '/admin/staff', label: 'Staff', icon: 'person-badge' },
        { path: '/admin/deliveries', label: 'Deliveries', icon: 'truck' }
      );
    } else if (isCustomer()) {
      links.push(
        { path: '/customer', label: 'Dashboard', icon: 'house' },
        { path: '/customer/orders', label: 'My Orders', icon: 'cart' },
      );
    } else if (isStaff()) {
      links.push(
        { path: '/staff', label: 'Dashboard', icon: 'house' },
      );
    } else if (isDeliveryPerson()) {
      links.push(
        { path: '/delivery', label: 'Dashboard', icon: 'house' },
        { path: '/delivery/tasks', label: 'Delivery Tasks', icon: 'truck' },
      );
    }

    return links;
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-box-seam me-2"></i>
          Order Management
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {getNavLinks().map(link => (
              <li key={link.path} className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                  to={link.path}
                >
                  <i className={`bi bi-${link.icon} me-1`}></i>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle text-white"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle me-1"></i>
                {user?.name || user?.email}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <span className="dropdown-item-text">
                    <small className="text-muted">
                      Role: {user?.role}
                    </small>
                  </span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

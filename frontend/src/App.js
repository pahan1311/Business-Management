import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from './hooks/useAuth';

// Components
import Navbar from './components/common/Navbar';
import NotificationContainer from './components/common/NotificationContainer';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import StaffDashboard from './pages/StaffDashboard_new';
import DeliveryDashboard from './pages/DeliveryDashboard';

// Admin Components
import CustomerList from './components/admin/CustomerManagement/CustomerList';
import OrderList from './components/admin/OrderManagement/OrderList';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (isAuthenticated && user) {
    const redirectPath = user.role === 'admin' ? '/admin' :
                        user.role === 'customer' ? '/customer' :
                        user.role === 'staff' ? '/staff' :
                        user.role === 'delivery' ? '/delivery' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Main App Component
const AppContent = () => {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/customers" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CustomerList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/orders" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <OrderList />
              </ProtectedRoute>
            } 
          />

          {/* Customer Routes */}
          <Route 
            path="/customer" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Staff Routes */}
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Delivery Routes */}
          <Route 
            path="/delivery" 
            element={
              <ProtectedRoute allowedRoles={['delivery']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Default Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <NotificationContainer />
    </div>
  );
};

// Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  const redirectPath = user?.role === 'admin' ? '/admin' :
                      user?.role === 'customer' ? '/customer' :
                      user?.role === 'staff' ? '/staff' :
                      user?.role === 'delivery' ? '/delivery' : '/';
  
  return <Navigate to={redirectPath} replace />;
};

// Unauthorized Page Component
const UnauthorizedPage = () => {
  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <i className="bi bi-shield-exclamation display-1 text-warning d-block mb-3"></i>
          <h2>Access Denied</h2>
          <p className="text-muted mb-4">
            You don't have permission to access this page.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App with Providers
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

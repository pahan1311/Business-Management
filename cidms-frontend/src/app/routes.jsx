import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from '../features/auth/pages/LoginPage';
import SignupPage from '../features/auth/pages/SignupPage';
import RequireAuth from '../features/auth/RequireAuth';
import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';
import DeliveryLayout from '../layouts/DeliveryLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import PublicLayout from '../layouts/PublicLayout';

// Admin Pages
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import CustomersList from '../features/customers/pages/CustomersList';
import CustomerDetail from '../features/customers/pages/CustomerDetail';
import InventoryList from '../features/inventory/pages/InventoryList';
import ProductDetail from '../features/inventory/pages/ProductDetail';
import OrdersList from '../features/orders/pages/OrdersList';
import OrderDetail from '../features/orders/pages/OrderDetail';
import OrderCreate from '../features/orders/pages/OrderCreate';
import DeliveriesList from '../features/deliveries/pages/DeliveriesList';
import DeliveryDetail from '../features/deliveries/pages/DeliveryDetail';
import TasksList from '../features/tasks/pages/TasksList';
import InquiriesList from '../features/inquiries/pages/InquiriesList';
import StaffList from '../features/staff/pages/StaffList';
import PartnersList from '../features/delivery-partners/pages/PartnersList';
import ReportsList from '../features/admin/pages/ReportsList';
import AdminSettings from '../features/admin/pages/AdminSettings';
import AuditLogs from '../features/admin/pages/AuditLogs';

// Staff Pages
import StaffDashboard from '../features/staff/pages/StaffDashboard';
import StaffOrders from '../features/staff/pages/StaffOrders';
import StaffInventory from '../features/staff/pages/StaffInventory';
import StaffTasks from '../features/staff/pages/StaffTasks';

// Delivery Pages
import DeliveryDashboard from '../features/delivery/pages/DeliveryDashboard';
import AssignedDeliveries from '../features/delivery/pages/AssignedDeliveries';
import DeliveryScan from '../features/delivery/pages/DeliveryScan';

// Customer Pages
import CustomerDashboard from '../features/customer/pages/CustomerDashboard';
import CustomerOrders from '../features/customer/pages/CustomerOrders';
import CustomerInquiries from '../features/customer/pages/CustomerInquiries';
import CustomerScan from '../features/customer/pages/CustomerScan';

// Public Pages
import TrackOrder from '../features/public/pages/TrackOrder';

const AppRoutes = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/track" element={<TrackOrder />} />
      
      {/* Protected Routes */}
      <Route path="/admin/*" element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout />
        </RequireAuth>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/new" element={<OrderCreate />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="deliveries" element={<DeliveriesList />} />
        <Route path="deliveries/:id" element={<DeliveryDetail />} />
        <Route path="tasks" element={<TasksList />} />
        <Route path="inquiries" element={<InquiriesList />} />
        <Route path="staff" element={<StaffList />} />
        <Route path="partners" element={<PartnersList />} />
        <Route path="reports" element={<ReportsList />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      <Route path="/staff/*" element={
        <RequireAuth roles={['STAFF']}>
          <StaffLayout />
        </RequireAuth>
      }>
        <Route index element={<StaffDashboard />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="orders" element={<StaffOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="inventory" element={<StaffInventory />} />
        <Route path="tasks" element={<StaffTasks />} />
      </Route>

      <Route path="/delivery/*" element={
        <RequireAuth roles={['DELIVERY']}>
          <DeliveryLayout />
        </RequireAuth>
      }>
        <Route index element={<DeliveryDashboard />} />
        <Route path="dashboard" element={<DeliveryDashboard />} />
        <Route path="assigned" element={<AssignedDeliveries />} />
        <Route path="deliveries/:id" element={<DeliveryDetail />} />
        <Route path="scan" element={<DeliveryScan />} />
      </Route>

      <Route path="/customer/*" element={
        <RequireAuth roles={['CUSTOMER']}>
          <CustomerLayout />
        </RequireAuth>
      }>
        <Route index element={<CustomerDashboard />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="inquiries" element={<CustomerInquiries />} />
        <Route path="scan" element={<CustomerScan />} />
      </Route>

      {/* Default redirect based on user role */}
      <Route path="/" element={
        user ? (
          user.role === 'ADMIN' ? <Navigate to="/admin" replace /> :
          user.role === 'STAFF' ? <Navigate to="/staff" replace /> :
          user.role === 'DELIVERY' ? <Navigate to="/delivery" replace /> :
          user.role === 'CUSTOMER' ? <Navigate to="/customer" replace /> :
          <Navigate to="/login" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
};

export default AppRoutes;

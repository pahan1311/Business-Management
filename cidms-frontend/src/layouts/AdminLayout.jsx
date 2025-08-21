import { Outlet } from 'react-router-dom';
import AppShell from '../components/common/AppShell';

const AdminLayout = () => {
  const sidebarItems = [
    { path: '/admin/dashboard', icon: 'speedometer2', label: 'Dashboard', active: false },
    { path: '/admin/customers', icon: 'people', label: 'Customers', active: false },
    { path: '/admin/inventory', icon: 'box', label: 'Inventory', active: false },
    { path: '/admin/orders', icon: 'bag', label: 'Orders', active: false },
    { path: '/admin/deliveries', icon: 'truck', label: 'Deliveries', active: false },
    { path: '/admin/tasks', icon: 'list-task', label: 'Tasks', active: false },
    { path: '/admin/inquiries', icon: 'chat', label: 'Inquiries', active: false },
    { path: '/admin/staff', icon: 'person-badge', label: 'Staff', active: false },
    { path: '/admin/partners', icon: 'truck', label: 'Partners', active: false },
    { path: '/admin/reports', icon: 'graph-up', label: 'Reports', active: false },
    { path: '/admin/settings', icon: 'gear', label: 'Settings', active: false },
    { path: '/admin/audit-logs', icon: 'shield-check', label: 'Audit Logs', active: false },
  ];

  return (
    <AppShell sidebarItems={sidebarItems} title="Admin Panel">
      <Outlet />
    </AppShell>
  );
};

export default AdminLayout;

import { Outlet } from 'react-router-dom';
import AppShell from '../components/common/AppShell';

const StaffLayout = () => {
  const sidebarItems = [
    { path: '/staff/dashboard', icon: 'speedometer2', label: 'Dashboard', active: false },
    { path: '/staff/orders', icon: 'bag', label: 'Orders', active: false },
    { path: '/staff/inventory', icon: 'box', label: 'Inventory', active: false },
    { path: '/staff/tasks', icon: 'list-task', label: 'Tasks', active: false },
  ];

  return (
    <AppShell sidebarItems={sidebarItems} title="Staff Portal">
      <Outlet />
    </AppShell>
  );
};

export default StaffLayout;

import { Outlet } from 'react-router-dom';
import AppShell from '../components/common/AppShell';

const CustomerLayout = () => {
  const sidebarItems = [
    { path: '/customer/dashboard', icon: 'speedometer2', label: 'Dashboard', active: false },
    { path: '/customer/orders', icon: 'bag', label: 'My Orders', active: false },
    { path: '/customer/inquiries', icon: 'chat', label: 'Inquiries', active: false },
    { path: '/customer/scan', icon: 'qr-code-scan', label: 'Scan QR', active: false },
  ];

  return (
    <AppShell sidebarItems={sidebarItems} title="Customer Portal">
      <Outlet />
    </AppShell>
  );
};

export default CustomerLayout;

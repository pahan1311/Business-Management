import { Outlet } from 'react-router-dom';
import AppShell from '../components/common/AppShell';

const DeliveryLayout = () => {
  const sidebarItems = [
    { path: '/delivery/dashboard', icon: 'speedometer2', label: 'Dashboard', active: false },
    { path: '/delivery/assigned', icon: 'truck', label: 'Assigned', active: false },
    { path: '/delivery/scan', icon: 'qr-code-scan', label: 'Scan QR', active: false },
  ];

  return (
    <AppShell sidebarItems={sidebarItems} title="Delivery Portal">
      <Outlet />
    </AppShell>
  );
};

export default DeliveryLayout;

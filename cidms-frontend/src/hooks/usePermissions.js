import { useSelector } from 'react-redux';
import { permissions } from '../app/permissions';

export const usePermissions = () => {
  const { user } = useSelector((state) => state.auth);

  const can = (permission) => {
    if (!user || !permissions[permission]) return false;
    return permissions[permission](user);
  };

  return {
    user,
    can,
    canManageCustomers: () => can('canManageCustomers'),
    canManageInventory: () => can('canManageInventory'),
    canManageOrders: () => can('canManageOrders'),
    canManageDeliveries: () => can('canManageDeliveries'),
    canManageStaff: () => can('canManageStaff'),
    canManageTasks: () => can('canManageTasks'),
    canManageInquiries: () => can('canManageInquiries'),
    canViewReports: () => can('canViewReports'),
    canViewAuditLogs: () => can('canViewAuditLogs'),
    canManageSettings: () => can('canManageSettings'),
  };
};

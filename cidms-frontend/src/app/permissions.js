export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  DELIVERY: 'DELIVERY',
  CUSTOMER: 'CUSTOMER'
};

export const permissions = {
  canManageCustomers: (user) => user?.role === ROLES.ADMIN,
  canManageInventory: (user) => [ROLES.ADMIN, ROLES.STAFF].includes(user?.role),
  canManageOrders: (user) => [ROLES.ADMIN, ROLES.STAFF].includes(user?.role),
  canManageDeliveries: (user) => [ROLES.ADMIN, ROLES.DELIVERY].includes(user?.role),
  canManageStaff: (user) => user?.role === ROLES.ADMIN,
  canManageTasks: (user) => [ROLES.ADMIN, ROLES.STAFF].includes(user?.role),
  canManageInquiries: (user) => [ROLES.ADMIN, ROLES.STAFF].includes(user?.role),
  canViewReports: (user) => user?.role === ROLES.ADMIN,
  canViewAuditLogs: (user) => user?.role === ROLES.ADMIN,
  canManageSettings: (user) => user?.role === ROLES.ADMIN,
};

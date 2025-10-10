//? Định nghĩa Roles của user trong hệ thống
export const roles = {
    CLIENT: 'client',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
};

//? Định nghĩa các quyền - Permissions trong hệ thống
export const permissions = {
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_SUPPORT: 'view_support',
    VIEW_MESSAGES: 'view_messages',
    VIEW_REVENUE: 'view_revenue',
    VIEW_ADMIN_TOOLS: 'view_admin_tools',
};

//? Kết hợp Roles và Permissions để xác định quyền hạn của user
export const rolePermissions = {
    [roles.CLIENT]: [permissions.VIEW_DASHBOARD, permissions.VIEW_SUPPORT],
    [roles.MODERATOR]: [permissions.VIEW_DASHBOARD, permissions.VIEW_SUPPORT, permissions.VIEW_MESSAGES],
    [roles.ADMIN]: Object.values(permissions),
};

import { rolePermissions } from '~/config/rbacConfig';

// Custom hook cho việc kiểm tra quyền hạn của user theo role và permission (RBAC)
export const usePermission = (userRole) => {
    const hasPermission = (permission) => {
        const allowedPermissions = rolePermissions[userRole] || [];
        return allowedPermissions.includes(permission);
    };
    return { hasPermission };
};

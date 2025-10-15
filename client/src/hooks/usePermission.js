import { ROLE_PERMISSIONS } from '~/config/rbacConfig';

// Custom hook cho việc kiểm tra quyền hạn của user theo role và permission (RBAC)
export const usePermission = (userRole) => {
    const hasPermission = (permission) => {
        if (!userRole) return false;
        const allowedPermissions = ROLE_PERMISSIONS[userRole] || [];
        return allowedPermissions.includes(permission);
    };

    return { hasPermission };
};

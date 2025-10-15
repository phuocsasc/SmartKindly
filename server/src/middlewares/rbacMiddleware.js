import { StatusCodes } from 'http-status-codes';
import { ROLE_PERMISSIONS } from '~/config/rbacConfig';

const isValidPermission = (requiredPermissions) => async (req, res, next) => {
    try {
        const userRole = req.jwtDecoded.role;

        if (!userRole) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden: có vấn đề với role của bạn!' });
            return;
        }

        // Lấy danh sách permissions của role
        const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

        if (!rolePermissions || rolePermissions.length === 0) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden: role không có quyền nào trong hệ thống' });
            return;
        }

        // Kiểm tra quyền truy cập
        const hasPermission = requiredPermissions?.every((permission) => rolePermissions.includes(permission));

        if (!hasPermission) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden: bạn không đủ quyền truy cập API này' });
            return;
        }

        next();
    } catch (error) {
        console.log('Error from rbacMiddleware: ', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Oops! Something went wrong.' });
    }
};

export const rbacMiddleware = { isValidPermission };

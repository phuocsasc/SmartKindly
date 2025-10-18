import { StatusCodes } from 'http-status-codes';
import { ROLE_PERMISSIONS } from '~/config/rbacConfig';
import ApiError from '~/utils/ApiError';

/**
 * Middleware kiểm tra xem user có quyền hạn (permission) hay không
 */
const isValidPermission = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            const userRole = req.jwtDecoded?.role;

            if (!userRole) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Không tìm thấy vai trò người dùng');
            }

            const allowedPermissions = ROLE_PERMISSIONS[userRole] || [];

            const hasPermission = requiredPermissions.some((permission) => allowedPermissions.includes(permission));

            if (!hasPermission) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền truy cập tài nguyên này');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware cho phép user có quyền HOẶC là chính chủ của resource
 */
const isValidPermissionOrOwner = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            const userRole = req.jwtDecoded?.role;
            const userId = req.jwtDecoded?.id;
            const resourceId = req.params.id; // ID của resource đang được truy cập

            if (!userRole || !userId) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Không tìm thấy thông tin người dùng');
            }

            // Kiểm tra nếu user đang truy cập resource của chính mình
            if (userId === resourceId) {
                // Cho phép user tự truy cập/cập nhật thông tin của mình
                return next();
            }

            // Nếu không phải owner, kiểm tra permission
            const allowedPermissions = ROLE_PERMISSIONS[userRole] || [];
            const hasPermission = requiredPermissions.some((permission) => allowedPermissions.includes(permission));

            if (!hasPermission) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Bạn không có quyền truy cập hoặc chỉnh sửa thông tin của người dùng khác',
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const rbacMiddleware = {
    isValidPermission,
    isValidPermissionOrOwner,
};

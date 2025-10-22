import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import { UserModel } from '~/models/userModel';

/**
 * Middleware kiểm tra user có cùng schoolId với target user không
 * Áp dụng cho các thao tác CRUD user trong trường
 */
const checkSameSchool = async (req, res, next) => {
    try {
        const requestUserId = req.jwtDecoded.id; // User đang thực hiện request
        const requestUserRole = req.jwtDecoded.role;
        const targetUserId = req.params.id; // User được thao tác (nếu có)

        // ✅ Admin hệ thống có thể thao tác mọi trường
        if (requestUserRole === 'admin') {
            return next();
        }

        // ✅ Lấy thông tin user đang request
        const requestUser = await UserModel.findById(requestUserId).select('schoolId');
        if (!requestUser) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin người dùng');
        }

        const requestSchoolId = requestUser.schoolId;

        // ✅ Nếu là thao tác trên target user (update, delete, view detail)
        if (targetUserId) {
            const targetUser = await UserModel.findById(targetUserId).select('schoolId role');

            if (!targetUser) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng cần thao tác');
            }

            // ✅ Không cho phép thao tác với admin hệ thống
            if (targetUser.role === 'admin') {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể thao tác với admin hệ thống');
            }

            // ✅ Kiểm tra cùng trường
            if (targetUser.schoolId !== requestSchoolId) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Bạn chỉ có thể thao tác với người dùng trong cùng trường của mình',
                );
            }
        }

        // ✅ Gắn schoolId vào request để dùng trong controller/service
        req.schoolScope = {
            schoolId: requestSchoolId,
            userId: requestUserId,
            role: requestUserRole,
        };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware kiểm tra user chỉ có thể xem/tạo user trong trường của mình
 * Áp dụng cho GET all và POST create
 */
const checkSchoolScopeForList = async (req, res, next) => {
    try {
        const requestUserId = req.jwtDecoded.id;
        const requestUserRole = req.jwtDecoded.role;

        // ✅ Admin hệ thống bỏ qua
        if (requestUserRole === 'admin') {
            return next();
        }

        // ✅ Lấy schoolId của user
        const requestUser = await UserModel.findById(requestUserId).select('schoolId');
        if (!requestUser) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin người dùng');
        }

        // ✅ Gắn schoolId vào request
        req.schoolScope = {
            schoolId: requestUser.schoolId,
            userId: requestUserId,
            role: requestUserRole,
        };

        next();
    } catch (error) {
        next(error);
    }
};

export const schoolScopeMiddleware = {
    checkSameSchool,
    checkSchoolScopeForList,
};

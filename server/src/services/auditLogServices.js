import { AuditLogModel } from '~/models/auditLogModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Tạo audit log
 */
const createLog = async (logData) => {
    try {
        const log = new AuditLogModel(logData);
        await log.save();
        console.log('✅ [AuditLog] Created:', logData.action, logData.resource);
        return log;
    } catch (error) {
        console.error('❌ [AuditLog createLog] Error:', error);
        // Không throw error để không ảnh hưởng đến flow chính
    }
};

/**
 * ✅ Lấy danh sách audit logs
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const {
            page = 1,
            limit = 20,
            action = '',
            resource = '',
            userName = '',
            userRole = '',
            startDate = '',
            endDate = '',
        } = query;

        const filter = {
            schoolId: user.schoolId,
            _destroy: false,
        };

        if (action) filter.action = action;
        if (resource) filter.resource = resource;
        if (userName) filter.userName = { $regex: userName, $options: 'i' };
        if (userRole) filter.userRole = userRole;

        // ✅ Filter by date range
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            AuditLogModel.find(filter)
                .populate('userId', 'fullName username email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            AuditLogModel.countDocuments(filter),
        ]);

        return {
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        console.error('❌ [AuditLog getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy lịch sử thao tác');
    }
};

/**
 * ✅ Lấy chi tiết audit log
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const log = await AuditLogModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('userId', 'fullName username email')
            .lean();

        if (!log) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lịch sử thao tác');
        }

        return log;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy chi tiết lịch sử thao tác');
    }
};

/**
 * ✅ Xóa audit log (chỉ BGH)
 */
const deleteLog = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền xóa lịch sử thao tác');
        }

        const log = await AuditLogModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!log) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lịch sử thao tác');
        }

        // ✅ Hard delete
        await AuditLogModel.findByIdAndDelete(id);

        return { message: 'Xóa lịch sử thao tác thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa lịch sử thao tác');
    }
};

/**
 * ✅ Xóa nhiều audit logs (chỉ BGH)
 */
const deleteManyLogs = async (ids, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền xóa lịch sử thao tác');
        }

        const result = await AuditLogModel.deleteMany({
            _id: { $in: ids },
            schoolId: user.schoolId,
            _destroy: false,
        });

        return {
            message: `Đã xóa ${result.deletedCount} lịch sử thao tác`,
            deletedCount: result.deletedCount,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa lịch sử thao tác');
    }
};

export const auditLogServices = {
    createLog,
    getAll,
    getDetails,
    deleteLog,
    deleteManyLogs,
};

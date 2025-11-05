// server/src/services/yearTargetServices.js

import { YearTargetModel } from '~/models/yearTargetModel';
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Tạo mới Year Target
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [YearTarget createNew] Starting with data:', data);

        // ✅ Kiểm tra user (chỉ admin mới được tạo)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền tạo mục tiêu năm học');
        }

        // ✅ Kiểm tra nhóm tuổi đã tồn tại chưa
        const existing = await YearTargetModel.findOne({
            ageGroup: data.ageGroup,
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, `Nhóm tuổi "${data.ageGroup}" đã có mục tiêu năm học`);
        }

        // ✅ Tạo mới
        const newYearTarget = new YearTargetModel({
            ...data,
            createdBy: userId,
        });

        await newYearTarget.save();

        const populated = await YearTargetModel.findById(newYearTarget._id)
            .populate('createdBy', 'fullName username')
            .lean();

        console.log('✅ [YearTarget createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [YearTarget createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo mục tiêu năm học: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách Year Targets
 */
const getAll = async (query) => {
    try {
        const { page = 1, limit = 10, ageGroup = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false };
        if (ageGroup) filter.ageGroup = ageGroup;

        const [yearTargets, total] = await Promise.all([
            YearTargetModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .sort({ ageGroup: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            YearTargetModel.countDocuments(filter),
        ]);

        return {
            yearTargets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách mục tiêu năm học');
    }
};

/**
 * ✅ Lấy chi tiết Year Target
 */
const getDetails = async (id) => {
    try {
        const yearTarget = await YearTargetModel.findOne({ _id: id, _destroy: false })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!yearTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        return yearTarget;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin mục tiêu năm học');
    }
};

/**
 * ✅ Cập nhật Year Target
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [YearTarget update] Starting with id:', id);

        // ✅ Kiểm tra user (chỉ admin mới được update)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền cập nhật mục tiêu năm học');
        }

        const yearTarget = await YearTargetModel.findOne({ _id: id, _destroy: false });
        if (!yearTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        // ✅ Nếu đổi ageGroup, kiểm tra trùng
        if (data.ageGroup && data.ageGroup !== yearTarget.ageGroup) {
            const existing = await YearTargetModel.findOne({
                ageGroup: data.ageGroup,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existing) {
                throw new ApiError(StatusCodes.CONFLICT, `Nhóm tuổi "${data.ageGroup}" đã có mục tiêu năm học`);
            }
        }

        // ✅ Update
        const updatedYearTarget = await YearTargetModel.findByIdAndUpdate(
            id,
            { ...data, lastUpdatedBy: userId },
            { new: true, runValidators: true },
        )
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [YearTarget update] Updated successfully');
        return updatedYearTarget;
    } catch (error) {
        console.error('❌ [YearTarget update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật mục tiêu năm học: ' + error.message);
    }
};

/**
 * ✅ Xóa Year Target (soft delete)
 */
const deleteYearTarget = async (id, userId) => {
    try {
        // ✅ Kiểm tra user (chỉ admin mới được xóa)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền xóa mục tiêu năm học');
        }

        const yearTarget = await YearTargetModel.findOne({ _id: id, _destroy: false });
        if (!yearTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        // Soft delete
        await YearTargetModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa mục tiêu năm học thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa mục tiêu năm học');
    }
};

export const yearTargetServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteYearTarget,
};

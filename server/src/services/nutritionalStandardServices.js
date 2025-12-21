// server/src/services/nutritionalStandardServices.js

import { NutritionalStandardModel } from '~/models/nutritionalStandardModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Tạo định mức dinh dưỡng mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [NutritionalStandard createNew] Starting');

        // ✅ Verify user is admin
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền tạo định mức dinh dưỡng');
        }

        // Kiểm tra nhóm trẻ đã tồn tại chưa
        const existing = await NutritionalStandardModel.findOne({
            ageGroup: data.ageGroup,
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, `Nhóm trẻ "${data.ageGroup}" đã có định mức dinh dưỡng`);
        }

        // Tạo mới
        const newStandard = new NutritionalStandardModel({
            ageGroup: data.ageGroup,
            plgStructure: data.plgStructure,
            protein: data.protein,
            lipid: data.lipid,
            glucid: data.glucid,
            recommendedCaloriesMin: data.recommendedCaloriesMin,
            recommendedCaloriesMax: data.recommendedCaloriesMax,
            createdBy: userId,
            lastUpdatedBy: userId,
        });

        await newStandard.save();

        const populated = await NutritionalStandardModel.findById(newStandard._id)
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [NutritionalStandard createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [NutritionalStandard createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo định mức dinh dưỡng: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách định mức dinh dưỡng
 */
const getAll = async (query) => {
    try {
        const { page = 1, limit = 20, ageGroup = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false };

        if (ageGroup) {
            filter.ageGroup = ageGroup;
        }

        const [standards, total] = await Promise.all([
            NutritionalStandardModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 })
                .lean(),
            NutritionalStandardModel.countDocuments(filter),
        ]);

        return {
            standards,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [NutritionalStandard getAll] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách định mức dinh dưỡng');
    }
};

/**
 * ✅ Lấy chi tiết định mức dinh dưỡng
 */
const getDetails = async (id) => {
    try {
        const standard = await NutritionalStandardModel.findOne({
            _id: id,
            _destroy: false,
        })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!standard) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy định mức dinh dưỡng');
        }

        return standard;
    } catch (error) {
        console.error('❌ [NutritionalStandard getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin định mức dinh dưỡng');
    }
};

/**
 * ✅ Cập nhật định mức dinh dưỡng
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [NutritionalStandard update] Starting with id:', id);

        // ✅ Verify user is admin
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền cập nhật định mức dinh dưỡng');
        }

        const standard = await NutritionalStandardModel.findOne({
            _id: id,
            _destroy: false,
        });

        if (!standard) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy định mức dinh dưỡng');
        }

        // Kiểm tra trùng nhóm trẻ (nếu đổi)
        if (data.ageGroup && data.ageGroup !== standard.ageGroup) {
            const existing = await NutritionalStandardModel.findOne({
                ageGroup: data.ageGroup,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existing) {
                throw new ApiError(StatusCodes.CONFLICT, `Nhóm trẻ "${data.ageGroup}" đã có định mức dinh dưỡng`);
            }
        }

        // Update fields
        if (data.ageGroup) standard.ageGroup = data.ageGroup;
        if (data.plgStructure) standard.plgStructure = data.plgStructure;
        if (data.protein !== undefined) standard.protein = data.protein;
        if (data.lipid !== undefined) standard.lipid = data.lipid;
        if (data.glucid !== undefined) standard.glucid = data.glucid;
        if (data.recommendedCaloriesMin !== undefined) standard.recommendedCaloriesMin = data.recommendedCaloriesMin;
        if (data.recommendedCaloriesMax !== undefined) standard.recommendedCaloriesMax = data.recommendedCaloriesMax;

        standard.lastUpdatedBy = userId;

        await standard.save();

        const populated = await NutritionalStandardModel.findById(standard._id)
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [NutritionalStandard update] Updated successfully');
        return populated;
    } catch (error) {
        console.error('❌ [NutritionalStandard update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật định mức dinh dưỡng: ' + error.message);
    }
};

/**
 * ✅ Xóa định mức dinh dưỡng
 */
const deleteStandard = async (id, userId) => {
    try {
        console.log('🗑️ [NutritionalStandard delete] Starting');

        // ✅ Verify user is admin
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền xóa định mức dinh dưỡng');
        }

        const deletedStandard = await NutritionalStandardModel.findByIdAndDelete(id);

        if (!deletedStandard) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy định mức dinh dưỡng');
        }

        console.log('✅ [NutritionalStandard delete] Deleted successfully');
        return { message: 'Xóa định mức dinh dưỡng thành công' };
    } catch (error) {
        console.error('❌ [NutritionalStandard delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa định mức dinh dưỡng');
    }
};

export const nutritionalStandardServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteStandard,
};

// server/src/services/schoolServiceChargeServices.js

import { SchoolServiceChargeModel } from '~/models/schoolServiceChargeModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Tạo tiền dịch vụ mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [SchoolServiceCharge createNew] Starting');

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được tạo
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền tạo tiền dịch vụ');
        }

        // ✅ Check duplicate service name
        const existing = await SchoolServiceChargeModel.findOne({
            schoolId: user.schoolId,
            serviceName: { $regex: new RegExp(`^${data.serviceName}$`, 'i') },
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, 'Tên dịch vụ đã tồn tại');
        }

        const newServiceCharge = new SchoolServiceChargeModel({
            ...data,
            schoolId: user.schoolId,
            createdBy: userId,
            lastUpdatedBy: userId,
        });

        await newServiceCharge.save();

        const populated = await SchoolServiceChargeModel.findById(newServiceCharge._id)
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [SchoolServiceCharge createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [SchoolServiceCharge createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo tiền dịch vụ: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách tiền dịch vụ
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 20, search = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { schoolId: user.schoolId, _destroy: false };

        // ✅ Search by service name
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [{ serviceName: searchRegex }, { serviceNameWithoutAccent: searchRegex }];
        }

        const [serviceCharges, total] = await Promise.all([
            SchoolServiceChargeModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 })
                .lean(),
            SchoolServiceChargeModel.countDocuments(filter),
        ]);

        return {
            serviceCharges,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [SchoolServiceCharge getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách tiền dịch vụ');
    }
};

/**
 * ✅ Lấy chi tiết tiền dịch vụ
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const serviceCharge = await SchoolServiceChargeModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!serviceCharge) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tiền dịch vụ');
        }

        return serviceCharge;
    } catch (error) {
        console.error('❌ [SchoolServiceCharge getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin tiền dịch vụ');
    }
};

/**
 * ✅ Cập nhật tiền dịch vụ
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [SchoolServiceCharge update] Starting');

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được update
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền cập nhật tiền dịch vụ');
        }

        const serviceCharge = await SchoolServiceChargeModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!serviceCharge) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tiền dịch vụ');
        }

        // ✅ Check duplicate service name (nếu thay đổi tên)
        if (data.serviceName && data.serviceName !== serviceCharge.serviceName) {
            const existing = await SchoolServiceChargeModel.findOne({
                schoolId: user.schoolId,
                serviceName: { $regex: new RegExp(`^${data.serviceName}$`, 'i') },
                _id: { $ne: id },
                _destroy: false,
            });

            if (existing) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên dịch vụ đã tồn tại');
            }
        }

        // ✅ Update
        Object.assign(serviceCharge, data, { lastUpdatedBy: userId });
        await serviceCharge.save();

        const updated = await SchoolServiceChargeModel.findById(serviceCharge._id)
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [SchoolServiceCharge update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [SchoolServiceCharge update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật tiền dịch vụ');
    }
};

/**
 * ✅ Xóa tiền dịch vụ
 */
const deleteServiceCharge = async (id, userId) => {
    try {
        console.log('🗑️ [SchoolServiceCharge delete] Starting');

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được xóa
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền xóa tiền dịch vụ');
        }

        // ✅ Xóa cứng luôn khỏi DB
        const deleted = await SchoolServiceChargeModel.findOneAndDelete({
            _id: id,
            schoolId: user.schoolId,
        });

        if (!deleted) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tiền dịch vụ');
        }

        console.log('✅ [SchoolServiceCharge delete] Deleted successfully');
        return { message: 'Xóa tiền dịch vụ thành công' };
    } catch (error) {
        console.error('❌ [SchoolServiceCharge delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa tiền dịch vụ');
    }
};

export const schoolServiceChargeServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteServiceCharge,
};

import { AcademicYearModel } from '~/models/academicYearModel';
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

const createNew = async (data, userId) => {
    try {
        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schoolId = user.schoolId;

        // ✅ Kiểm tra năm học đã tồn tại trong trường này chưa
        const existingYear = await AcademicYearModel.findOne({
            schoolId,
            fromYear: data.fromYear,
            toYear: data.toYear,
            _destroy: false,
        });

        if (existingYear) {
            throw new ApiError(StatusCodes.CONFLICT, 'Năm học này đã tồn tại trong trường của bạn');
        }

        // ✅ Nếu tạo năm học với status = "active", set các năm khác trong trường về "inactive"
        if (data.status === 'active') {
            await AcademicYearModel.updateMany({ schoolId, status: 'active' }, { status: 'inactive' });
        }

        const newAcademicYear = new AcademicYearModel({
            ...data,
            schoolId, // ✅ Gán schoolId
            createdBy: userId,
        });

        return await newAcademicYear.save();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo năm học mới');
    }
};

const getAll = async (query, userId) => {
    try {
        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, status = '' } = query;
        const skip = (page - 1) * limit;

        // ✅ Filter theo schoolId của user
        const filter = { _destroy: false, schoolId: user.schoolId };

        // Lọc theo status
        if (status) {
            filter.status = status;
        }

        const academicYears = await AcademicYearModel.find(filter)
            .populate('createdBy', 'username fullName')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ fromYear: -1 });

        const total = await AcademicYearModel.countDocuments(filter);

        return {
            academicYears,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách năm học');
    }
};

const getDetails = async (id, userId) => {
    try {
        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: id,
            schoolId: user.schoolId, // ✅ Chỉ lấy năm học của trường mình
            _destroy: false,
        }).populate('createdBy', 'username fullName');

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }
        return academicYear;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin năm học');
    }
};

const update = async (id, data, userId) => {
    try {
        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: id,
            schoolId: user.schoolId, // ✅ Chỉ update năm học của trường mình
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ Kiểm tra năm học đã tồn tại (nếu thay đổi năm)
        if (data.fromYear && data.toYear) {
            const existingYear = await AcademicYearModel.findOne({
                schoolId: user.schoolId,
                fromYear: data.fromYear,
                toYear: data.toYear,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingYear) {
                throw new ApiError(StatusCodes.CONFLICT, 'Năm học này đã tồn tại trong trường của bạn');
            }
        }

        // ✅ Nếu chuyển sang "active", set các năm khác trong trường về "inactive"
        if (data.status === 'active' && academicYear.status !== 'active') {
            await AcademicYearModel.updateMany(
                {
                    schoolId: user.schoolId,
                    _id: { $ne: id },
                    status: 'active',
                },
                { status: 'inactive' },
            );
        }

        const updatedAcademicYear = await AcademicYearModel.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).populate('createdBy', 'username fullName');

        return updatedAcademicYear;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật năm học');
    }
};

const deleteAcademicYear = async (id, userId) => {
    try {
        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: id,
            schoolId: user.schoolId, // ✅ Chỉ xóa năm học của trường mình
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ Không cho phép xóa năm học đang active
        if (academicYear.status === 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể xóa năm học đang hoạt động');
        }

        // Soft delete
        await AcademicYearModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa năm học thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa năm học');
    }
};

const setActive = async (id, userId) => {
    try {
        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ Đặt tất cả năm học khác trong trường về inactive
        await AcademicYearModel.updateMany(
            {
                schoolId: user.schoolId,
                _id: { $ne: id },
            },
            { status: 'inactive' },
        );

        // Đặt năm học hiện tại thành active
        academicYear.status = 'active';
        await academicYear.save();

        return { message: 'Đã kích hoạt năm học thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi kích hoạt năm học');
    }
};

export const academicYearServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteAcademicYear,
    setActive,
};

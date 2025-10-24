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

        // ✅ Kiểm tra đã có năm học "active" chưa
        const activeYear = await AcademicYearModel.findOne({
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (activeYear) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                `Đã có năm học "${activeYear.fromYear}-${activeYear.toYear}" đang hoạt động. Vui lòng chuyển sang trạng thái "Đã xong" trước khi tạo năm học mới.`,
            );
        }

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

        // ✅ Tạo năm học mới với status = "active" và isConfig = false
        const newAcademicYear = new AcademicYearModel({
            ...data,
            schoolId,
            status: 'active', // Mặc định "Đang hoạt động"
            isConfig: false, // Chưa cấu hình
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
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, status = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false, schoolId: user.schoolId };

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
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: id,
            schoolId: user.schoolId,
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

        // ✅ Nếu năm học đã cấu hình dữ liệu (isConfig = true), không cho phép chỉnh sửa
        if (academicYear.isConfig && data.fromYear !== undefined) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Năm học đã có dữ liệu cấu hình, không thể thay đổi năm học');
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

        // ✅ Nếu chuyển sang "inactive", kiểm tra có năm học "active" khác không
        if (data.status === 'inactive' && academicYear.status === 'active') {
            // Cho phép chuyển xuống inactive (kết thúc năm học)
            // Không cần kiểm tra gì thêm
        }

        // ✅ Nếu chuyển sang "active", kiểm tra đã có năm học active khác chưa
        if (data.status === 'active' && academicYear.status !== 'active') {
            const activeYear = await AcademicYearModel.findOne({
                schoolId: user.schoolId,
                status: 'active',
                _id: { $ne: id },
                _destroy: false,
            });

            if (activeYear) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    `Đã có năm học "${activeYear.fromYear}-${activeYear.toYear}" đang hoạt động. Vui lòng chuyển sang trạng thái "Đã xong" trước.`,
                );
            }
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

        // ✅ Không cho phép xóa năm học đang "active"
        if (academicYear.status === 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể xóa năm học đang hoạt động');
        }

        // ✅ Không cho phép xóa năm học đã cấu hình dữ liệu
        if (academicYear.isConfig) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Không thể xóa năm học đã có dữ liệu cấu hình. Dữ liệu này sẽ được lưu trữ để tham khảo.',
            );
        }

        // Soft delete
        await AcademicYearModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa năm học thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa năm học');
    }
};

// ✅ Hàm đánh dấu năm học đã cấu hình dữ liệu
const markAsConfigured = async (id, userId) => {
    try {
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

        // ✅ Chỉ cho phép đánh dấu năm học "active"
        if (academicYear.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cấu hình dữ liệu cho năm học đang hoạt động');
        }

        academicYear.isConfig = true;
        await academicYear.save();

        return { message: 'Đã đánh dấu năm học đã cấu hình dữ liệu' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đánh dấu cấu hình năm học');
    }
};

export const academicYearServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteAcademicYear,
    markAsConfigured,
};

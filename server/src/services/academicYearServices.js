import { AcademicYearModel } from '~/models/academicYearModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

const createNew = async (data, userId) => {
    try {
        // Kiểm tra năm học đã tồn tại chưa
        const existingYear = await AcademicYearModel.findOne({
            fromYear: data.fromYear,
            toYear: data.toYear,
            _destroy: false,
        });

        if (existingYear) {
            throw new ApiError(StatusCodes.CONFLICT, 'Năm học này đã tồn tại');
        }

        // Kiểm tra chỉ có 1 năm học active
        if (data.status === 'active') {
            await AcademicYearModel.updateMany({ status: 'active' }, { status: 'inactive' });
        }

        const newAcademicYear = new AcademicYearModel({
            ...data,
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

const getAll = async (query) => {
    try {
        const { page = 1, limit = 10, status = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false };

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
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách năm học');
    }
};

const getDetails = async (id) => {
    try {
        const academicYear = await AcademicYearModel.findOne({ _id: id, _destroy: false }).populate(
            'createdBy',
            'username fullName',
        );

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }
        return academicYear;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin năm học');
    }
};

const update = async (id, data) => {
    try {
        const academicYear = await AcademicYearModel.findOne({ _id: id, _destroy: false });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // Kiểm tra năm học đã tồn tại (nếu thay đổi năm)
        if (data.fromYear && data.toYear) {
            const existingYear = await AcademicYearModel.findOne({
                fromYear: data.fromYear,
                toYear: data.toYear,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingYear) {
                throw new ApiError(StatusCodes.CONFLICT, 'Năm học này đã tồn tại');
            }
        }

        // Kiểm tra chỉ có 1 năm học active
        if (data.status === 'active' && academicYear.status !== 'active') {
            await AcademicYearModel.updateMany({ _id: { $ne: id }, status: 'active' }, { status: 'inactive' });
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

const deleteAcademicYear = async (id) => {
    try {
        const academicYear = await AcademicYearModel.findOne({ _id: id, _destroy: false });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // Không cho phép xóa năm học đang active
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

const setActive = async (id) => {
    try {
        const academicYear = await AcademicYearModel.findOne({ _id: id, _destroy: false });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // Đặt tất cả năm học khác về inactive
        await AcademicYearModel.updateMany({ _id: { $ne: id } }, { status: 'inactive' });

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

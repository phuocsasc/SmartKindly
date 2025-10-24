import { AcademicYearModel } from '~/models/academicYearModel';
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

const createNew = async (data, userId) => {
    try {
        console.log('📥 [createNew] Starting with data:', data);
        console.log('📥 [createNew] User ID:', userId);

        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        console.log('👤 [createNew] User found:', user);

        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schoolId = user.schoolId;
        console.log('🏫 [createNew] School ID:', schoolId);

        // ✅ Kiểm tra đã có năm học "active" chưa
        const activeYear = await AcademicYearModel.findOne({
            schoolId,
            status: 'active',
            _destroy: false,
        });
        console.log('🔍 [createNew] Active year check:', activeYear);

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
        console.log('🔍 [createNew] Existing year check:', existingYear);

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

        console.log('💾 [createNew] Saving new academic year:', newAcademicYear);
        const savedYear = await newAcademicYear.save();
        console.log('✅ [createNew] Academic year saved successfully:', savedYear);

        return savedYear;
    } catch (error) {
        console.error('❌ [createNew] Error occurred:', error);
        console.error('❌ [createNew] Error stack:', error.stack);

        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo năm học mới: ' + error.message);
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
        console.log('📝 [update] Starting with id:', id);
        console.log('📝 [update] Data:', data);
        console.log('📝 [update] User ID:', userId);

        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        console.log('🔍 [update] Academic year found:', academicYear);

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ LOGIC MỚI: Không cho phép chỉnh sửa năm học "Đã xong"
        if (academicYear.status === 'inactive') {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Không thể chỉnh sửa năm học đã kết thúc. Dữ liệu này chỉ dùng để tham khảo.',
            );
        }

        // ✅ LOGIC MỚI: Nếu năm học đang active VÀ đã cấu hình (isConfig = true)
        // Chỉ cho phép thay đổi status sang "inactive"
        if (academicYear.status === 'active' && academicYear.isConfig === true) {
            console.log('⚠️ [update] Năm học đang hoạt động và đã cấu hình');

            // Kiểm tra xem có field nào khác ngoài status không
            const allowedFields = ['status'];
            const updateFields = Object.keys(data);
            const hasOtherFields = updateFields.some((field) => !allowedFields.includes(field));

            if (hasOtherFields) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Năm học đã cấu hình dữ liệu, chỉ có thể chuyển sang trạng thái "Đã xong"',
                );
            }

            // Kiểm tra xem có đang chuyển sang inactive không
            if (!data.status || data.status !== 'inactive') {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Năm học đã cấu hình dữ liệu, chỉ có thể chuyển sang trạng thái "Đã xong"',
                );
            }

            console.log('✅ [update] Cho phép chuyển năm học đã cấu hình sang inactive');
        }

        // ✅ LOGIC CŨ: Nếu năm học chưa cấu hình (isConfig = false) và đang active
        // Cho phép chỉnh sửa tất cả ngoại trừ thay đổi năm học
        if (academicYear.status === 'active' && academicYear.isConfig === false) {
            console.log('📝 [update] Năm học đang hoạt động nhưng chưa cấu hình');

            // Không cho phép thay đổi fromYear, toYear
            if (data.fromYear !== undefined || data.toYear !== undefined) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể thay đổi năm học sau khi đã tạo');
            }

            // Nếu chuyển sang "inactive", cho phép
            if (data.status === 'inactive') {
                console.log('✅ [update] Chuyển năm học chưa cấu hình sang inactive');
            }

            // Nếu cập nhật học kỳ, cho phép
            if (data.semesters) {
                console.log('✅ [update] Cập nhật thông tin học kỳ');
            }
        }

        // ✅ Kiểm tra năm học đã tồn tại (nếu thay đổi năm - nhưng ở trên đã chặn)
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

        // ✅ Nếu chuyển sang "active" (từ inactive), kiểm tra đã có năm học active khác chưa
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

        console.log('✅ [update] Academic year updated successfully:', updatedAcademicYear);

        return updatedAcademicYear;
    } catch (error) {
        console.error('❌ [update] Error occurred:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật năm học: ' + error.message);
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

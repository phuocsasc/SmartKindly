import { DepartmentModel } from '~/models/departmentModel';
import { AcademicYearModel } from '~/models/academicYearModel';
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

const createNew = async (data, userId) => {
    try {
        console.log('📥 [Department createNew] Starting with data:', data);
        console.log('📥 [Department createNew] User ID:', userId);

        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schoolId = user.schoolId;
        console.log('🏫 [Department createNew] School ID:', schoolId);

        // ✅ Kiểm tra năm học có tồn tại và thuộc trường này không
        const academicYear = await AcademicYearModel.findOne({
            _id: data.academicYearId,
            schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        console.log('📅 [Department createNew] Academic year:', {
            id: academicYear._id,
            name: `${academicYear.fromYear}-${academicYear.toYear}`,
            status: academicYear.status,
        });

        // ✅ Chỉ cho phép tạo tổ bộ môn trong năm học đang "active"
        if (academicYear.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể tạo tổ bộ môn cho năm học đang hoạt động');
        }

        // ✅ Kiểm tra tổ bộ môn đã tồn tại trong năm học này chưa
        const existingDepartment = await DepartmentModel.findOne({
            schoolId,
            academicYearId: data.academicYearId,
            name: data.name,
            _destroy: false,
        });

        if (existingDepartment) {
            throw new ApiError(StatusCodes.CONFLICT, `Tổ bộ môn "${data.name}" đã tồn tại trong năm học này`);
        }

        // ✅ Lấy danh sách role được phép cho tổ bộ môn này
        const allowedRoles = DepartmentModel.getAllowedRolesByDepartmentName(data.name);
        console.log('👥 [Department createNew] Allowed roles:', allowedRoles);

        // ✅ Kiểm tra tất cả managers có hợp lệ không
        const managers = await UserModel.find({
            _id: { $in: data.managers },
            schoolId,
            _destroy: false,
            status: true, // Chỉ chọn user đang kích hoạt
        });

        console.log('👥 [Department createNew] Found managers:', managers.length);

        if (managers.length !== data.managers.length) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Một số cán bộ quản lý không tồn tại hoặc không thuộc trường này',
            );
        }

        // ✅ Kiểm tra role của từng manager
        const invalidManagers = managers.filter((manager) => !allowedRoles.includes(manager.role));

        if (invalidManagers.length > 0) {
            const invalidNames = invalidManagers.map((m) => m.fullName).join(', ');
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Cán bộ "${invalidNames}" không phù hợp với vai trò của tổ bộ môn "${data.name}". Chỉ chấp nhận vai trò: ${allowedRoles.join(', ')}`,
            );
        }

        // ✅ Tạo departmentId tự động
        const departmentId = await DepartmentModel.generateDepartmentId();

        // ✅ Tạo tổ bộ môn mới
        const newDepartment = new DepartmentModel({
            departmentId,
            schoolId,
            academicYearId: data.academicYearId,
            name: data.name,
            managers: data.managers,
            note: data.note || '',
            createdBy: userId,
        });

        const savedDepartment = await newDepartment.save();
        console.log('✅ [Department createNew] Department created successfully');

        // ✅ Đánh dấu năm học đã cấu hình
        if (!academicYear.isConfig) {
            academicYear.isConfig = true;
            await academicYear.save();
            console.log('✅ [Department createNew] Academic year marked as configured');
        }

        // ✅ Populate data để trả về
        const populatedDepartment = await DepartmentModel.findById(savedDepartment._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('managers', 'fullName username role email phone')
            .populate('createdBy', 'fullName username');

        return populatedDepartment;
    } catch (error) {
        console.error('❌ [Department createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo tổ bộ môn: ' + error.message);
    }
};

const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId = '', name = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false, schoolId: user.schoolId };

        if (academicYearId) {
            filter.academicYearId = academicYearId;
        }

        if (name) {
            filter.name = name;
        }

        const departments = await DepartmentModel.find(filter)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('managers', 'fullName username role email phone')
            .populate('createdBy', 'fullName username')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await DepartmentModel.countDocuments(filter);

        return {
            departments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách tổ bộ môn');
    }
};

const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const department = await DepartmentModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('managers', 'fullName username role email phone')
            .populate('createdBy', 'fullName username');

        if (!department) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tổ bộ môn');
        }

        return department;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin tổ bộ môn');
    }
};

const update = async (id, data, userId) => {
    try {
        console.log('📝 [Department update] Starting with id:', id);
        console.log('📝 [Department update] Data:', data);

        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const department = await DepartmentModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId');

        if (!department) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tổ bộ môn');
        }

        console.log('🔍 [Department update] Found department:', {
            name: department.name,
            academicYear: `${department.academicYearId.fromYear}-${department.academicYearId.toYear}`,
            status: department.academicYearId.status,
        });

        // ✅ Chỉ cho phép cập nhật tổ bộ môn trong năm học đang "active"
        if (department.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật tổ bộ môn trong năm học đang hoạt động');
        }

        // ✅ Nếu thay đổi tên tổ bộ môn, kiểm tra trùng lặp
        if (data.name && data.name !== department.name) {
            const existingDepartment = await DepartmentModel.findOne({
                schoolId: user.schoolId,
                academicYearId: department.academicYearId._id,
                name: data.name,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingDepartment) {
                throw new ApiError(StatusCodes.CONFLICT, `Tổ bộ môn "${data.name}" đã tồn tại trong năm học này`);
            }
        }

        // ✅ Nếu cập nhật managers, kiểm tra role phù hợp
        if (data.managers) {
            const departmentName = data.name || department.name;
            const allowedRoles = DepartmentModel.getAllowedRolesByDepartmentName(departmentName);

            const managers = await UserModel.find({
                _id: { $in: data.managers },
                schoolId: user.schoolId,
                _destroy: false,
                status: true,
            });

            if (managers.length !== data.managers.length) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    'Một số cán bộ quản lý không tồn tại hoặc không thuộc trường này',
                );
            }

            const invalidManagers = managers.filter((manager) => !allowedRoles.includes(manager.role));

            if (invalidManagers.length > 0) {
                const invalidNames = invalidManagers.map((m) => m.fullName).join(', ');
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Cán bộ "${invalidNames}" không phù hợp với vai trò của tổ bộ môn "${departmentName}". Chỉ chấp nhận vai trò: ${allowedRoles.join(', ')}`,
                );
            }
        }

        // ✅ Cập nhật
        const updatedDepartment = await DepartmentModel.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('managers', 'fullName username role email phone')
            .populate('createdBy', 'fullName username');

        console.log('✅ [Department update] Updated successfully');

        return updatedDepartment;
    } catch (error) {
        console.error('❌ [Department update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật tổ bộ môn: ' + error.message);
    }
};

const deleteDepartment = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const department = await DepartmentModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId');

        if (!department) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tổ bộ môn');
        }

        // ✅ Chỉ cho phép xóa tổ bộ môn trong năm học đang "active"
        if (department.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa tổ bộ môn trong năm học đang hoạt động');
        }

        // Soft delete
        await DepartmentModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa tổ bộ môn thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa tổ bộ môn');
    }
};

// ✅ API lấy danh sách cán bộ theo tên tổ bộ môn
const getAvailableManagers = async (departmentName, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Lấy danh sách role được phép
        const allowedRoles = DepartmentModel.getAllowedRolesByDepartmentName(departmentName);

        if (allowedRoles.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Tên tổ bộ môn không hợp lệ');
        }

        // ✅ Lấy danh sách user phù hợp
        const managers = await UserModel.find({
            schoolId: user.schoolId,
            role: { $in: allowedRoles },
            status: true, // Chỉ lấy user đang kích hoạt
            _destroy: false,
        }).select('fullName username role email phone');

        return managers;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách cán bộ');
    }
};

export const departmentServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteDepartment,
    getAvailableManagers,
};

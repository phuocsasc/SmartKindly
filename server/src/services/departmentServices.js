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

        // ✅ LOGIC MỚI: Kiểm tra cán bộ đã thuộc tổ bộ môn khác trong năm học này chưa
        const existingDepartments = await DepartmentModel.find({
            schoolId,
            academicYearId: data.academicYearId,
            _destroy: false,
            managers: { $in: data.managers }, // Tìm các department có chứa bất kỳ manager nào trong danh sách
        }).populate('managers', 'fullName');

        if (existingDepartments.length > 0) {
            // Lấy danh sách cán bộ bị trùng
            const duplicateManagers = [];

            existingDepartments.forEach((dept) => {
                dept.managers.forEach((manager) => {
                    if (data.managers.includes(manager._id.toString())) {
                        duplicateManagers.push({
                            name: manager.fullName,
                            departmentName: dept.name,
                        });
                    }
                });
            });

            // Tạo thông báo lỗi chi tiết
            const errorMessages = duplicateManagers.map(
                (dm) => `"${dm.name}" đã thuộc tổ bộ môn "${dm.departmentName}"`,
            );

            throw new ApiError(
                StatusCodes.CONFLICT,
                `Không thể thêm cán bộ vì: ${errorMessages.join(', ')}. Mỗi cán bộ chỉ được thuộc 1 tổ bộ môn trong năm học.`,
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
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId = '', name = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false, schoolId: user.schoolId };
        if (academicYearId) filter.academicYearId = academicYearId;
        if (name) filter.name = name;

        // ✅ Parallel query
        const [departments, total] = await Promise.all([
            DepartmentModel.find(filter)
                .select('departmentId name note managers academicYearId createdBy createdAt') // ✅ Select only needed
                .populate('academicYearId', 'fromYear toYear status')
                .populate('managers', 'fullName username role email phone')
                .populate('createdBy', 'fullName username')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),

            DepartmentModel.countDocuments(filter),
        ]);

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

            // ✅ LOGIC MỚI: Chỉ kiểm tra cán bộ MỚI THÊM VÀO (không nằm trong danh sách cũ)
            const oldManagerIds = department.managers.map((m) => m.toString());
            const newManagerIds = data.managers.filter((managerId) => !oldManagerIds.includes(managerId));

            console.log('🔍 [Department update] Manager comparison:', {
                oldManagers: oldManagerIds,
                newManagers: data.managers,
                addedManagers: newManagerIds,
            });

            // ✅ Chỉ kiểm tra duplicate cho các cán bộ MỚI thêm vào
            if (newManagerIds.length > 0) {
                const existingDepartments = await DepartmentModel.find({
                    schoolId: user.schoolId,
                    academicYearId: department.academicYearId._id,
                    _id: { $ne: id }, // ✅ Loại trừ tổ bộ môn đang update
                    _destroy: false,
                    managers: { $in: newManagerIds }, // ✅ Chỉ kiểm tra các cán bộ MỚI
                }).populate('managers', 'fullName');

                if (existingDepartments.length > 0) {
                    const duplicateManagers = [];

                    existingDepartments.forEach((dept) => {
                        dept.managers.forEach((manager) => {
                            if (newManagerIds.includes(manager._id.toString())) {
                                duplicateManagers.push({
                                    name: manager.fullName,
                                    departmentName: dept.name,
                                });
                            }
                        });
                    });

                    if (duplicateManagers.length > 0) {
                        const errorMessages = duplicateManagers.map(
                            (dm) => `"${dm.name}" đã thuộc tổ bộ môn "${dm.departmentName}"`,
                        );

                        throw new ApiError(
                            StatusCodes.CONFLICT,
                            `Không thể cập nhật vì: ${errorMessages.join(', ')}. Mỗi cán bộ chỉ được thuộc 1 tổ bộ môn trong năm học.`,
                        );
                    }
                }
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
const getAvailableManagers = async (departmentName, academicYearId, userId, currentDepartmentId = null) => {
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
        const allManagers = await UserModel.find({
            schoolId: user.schoolId,
            role: { $in: allowedRoles },
            status: true, // Chỉ lấy user đang kích hoạt
            _destroy: false,
        }).select('fullName username role email phone');

        // ✅ LOGIC MỚI: Lấy danh sách cán bộ đã được chọn trong các tổ bộ môn KHÁC (không bao gồm tổ bộ môn hiện tại)
        const filter = {
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        };

        // ✅ Nếu đang update (có currentDepartmentId), loại trừ tổ bộ môn hiện tại
        if (currentDepartmentId) {
            filter._id = { $ne: currentDepartmentId };
        }

        const assignedDepartments = await DepartmentModel.find(filter).select('managers');

        // Tạo Set các manager ID đã được assign cho tổ bộ môn KHÁC
        const assignedManagerIds = new Set();
        assignedDepartments.forEach((dept) => {
            dept.managers.forEach((managerId) => {
                assignedManagerIds.add(managerId.toString());
            });
        });

        // ✅ Lọc ra các manager chưa được assign HOẶC đang thuộc tổ bộ môn hiện tại
        const availableManagers = allManagers.filter((manager) => !assignedManagerIds.has(manager._id.toString()));

        console.log(
            `📊 [getAvailableManagers] Total: ${allManagers.length}, Assigned to others: ${assignedManagerIds.size}, Available: ${availableManagers.length}`,
        );

        return availableManagers;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách cán bộ');
    }
};
const copyFromYear = async (data, userId) => {
    try {
        console.log('📋 [Department copyFromYear] Starting with data:', data);
        const { fromAcademicYearId, toAcademicYearId } = data;

        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schoolId = user.schoolId;

        // ✅ Kiểm tra năm học nguồn (từ năm cũ)
        const fromAcademicYear = await AcademicYearModel.findOne({
            _id: fromAcademicYearId,
            schoolId,
            _destroy: false,
        });

        if (!fromAcademicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học nguồn');
        }

        // ✅ Kiểm tra năm học đích (năm hiện tại)
        const toAcademicYear = await AcademicYearModel.findOne({
            _id: toAcademicYearId,
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!toAcademicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học đích hoặc năm học không đang hoạt động');
        }

        // ✅ Kiểm tra năm học đích đã có dữ liệu chưa
        const existingDepartments = await DepartmentModel.find({
            schoolId,
            academicYearId: toAcademicYearId,
            _destroy: false,
        });

        if (existingDepartments.length > 0) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                `Năm học ${toAcademicYear.fromYear}-${toAcademicYear.toYear} đã có ${existingDepartments.length} tổ bộ môn. Vui lòng xóa hết trước khi copy.`,
            );
        }

        // ✅ Lấy danh sách tổ bộ môn từ năm cũ
        const sourceDepartments = await DepartmentModel.find({
            schoolId,
            academicYearId: fromAcademicYearId,
            _destroy: false,
        }).populate('managers', '_id');

        if (sourceDepartments.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Năm học nguồn không có tổ bộ môn nào');
        }

        console.log(`📋 [Department copyFromYear] Found ${sourceDepartments.length} departments to copy`);

        // ✅ Copy từng tổ bộ môn
        const copiedDepartments = [];
        for (const sourceDept of sourceDepartments) {
            const departmentId = await DepartmentModel.generateDepartmentId();

            const newDepartment = new DepartmentModel({
                departmentId,
                schoolId,
                academicYearId: toAcademicYearId,
                name: sourceDept.name,
                managers: sourceDept.managers.map((m) => m._id), // Copy manager IDs
                note: sourceDept.note || '',
                createdBy: userId,
            });

            const savedDept = await newDepartment.save();
            copiedDepartments.push(savedDept);
        }

        // ✅ Đánh dấu năm học đích đã cấu hình
        if (!toAcademicYear.isConfig) {
            toAcademicYear.isConfig = true;
            await toAcademicYear.save();
            console.log('✅ [Department copyFromYear] Academic year marked as configured');
        }

        console.log(`✅ [Department copyFromYear] Copied ${copiedDepartments.length} departments successfully`);

        // ✅ Populate data để trả về
        const populatedDepartments = await DepartmentModel.find({
            _id: { $in: copiedDepartments.map((d) => d._id) },
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('managers', 'fullName username role email phone')
            .populate('createdBy', 'fullName username');

        return {
            count: populatedDepartments.length,
            departments: populatedDepartments,
        };
    } catch (error) {
        console.error('❌ [Department copyFromYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi copy tổ bộ môn: ' + error.message);
    }
};

export const departmentServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteDepartment,
    getAvailableManagers,
    copyFromYear,
};

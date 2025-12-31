import { ClassModel } from '~/models/classModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { UserModel } from '~/models/userModel.js';
import { ChildrenProfileModel } from '~/models/childrenProfileModel.js'; // ✅ Import model
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { notificationServices } from '~/services/notificationServices.js';
import { logAction } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

/**
 * ✅ Helper: Kiểm tra lớp có hồ sơ trẻ không
 */
const hasChildrenProfiles = async (classId) => {
    const count = await ChildrenProfileModel.countDocuments({
        classId,
        _destroy: false,
    });
    return count > 0;
};

const createNew = async (data, userId) => {
    try {
        console.log('📥 [Class createNew] Starting with data:', data);

        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schoolId = user.schoolId;

        // ✅ Lấy năm học đang active
        const activeYear = await AcademicYearModel.findOne({
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không có năm học đang hoạt động. Vui lòng tạo năm học trước.');
        }

        console.log('📅 [Class createNew] Active year:', {
            id: activeYear._id,
            name: `${activeYear.fromYear}-${activeYear.toYear}`,
        });

        // ✅ Kiểm tra tên lớp đã tồn tại trong năm học này chưa
        const existingClass = await ClassModel.findOne({
            schoolId,
            academicYearId: activeYear._id,
            name: data.name,
            _destroy: false,
        });

        if (existingClass) {
            throw new ApiError(StatusCodes.CONFLICT, `Lớp "${data.name}" đã tồn tại trong năm học này`);
        }

        // ✅ Validate ageGroup phù hợp với grade
        const validAgeGroups = ClassModel.getAgeGroupsByGrade(data.grade);
        if (!validAgeGroups.includes(data.ageGroup)) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Nhóm tuổi "${data.ageGroup}" không phù hợp với khối "${data.grade}"`,
            );
        }

        // ✅ Validate sessions - phải chọn ít nhất 1 buổi
        if (!data.sessions || (!data.sessions.morning && !data.sessions.afternoon && !data.sessions.evening)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Phải chọn ít nhất một buổi học');
        }

        // ✅ Kiểm tra giáo viên chủ nhiệm
        const teacher = await UserModel.findOne({
            _id: data.homeRoomTeacher,
            schoolId,
            role: 'giao_vien',
            status: true,
            _destroy: false,
        });

        if (!teacher) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy giáo viên hoặc giáo viên không hợp lệ');
        }

        // ✅ FIX: Kiểm tra giáo viên đã được gán lớp TRONG NĂM HỌC HIỆN TẠI chưa
        const existingClassInCurrentYear = await ClassModel.findOne({
            schoolId,
            academicYearId: activeYear._id, // ✅ Chỉ kiểm tra trong năm học hiện tại
            homeRoomTeacher: teacher._id,
            _destroy: false,
        });

        if (existingClassInCurrentYear) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                `Giáo viên "${teacher.fullName}" đã là chủ nhiệm lớp "${existingClassInCurrentYear.name}" trong năm học này`,
            );
        }

        console.log('✅ [Class createNew] Teacher is available for current year');

        // ✅ Kiểm tra giáo viên có trong Tổ cấp dưỡng không (trong năm học hiện tại)
        const careTeamDept = await DepartmentModel.findOne({
            schoolId,
            academicYearId: activeYear._id,
            name: 'Tổ cấp dưỡng',
            managers: teacher._id,
            _destroy: false,
        });

        if (careTeamDept) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                `Giáo viên "${teacher.fullName}" đã thuộc Tổ cấp dưỡng trong năm học này, không thể làm chủ nhiệm lớp`,
            );
        }

        // ✅ Tạo classId tự động
        const classId = await ClassModel.generateClassId();

        // ✅ Tạo lớp mới
        const newClass = new ClassModel({
            classId,
            schoolId,
            academicYearId: activeYear._id,
            grade: data.grade,
            ageGroup: data.ageGroup,
            name: data.name,
            homeRoomTeacher: data.homeRoomTeacher,
            description: data.description || '',
            sessions: data.sessions,
            createdBy: userId,
        });

        const savedClass = await newClass.save();
        console.log('✅ [Class createNew] Class created successfully');

        // ✅ Cập nhật classId cho giáo viên chủ nhiệm
        await UserModel.findByIdAndUpdate(data.homeRoomTeacher, {
            classId: savedClass._id,
        });
        console.log('✅ [Class createNew] Teacher assigned to class');

        // ✅ Tạo thông báo cho giáo viên
        // const teachers = await UserModel.findById(data.homeRoomTeacher).select('fullName');
        const creatorUser = await UserModel.findById(userId).select('fullName');
        const creatorName = creatorUser?.fullName || 'Ban giám hiệu';

        await notificationServices.createNotification({
            recipientUserId: data.homeRoomTeacher,
            schoolId,
            title: 'Phân công giáo viên chủ nhiệm',
            message: `Bạn được phân công làm giáo viên chủ nhiệm <strong>lớp ${data.name}</strong> trong năm học ${activeYear.fromYear}-${activeYear.toYear} bởi <strong>${creatorName}</strong>`,
            meta: {
                classId: savedClass._id,
                className: data.name,
                academicYearId: activeYear._id,
                academicYearName: `${activeYear.fromYear}-${activeYear.toYear}`,
                actionBy: userId,
                actionByName: creatorName,
            },
        });

        // ✅ Đánh dấu năm học đã cấu hình
        if (!activeYear.isConfig) {
            activeYear.isConfig = true;
            await activeYear.save();
            console.log('✅ [Class createNew] Academic year marked as configured');
        }

        // ✅ Populate data để trả về
        const populatedClass = await ClassModel.findById(savedClass._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('homeRoomTeacher', 'fullName username email phone')
            .populate('createdBy', 'fullName username');

        return populatedClass;
    } catch (error) {
        console.error('❌ [Class createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo lớp học: ' + error.message);
    }
};

const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId = '', grade = '', search = '' } = query;
        const skip = (page - 1) * limit;

        let filter = {
            schoolId: user.schoolId,
            _destroy: false,
        };

        if (academicYearId) filter.academicYearId = academicYearId;
        if (grade) filter.grade = grade;
        if (search) filter.name = { $regex: search, $options: 'i' };

        // const skip = (parseInt(page) - 1) * parseInt(limit);

        const [classes, totalItems] = await Promise.all([
            ClassModel.find(filter)
                .select(
                    'classId name grade ageGroup description sessions homeRoomTeacher academicYearId createdBy createdAt',
                ) // ✅ Select only needed fields
                .populate('academicYearId', 'fromYear toYear status')
                .populate('homeRoomTeacher', 'fullName username email phone')
                .populate('createdBy', 'fullName username')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(), // ✅ lean() để tăng tốc
            ClassModel.countDocuments(filter),
        ]);

        // ✅ Thêm thông tin số lượng hồ sơ trẻ cho mỗi lớp
        const classesWithChildrenCount = await Promise.all(
            classes.map(async (cls) => {
                const childrenCount = await ChildrenProfileModel.countDocuments({
                    classId: cls._id,
                    _destroy: false,
                });
                return {
                    ...cls,
                    childrenCount,
                    hasChildren: childrenCount > 0,
                };
            }),
        );

        return {
            classes: classesWithChildrenCount,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                totalItems,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp học');
    }
};

const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const classData = await ClassModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('homeRoomTeacher', 'fullName username email phone role')
            .populate('createdBy', 'fullName username');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        return classData;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin lớp học');
    }
};

const update = async (id, data, userId) => {
    try {
        console.log('📝 [Class update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const classData = await ClassModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'status fromYear toYear')
            .populate('homeRoomTeacher', 'fullName email');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        console.log('🔍 [Class update] Found class:', {
            name: classData.name,
            academicYear: `${classData.academicYearId.fromYear}-${classData.academicYearId.toYear}`,
            status: classData.academicYearId.status,
        });

        // ✅ Chỉ cho phép cập nhật lớp trong năm học đang "active"
        if (classData.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật lớp trong năm học đang hoạt động');
        }

        // ✅ KIỂM TRA: Lớp có hồ sơ trẻ không
        const hasChildren = await hasChildrenProfiles(id);
        if (hasChildren) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Không thể chỉnh sửa lớp đã có hồ sơ trẻ em. Vui lòng xóa tất cả hồ sơ trước.',
            );
        }

        // ✅ Nếu thay đổi tên lớp, kiểm tra trùng lặp
        if (data.name && data.name !== classData.name) {
            const existingClass = await ClassModel.findOne({
                schoolId: user.schoolId,
                academicYearId: classData.academicYearId._id,
                name: data.name,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingClass) {
                throw new ApiError(StatusCodes.CONFLICT, `Lớp "${data.name}" đã tồn tại trong năm học này`);
            }
        }

        // ✅ Lưu thông tin giáo viên CŨ TRƯỚC KHI cập nhật
        const oldTeacherId = classData.homeRoomTeacher?._id?.toString();
        const oldClassName = classData.name;

        // ✅ Validate ageGroup phù hợp với grade (nếu có thay đổi)
        if (data.grade || data.ageGroup) {
            const grade = data.grade || classData.grade;
            const ageGroup = data.ageGroup || classData.ageGroup;

            const validAgeGroups = ClassModel.getAgeGroupsByGrade(grade);
            if (!validAgeGroups.includes(ageGroup)) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Nhóm tuổi "${ageGroup}" không phù hợp với khối "${grade}"`,
                );
            }
        }

        // ✅ Validate sessions
        if (data.sessions) {
            if (!data.sessions.morning && !data.sessions.afternoon && !data.sessions.evening) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Phải chọn ít nhất một buổi học');
            }
        }

        // ✅ Nếu thay đổi giáo viên chủ nhiệm
        if (data.homeRoomTeacher && data.homeRoomTeacher !== oldTeacherId) {
            const newTeacher = await UserModel.findOne({
                _id: data.homeRoomTeacher,
                schoolId: user.schoolId,
                role: 'giao_vien',
                _destroy: false,
            });

            if (!newTeacher) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy giáo viên');
            }

            // Kiểm tra giáo viên có trong Tổ cấp dưỡng không
            const careTeamDept = await DepartmentModel.findOne({
                schoolId: user.schoolId,
                academicYearId: classData.academicYearId._id,
                name: 'Tổ cấp dưỡng',
                managers: newTeacher._id,
                _destroy: false,
            });

            if (careTeamDept) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    `Giáo viên "${newTeacher.fullName}" đã thuộc Tổ cấp dưỡng, không thể làm chủ nhiệm lớp`,
                );
            }

            // Kiểm tra giáo viên mới đã được gán lớp khác TRONG NĂM HỌC HIỆN TẠI chưa
            const existingClassInCurrentYear = await ClassModel.findOne({
                schoolId: user.schoolId,
                academicYearId: classData.academicYearId._id,
                homeRoomTeacher: newTeacher._id,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingClassInCurrentYear) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    `Giáo viên "${newTeacher.fullName}" đã là chủ nhiệm lớp "${existingClassInCurrentYear.name}" trong năm học này`,
                );
            }

            console.log('✅ [Class update] New teacher is available for current year');

            // Xóa classId của giáo viên cũ
            if (oldTeacherId) {
                await UserModel.findByIdAndUpdate(oldTeacherId, {
                    $unset: { classId: 1 },
                });
            }

            // Gán classId cho giáo viên mới
            await UserModel.findByIdAndUpdate(data.homeRoomTeacher, {
                classId: id,
            });

            console.log('✅ [Class update] Homeroom teacher updated and notified');
        }

        // ✅ Cập nhật
        const updatedClass = await ClassModel.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('homeRoomTeacher', 'fullName username email phone')
            .populate('createdBy', 'fullName username');

        console.log('✅ [Class update] Updated successfully');

        // ✅ Tạo thông báo cho giáo viên
        const editorUser = await UserModel.findById(userId).select('fullName');
        const editorName = editorUser?.fullName || 'Ban giám hiệu';

        // ✅ Trường hợp 1: THAY ĐỔI GIÁO VIÊN CHỦ NHIỆM
        if (data.homeRoomTeacher && data.homeRoomTeacher !== oldTeacherId) {
            // ✅ Thông báo cho giáo viên MỚI
            await notificationServices.createNotification({
                recipientUserId: data.homeRoomTeacher,
                schoolId: user.schoolId,
                title: 'Phân công giáo viên chủ nhiệm',
                message: `Bạn được phân công làm giáo viên chủ nhiệm <strong>lớp ${updatedClass.name}</strong> trong năm học ${updatedClass.academicYearId.fromYear}-${updatedClass.academicYearId.toYear} bởi <strong>${editorName}</strong>`,
                meta: {
                    classId: updatedClass._id,
                    className: updatedClass.name,
                    academicYearId: updatedClass.academicYearId._id,
                    academicYearName: `${updatedClass.academicYearId.fromYear}-${updatedClass.academicYearId.toYear}`,
                    actionBy: userId,
                    actionByName: editorName,
                },
            });

            // ✅ Thông báo cho giáo viên CŨ (bị gỡ bỏ)
            if (oldTeacherId) {
                await notificationServices.createNotification({
                    recipientUserId: oldTeacherId,
                    schoolId: user.schoolId,
                    title: 'Gỡ bỏ giáo viên chủ nhiệm',
                    message: `Bạn đã được gỡ bỏ khỏi chủ nhiệm <strong>lớp ${oldClassName}</strong> trong năm học ${updatedClass.academicYearId.fromYear}-${updatedClass.academicYearId.toYear} bởi <strong>${editorName}</strong>`,
                    meta: {
                        classId: updatedClass._id,
                        className: oldClassName,
                        academicYearId: updatedClass.academicYearId._id,
                        academicYearName: `${updatedClass.academicYearId.fromYear}-${updatedClass.academicYearId.toYear}`,
                        actionBy: userId,
                        actionByName: editorName,
                    },
                });
            }
        }
        // ✅ Trường hợp 2: GIỮ NGUYÊN GIÁO VIÊN NHƯNG ĐỔI TÊN LỚP
        else if (data.name && data.name !== oldClassName && oldTeacherId) {
            await notificationServices.createNotification({
                recipientUserId: oldTeacherId,
                schoolId: user.schoolId,
                title: 'Cập nhật thông tin lớp học',
                message: `Lớp học bạn đang chủ nhiệm đã được đổi tên từ "<strong>${oldClassName}</strong>" sang "<strong>${data.name}</strong>" bởi <strong>${editorName}</strong>`,
                meta: {
                    classId: updatedClass._id,
                    className: data.name,
                    oldClassName: oldClassName,
                    academicYearId: updatedClass.academicYearId._id,
                    academicYearName: `${updatedClass.academicYearId.fromYear}-${updatedClass.academicYearId.toYear}`,
                    actionBy: userId,
                    actionByName: editorName,
                },
            });
        }

        return updatedClass;
    } catch (error) {
        console.error('❌ [Class update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật lớp học: ' + error.message);
    }
};

const deleteClass = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const classData = await ClassModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'status fromYear toYear')
            .populate('homeRoomTeacher', 'fullName email');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Chỉ cho phép xóa lớp trong năm học đang "active"
        if (classData.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa lớp trong năm học đang hoạt động');
        }

        // ✅ KIỂM TRA: Lớp có hồ sơ trẻ không
        const hasChildren = await hasChildrenProfiles(id);
        if (hasChildren) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Không thể xóa lớp đã có hồ sơ trẻ em. Vui lòng xóa tất cả hồ sơ trước.',
            );
        }

        // ✅ Lưu lại tên lớp trước khi xóa
        const className = classData.name;

        // ✅ Xóa classId của giáo viên chủ nhiệm
        await UserModel.findByIdAndUpdate(classData.homeRoomTeacher._id, {
            $unset: { classId: 1 },
        });

        // Soft delete
        await ClassModel.findByIdAndUpdate(id, { _destroy: true });

        // ✅ Thông báo cho giáo viên chủ nhiệm
        if (classData.homeRoomTeacher) {
            const deleterUser = await UserModel.findById(userId).select('fullName');
            const deleterName = deleterUser?.fullName || 'Ban giám hiệu';

            await notificationServices.createNotification({
                recipientUserId: classData.homeRoomTeacher._id,
                schoolId: user.schoolId,
                title: 'Xóa lớp học',
                message: `<strong>Lớp ${classData.name}</strong> mà bạn đang chủ nhiệm đã bị xóa bởi <strong>${deleterName}</strong>`,
                meta: {
                    classId: classData._id,
                    className: classData.name,
                    academicYearId: classData.academicYearId._id,
                    academicYearName: `${classData.academicYearId.fromYear}-${classData.academicYearId.toYear}`,
                    actionBy: userId,
                    actionByName: deleterName,
                },
            });
        }

        return { message: 'Xóa lớp học thành công', className: className };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa lớp học');
    }
};

// ✅ API lấy danh sách giáo viên có thể chọn (loại trừ Tổ cấp dưỡng và đã được gán lớp)
// ✅ Tối ưu getAvailableTeachers - Dùng aggregation
const getAvailableTeachers = async (academicYearId, userId, currentClassId = null) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Parallel query
        const [allTeachers, careTeamDept, assignedClasses] = await Promise.all([
            // 1. Lấy tất cả giáo viên
            UserModel.find({
                schoolId: user.schoolId,
                role: 'giao_vien',
                status: true,
                _destroy: false,
            })
                .select('fullName username email phone')
                .lean(),

            // 2. Lấy Tổ cấp dưỡng
            DepartmentModel.findOne({
                schoolId: user.schoolId,
                academicYearId,
                name: 'Tổ cấp dưỡng',
                _destroy: false,
            })
                .select('managers')
                .lean(),

            // 3. Lấy các lớp đã được gán
            ClassModel.find({
                schoolId: user.schoolId,
                academicYearId,
                _destroy: false,
            })
                .select('homeRoomTeacher')
                .lean(),
        ]);

        // ✅ Process data
        const careTeamManagerIds = new Set((careTeamDept?.managers || []).map((m) => m.toString()));

        const assignedTeacherIds = new Set(
            assignedClasses
                .map((cls) => cls.homeRoomTeacher.toString())
                .filter((teacherId) => {
                    if (currentClassId) {
                        const currentClass = assignedClasses.find((cls) => cls._id.toString() === currentClassId);
                        if (currentClass && currentClass.homeRoomTeacher.toString() === teacherId) {
                            return false;
                        }
                    }
                    return true;
                }),
        );

        // ✅ Filter available teachers
        const availableTeachers = allTeachers.filter((teacher) => {
            const teacherId = teacher._id.toString();
            return !careTeamManagerIds.has(teacherId) && !assignedTeacherIds.has(teacherId);
        });

        return availableTeachers;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách giáo viên');
    }
};

// ✅ API lấy danh sách Nhóm tuổi theo khối
const getAgeGroupsByGrade = (grade) => {
    return ClassModel.getAgeGroupsByGrade(grade);
};

const copyFromYear = async (data, userId) => {
    try {
        console.log('📋 [Class copyFromYear] Starting with data:', data);
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
        const existingClasses = await ClassModel.find({
            schoolId,
            academicYearId: toAcademicYearId,
            _destroy: false,
        });

        if (existingClasses.length > 0) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                `Năm học ${toAcademicYear.fromYear}-${toAcademicYear.toYear} đã có ${existingClasses.length} lớp học. Vui lòng xóa hết trước khi copy.`,
            );
        }

        // ✅ Lấy danh sách lớp học từ năm cũ
        const sourceClasses = await ClassModel.find({
            schoolId,
            academicYearId: fromAcademicYearId,
            _destroy: false,
        }).populate('homeRoomTeacher', '_id');

        if (sourceClasses.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Năm học nguồn không có lớp học nào');
        }

        console.log(`📋 [Class copyFromYear] Found ${sourceClasses.length} classes to copy`);

        // ✅ Lấy danh sách giáo viên khả dụng trong năm mới
        const availableTeachers = await UserModel.find({
            schoolId,
            role: 'giao_vien',
            status: true,
            _destroy: false,
        }).select('_id');

        const availableTeacherIds = new Set(availableTeachers.map((t) => t._id.toString()));

        // ✅ Kiểm tra giáo viên trong Tổ cấp dưỡng năm mới
        const careTeamDept = await DepartmentModel.findOne({
            schoolId,
            academicYearId: toAcademicYearId,
            name: 'Tổ cấp dưỡng',
            _destroy: false,
        }).select('managers');

        const careTeamManagerIds = new Set(careTeamDept?.managers.map((m) => m.toString()) || []);

        // ✅ Copy từng lớp học
        const copiedClasses = [];
        const teacherAssignments = []; // Lưu assignment để update sau
        const copierUser = await UserModel.findById(userId).select('fullName');
        const copierName = copierUser?.fullName || 'Ban giám hiệu';

        for (const sourceClass of sourceClasses) {
            const classId = await ClassModel.generateClassId();

            // ✅ Kiểm tra giáo viên chủ nhiệm có khả dụng không
            const oldTeacherId = sourceClass.homeRoomTeacher._id.toString();
            let newTeacherId = null;

            if (availableTeacherIds.has(oldTeacherId) && !careTeamManagerIds.has(oldTeacherId)) {
                // Giáo viên cũ vẫn khả dụng
                newTeacherId = oldTeacherId;
            } else {
                // Tìm giáo viên thay thế (nếu có)
                const replacementTeacher = availableTeachers.find(
                    (t) => !careTeamManagerIds.has(t._id.toString()) && !teacherAssignments.includes(t._id.toString()),
                );

                if (replacementTeacher) {
                    newTeacherId = replacementTeacher._id.toString();
                }
            }

            if (!newTeacherId) {
                console.warn(`⚠️ [Class copyFromYear] No available teacher for class ${sourceClass.name}, skipping...`);
                continue; // Bỏ qua lớp này nếu không có giáo viên
            }

            const newClass = new ClassModel({
                classId,
                schoolId,
                academicYearId: toAcademicYearId,
                grade: sourceClass.grade,
                ageGroup: sourceClass.ageGroup,
                name: sourceClass.name,
                homeRoomTeacher: newTeacherId,
                description: sourceClass.description || '',
                sessions: {
                    morning: sourceClass.sessions?.morning || false,
                    afternoon: sourceClass.sessions?.afternoon || false,
                    evening: sourceClass.sessions?.evening || false,
                },
                createdBy: userId,
            });

            const savedClass = await newClass.save();
            copiedClasses.push(savedClass);
            teacherAssignments.push(newTeacherId);

            // ✅ Cập nhật classId cho giáo viên
            await UserModel.findByIdAndUpdate(newTeacherId, {
                classId: savedClass._id,
            });
            // ✅ Tạo thông báo cho giáo viên nếu có
            await notificationServices.createNotification({
                recipientUserId: newTeacherId,
                schoolId,
                title: 'Phân công giáo viên chủ nhiệm (Copy)',
                message: `Bạn được phân công làm giáo viên chủ nhiệm <strong>lớp ${sourceClass.name}</strong> trong năm học ${toAcademicYear.fromYear}-${toAcademicYear.toYear} (Copy từ năm học ${fromAcademicYear.fromYear}-${fromAcademicYear.toYear}) bởi <strong>${copierName}</strong>`,
                meta: {
                    classId: savedClass._id,
                    className: sourceClass.name,
                    academicYearId: toAcademicYear._id,
                    academicYearName: `${toAcademicYear.fromYear}-${toAcademicYear.toYear}`,
                    sourceAcademicYearName: `${fromAcademicYear.fromYear}-${fromAcademicYear.toYear}`,
                    actionBy: userId,
                    actionByName: copierName,
                },
            });
        }

        if (copiedClasses.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Không thể copy lớp học nào do thiếu giáo viên khả dụng');
        }

        // ✅ Đánh dấu năm học đích đã cấu hình
        if (!toAcademicYear.isConfig) {
            toAcademicYear.isConfig = true;
            await toAcademicYear.save();
            console.log('✅ [Class copyFromYear] Academic year marked as configured');
        }

        console.log(`✅ [Class copyFromYear] Copied ${copiedClasses.length} classes successfully`);

        // ✅ Populate data để trả về
        const populatedClasses = await ClassModel.find({
            _id: { $in: copiedClasses.map((c) => c._id) },
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('homeRoomTeacher', 'fullName username email phone')
            .populate('createdBy', 'fullName username');

        // ✅ Log action manually
        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.COPY,
            AUDIT_LOG_RESOURCES.CLASS,
            `Copy ${copiedClasses.length} lớp học từ năm ${fromAcademicYear.fromYear}-${fromAcademicYear.toYear} sang năm ${fromAcademicYear.fromYear}-${fromAcademicYear.toYear}`,
            {
                fromAcademicYearId: data.fromAcademicYearId,
                toAcademicYearId: data.toAcademicYearId,
                count: copiedClasses.length,
            },
        );

        return {
            count: populatedClasses.length,
            classes: populatedClasses,
        };
    } catch (error) {
        console.error('❌ [Class copyFromYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi copy lớp học: ' + error.message);
    }
};

export const classServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteClass,
    getAvailableTeachers,
    getAgeGroupsByGrade,
    copyFromYear,
};

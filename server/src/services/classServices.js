import { ClassModel } from '~/models/classModel';
import { AcademicYearModel } from '~/models/academicYearModel';
import { DepartmentModel } from '~/models/departmentModel';
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

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
                `Nhóm lớp "${data.ageGroup}" không phù hợp với khối "${data.grade}"`,
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
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId = '', grade = '', search = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false, schoolId: user.schoolId };

        if (academicYearId) {
            filter.academicYearId = academicYearId;
        }

        if (grade) {
            filter.grade = grade;
        }

        if (search) {
            filter.$or = [{ name: { $regex: search, $options: 'i' } }];
        }

        const classes = await ClassModel.find(filter)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('homeRoomTeacher', 'fullName username email phone')
            .populate('createdBy', 'fullName username')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await ClassModel.countDocuments(filter);

        return {
            classes,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
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
        }).populate('academicYearId');

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

        // ✅ Validate ageGroup phù hợp với grade (nếu có thay đổi)
        if (data.grade || data.ageGroup) {
            const grade = data.grade || classData.grade;
            const ageGroup = data.ageGroup || classData.ageGroup;

            const validAgeGroups = ClassModel.getAgeGroupsByGrade(grade);
            if (!validAgeGroups.includes(ageGroup)) {
                throw new ApiError(StatusCodes.BAD_REQUEST, `Nhóm lớp "${ageGroup}" không phù hợp với khối "${grade}"`);
            }
        }

        // ✅ Nếu cập nhật giáo viên chủ nhiệm
        if (data.homeRoomTeacher && data.homeRoomTeacher !== classData.homeRoomTeacher.toString()) {
            const newTeacher = await UserModel.findOne({
                _id: data.homeRoomTeacher,
                schoolId: user.schoolId,
                role: 'giao_vien',
                status: true,
                _destroy: false,
            });

            if (!newTeacher) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy giáo viên hoặc giáo viên không hợp lệ');
            }

            // ✅ FIX: Kiểm tra giáo viên mới đã được gán lớp khác TRONG NĂM HỌC HIỆN TẠI chưa
            const existingClassInCurrentYear = await ClassModel.findOne({
                schoolId: user.schoolId,
                academicYearId: classData.academicYearId._id, // ✅ Chỉ kiểm tra trong năm học hiện tại
                homeRoomTeacher: newTeacher._id,
                _id: { $ne: id }, // ✅ Loại trừ lớp đang update
                _destroy: false,
            });

            if (existingClassInCurrentYear) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    `Giáo viên "${newTeacher.fullName}" đã là chủ nhiệm lớp "${existingClassInCurrentYear.name}" trong năm học này`,
                );
            }

            console.log('✅ [Class update] New teacher is available for current year');

            // ✅ Kiểm tra giáo viên có trong Tổ cấp dưỡng không
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

            // ✅ Xóa classId của giáo viên cũ
            await UserModel.findByIdAndUpdate(classData.homeRoomTeacher, {
                $unset: { classId: 1 },
            });

            // ✅ Gán classId cho giáo viên mới
            await UserModel.findByIdAndUpdate(data.homeRoomTeacher, {
                classId: id,
            });

            console.log('✅ [Class update] Teacher reassigned');
        }

        // ✅ Validate sessions nếu có cập nhật
        if (data.sessions) {
            if (!data.sessions.morning && !data.sessions.afternoon && !data.sessions.evening) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Phải chọn ít nhất một buổi học');
            }
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
        }).populate('academicYearId homeRoomTeacher');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Chỉ cho phép xóa lớp trong năm học đang "active"
        if (classData.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa lớp trong năm học đang hoạt động');
        }

        // ✅ Xóa classId của giáo viên chủ nhiệm
        await UserModel.findByIdAndUpdate(classData.homeRoomTeacher._id, {
            $unset: { classId: 1 },
        });

        // Soft delete
        await ClassModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa lớp học thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa lớp học');
    }
};

// ✅ API lấy danh sách giáo viên có thể chọn (loại trừ Tổ cấp dưỡng và đã được gán lớp)
const getAvailableTeachers = async (academicYearId, userId, currentClassId = null) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Lấy tất cả giáo viên
        const allTeachers = await UserModel.find({
            schoolId: user.schoolId,
            role: 'giao_vien',
            status: true,
            _destroy: false,
        }).select('fullName username email phone');

        // ✅ Lấy danh sách giáo viên trong Tổ cấp dưỡng (năm học hiện tại)
        const careTeamDept = await DepartmentModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            name: 'Tổ cấp dưỡng',
            _destroy: false,
        }).select('managers');

        const careTeamManagerIds = new Set(careTeamDept?.managers.map((m) => m.toString()) || []);

        // ✅ Lấy danh sách giáo viên đã được gán lớp TRONG NĂM HỌC HIỆN TẠI
        const classesInCurrentYear = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId, // ✅ Chỉ lấy lớp trong năm học hiện tại
            _destroy: false,
        }).select('homeRoomTeacher');

        const assignedTeacherIds = new Set(
            classesInCurrentYear
                .map((cls) => cls.homeRoomTeacher.toString())
                .filter((teacherId) => {
                    // ✅ Nếu đang edit, cho phép giữ giáo viên hiện tại
                    if (currentClassId) {
                        const currentClass = classesInCurrentYear.find((cls) => cls._id.toString() === currentClassId);
                        if (currentClass && currentClass.homeRoomTeacher.toString() === teacherId) {
                            return false; // Không loại trừ giáo viên hiện tại
                        }
                    }
                    return true;
                }),
        );

        // ✅ Lọc giáo viên khả dụng
        const availableTeachers = allTeachers.filter((teacher) => {
            const teacherId = teacher._id.toString();

            // Loại bỏ nếu trong Tổ cấp dưỡng
            if (careTeamManagerIds.has(teacherId)) {
                return false;
            }

            // Loại bỏ nếu đã được gán lớp trong năm học hiện tại
            if (assignedTeacherIds.has(teacherId)) {
                return false;
            }

            return true;
        });

        console.log(
            `📊 [getAvailableTeachers] Total: ${allTeachers.length}, In care team: ${careTeamManagerIds.size}, Assigned in current year: ${assignedTeacherIds.size}, Available: ${availableTeachers.length}`,
        );

        return availableTeachers;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách giáo viên');
    }
};

// ✅ API lấy danh sách nhóm lớp theo khối
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

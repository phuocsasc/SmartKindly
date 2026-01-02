import { ChildrenByClassModel } from '~/models/childrenByClassModel.js';
import { ChildrenManagementModel } from '~/models/childrenManagementModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { ClassModel } from '~/models/classModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { removeVietnameseTones } from '~/utils/formatters.js';

/**
 * ✅ Helper: Check permission - Chỉ BGH mới được thao tác
 */
const checkPermission = (user) => {
    if (user.role !== 'ban_giam_hieu') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền thực hiện thao tác này');
    }
};

/**
 * ✅ Lấy danh sách trẻ theo lớp
 */
const getAll = async (query, userId) => {
    try {
        console.log('📋 [ChildrenByClass getAll] Starting with query:', query);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId = '', classId = '', search = '' } = query;

        // ✅ Validate năm học
        if (!academicYearId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Năm học là bắt buộc');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        }).select('fromYear toYear status');

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ Validate lớp học
        if (!classId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Lớp học là bắt buộc');
        }

        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        })
            .populate('homeRoomTeacher', 'fullName')
            .select('name grade ageGroup homeRoomTeacher');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Build filter
        const filter = {
            schoolId: user.schoolId,
            academicYearId,
            classId,
            _destroy: false,
        };

        if (search) {
            const students = await ChildrenManagementModel.find({
                schoolId: user.schoolId,
                _destroy: false,
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { fullNameWithoutAccent: { $regex: removeVietnameseTones(search), $options: 'i' } },
                    { studentCode: { $regex: search, $options: 'i' } },
                ],
            }).select('_id');

            const studentIds = students.map((s) => s._id);
            filter.studentId = { $in: studentIds };
        }

        const total = await ChildrenByClassModel.countDocuments(filter);

        const children = await ChildrenByClassModel.find(filter)
            .populate('studentId', 'fullName studentCode birthDate gender status')
            .select('studentId managementStatus createdAt') // ✅ Select managementStatus
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        console.log('📋 [ChildrenByClass getAll] Found:', children.length, 'children');

        return {
            children,
            classInfo: {
                className: classData.name,
                grade: classData.grade,
                ageGroup: classData.ageGroup,
                homeRoomTeacher: classData.homeRoomTeacher?.fullName || '---',
            },
            academicYearInfo: {
                fromYear: academicYear.fromYear,
                toYear: academicYear.toYear,
                status: academicYear.status,
            },
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit),
            },
        };
    } catch (error) {
        console.error('❌ [ChildrenByClass getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách trẻ theo lớp');
    }
};

/**
 * ✅ Lấy danh sách trẻ chưa có lớp (để thêm vào lớp)
 */
const getAvailableStudents = async (academicYearId, classId, userId) => {
    try {
        console.log('📋 [ChildrenByClass getAvailableStudents] Starting');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Validate năm học active
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được thêm trẻ vào lớp trong năm học đang hoạt động');
        }

        // ✅ Validate lớp học
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            _destroy: false,
        }).select('ageGroup');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Lấy danh sách trẻ chưa có lớp, đang học, và phù hợp nhóm tuổi
        const availableStudents = await ChildrenManagementModel.find({
            schoolId: user.schoolId,
            hasClass: false,
            status: 'Đang học',
            currentAgeGroup: classData.ageGroup,
            _destroy: false,
        })
            .select('fullName studentCode birthDate gender currentAgeGroup')
            .sort({ fullName: 1 })
            .lean();

        console.log('✅ [ChildrenByClass getAvailableStudents] Found:', availableStudents.length, 'students');

        return {
            students: availableStudents,
            classAgeGroup: classData.ageGroup,
        };
    } catch (error) {
        console.error('❌ [ChildrenByClass getAvailableStudents] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách trẻ chưa có lớp');
    }
};

/**
 * ✅ Thêm trẻ vào lớp
 */
const addStudentsToClass = async (data, userId) => {
    try {
        console.log('📥 [ChildrenByClass addStudentsToClass] Starting');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        const { academicYearId, classId, studentIds } = data;

        // ✅ Validate năm học active
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được thêm trẻ vào lớp trong năm học đang hoạt động');
        }

        // ✅ Validate lớp học
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            _destroy: false,
        }).select('name ageGroup');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Validate students và lấy status từ ChildrenManagementModel
        const students = await ChildrenManagementModel.find({
            _id: { $in: studentIds },
            schoolId: user.schoolId,
            hasClass: false,
            status: 'Đang học',
            currentAgeGroup: classData.ageGroup,
            _destroy: false,
        }).select('_id status');

        if (students.length === 0) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'Không tìm thấy học sinh phù hợp (chưa có lớp, đang học, và cùng nhóm tuổi)',
            );
        }

        if (students.length !== studentIds.length) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Một số học sinh không đủ điều kiện để thêm vào lớp');
        }

        // ✅ Kiểm tra duplicate
        const existingRecords = await ChildrenByClassModel.find({
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            classId: classId,
            studentId: { $in: studentIds },
            _destroy: false,
        }).select('studentId');

        if (existingRecords.length > 0) {
            throw new ApiError(StatusCodes.CONFLICT, 'Một số học sinh đã có trong lớp học này');
        }

        // ✅ Tạo records với managementStatus từ ChildrenManagementModel.status
        const records = students.map((student) => ({
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            classId: classId,
            studentId: student._id,
            managementStatus: student.status, // ✅ Copy từ ChildrenManagementModel
            createdBy: userId,
            lastUpdatedBy: userId,
        }));

        const insertedRecords = await ChildrenByClassModel.insertMany(records);

        // ✅ Update ChildrenManagement: hasClass = true, currentClassName = className
        await ChildrenManagementModel.updateMany(
            { _id: { $in: studentIds } },
            {
                $set: {
                    hasClass: true,
                    currentClassName: classData.name,
                },
            },
        );

        console.log('✅ [ChildrenByClass addStudentsToClass] Added:', insertedRecords.length, 'students');

        return {
            message: `Đã thêm ${insertedRecords.length} trẻ vào lớp ${classData.name}`,
            count: insertedRecords.length,
            className: classData.name,
        };
    } catch (error) {
        console.error('❌ [ChildrenByClass addStudentsToClass] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi thêm trẻ vào lớp');
    }
};

/**
 * ✅ Lấy danh sách lớp phù hợp để chuyển (cùng nhóm tuổi)
 */
const getAvailableClassesForTransfer = async (academicYearId, fromClassId, studentIds, userId) => {
    try {
        console.log('📋 [ChildrenByClass getAvailableClassesForTransfer] Starting with:', {
            academicYearId,
            fromClassId,
            studentIds,
        });

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Validate năm học active
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được chuyển lớp trong năm học đang hoạt động');
        }

        // ✅ FIX: Lấy thông tin students từ ChildrenByClassModel (đã có records)
        const childrenByClassRecords = await ChildrenByClassModel.find({
            _id: { $in: studentIds },
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            classId: fromClassId,
            _destroy: false,
        })
            .populate('studentId', 'currentAgeGroup fullName')
            .lean();

        console.log('📋 [getAvailableClassesForTransfer] Found records:', childrenByClassRecords.length);

        if (childrenByClassRecords.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy học sinh trong lớp này');
        }

        if (childrenByClassRecords.length !== studentIds.length) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Một số học sinh không tồn tại hoặc không thuộc lớp này');
        }

        // ✅ Check tất cả học sinh phải cùng nhóm tuổi
        const ageGroups = [...new Set(childrenByClassRecords.map((record) => record.studentId?.currentAgeGroup))];

        console.log('📋 [getAvailableClassesForTransfer] Age groups found:', ageGroups);

        if (ageGroups.length > 1) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Không thể chuyển lớp cho học sinh có nhóm tuổi khác nhau');
        }

        const targetAgeGroup = ageGroups[0];

        if (!targetAgeGroup) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Không xác định được nhóm tuổi của học sinh');
        }

        // ✅ Lấy danh sách lớp cùng nhóm tuổi (trừ lớp hiện tại)
        const availableClasses = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            ageGroup: targetAgeGroup,
            _id: { $ne: fromClassId },
            _destroy: false,
        })
            .populate('homeRoomTeacher', 'fullName')
            .select('name grade ageGroup homeRoomTeacher')
            .sort({ name: 1 })
            .lean();

        console.log('✅ [ChildrenByClass getAvailableClassesForTransfer] Found:', availableClasses.length, 'classes');

        return {
            classes: availableClasses,
            targetAgeGroup,
        };
    } catch (error) {
        console.error('❌ [ChildrenByClass getAvailableClassesForTransfer] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp phù hợp');
    }
};

/**
 * ✅ Chuyển lớp cho trẻ
 */
const transferStudents = async (data, userId) => {
    try {
        console.log('🔄 [ChildrenByClass transferStudents] Starting with data:', data);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        const { academicYearId, fromClassId, toClassId, studentIds } = data;

        // ✅ Validate năm học active
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được chuyển lớp trong năm học đang hoạt động');
        }

        // ✅ Validate from class
        const fromClass = await ClassModel.findOne({
            _id: fromClassId,
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            _destroy: false,
        }).select('name ageGroup');

        if (!fromClass) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp cũ');
        }

        // ✅ Validate to class
        const toClass = await ClassModel.findOne({
            _id: toClassId,
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            _destroy: false,
        }).select('name ageGroup');

        if (!toClass) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp mới');
        }

        // ✅ Check cùng nhóm tuổi
        if (fromClass.ageGroup !== toClass.ageGroup) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Không thể chuyển lớp: Lớp mới phải cùng nhóm tuổi "${fromClass.ageGroup}"`,
            );
        }

        // ✅ Validate students trong lớp cũ
        const existingRecords = await ChildrenByClassModel.find({
            _id: { $in: studentIds },
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            classId: fromClassId,
            _destroy: false,
        }).select('studentId managementStatus');

        const existingIds = existingRecords.map((r) => r._id.toString());
        const missingIds = studentIds.filter((id) => !existingIds.includes(id));

        if (missingIds.length > 0) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `${missingIds.length} học sinh không thuộc lớp cũ hoặc đã bị xóa`,
            );
        }

        // ✅ Validate students từ ChildrenManagementModel
        const studentObjectIds = existingRecords.map((r) => r.studentId);
        const students = await ChildrenManagementModel.find({
            _id: { $in: studentObjectIds },
            schoolId: user.schoolId,
            currentAgeGroup: toClass.ageGroup,
            _destroy: false,
        }).select('currentAgeGroup fullName');

        if (students.length !== studentIds.length) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Một số học sinh không phù hợp với nhóm tuổi của lớp mới');
        }

        // ✅ Update records: chuyển từ fromClassId sang toClassId
        // ✅ KHÔNG CẬP NHẬT managementStatus (giữ nguyên trạng thái hiện tại)
        const updateResult = await ChildrenByClassModel.updateMany(
            {
                _id: { $in: studentIds },
                schoolId: user.schoolId,
                academicYearId: academicYearId,
                classId: fromClassId,
                _destroy: false,
            },
            {
                $set: {
                    classId: toClassId,
                    lastUpdatedBy: userId,
                },
            },
        );

        console.log('📋 [transferStudents] Update result:', updateResult);

        // ✅ Update ChildrenManagement: currentClassName = toClass.name
        await ChildrenManagementModel.updateMany(
            { _id: { $in: studentObjectIds } },
            {
                $set: {
                    currentClassName: toClass.name,
                },
            },
        );

        console.log('✅ [ChildrenByClass transferStudents] Transferred:', studentIds.length, 'students');

        return {
            message: `Đã chuyển ${studentIds.length} trẻ từ lớp "${fromClass.name}" sang lớp "${toClass.name}"`,
            count: studentIds.length,
            fromClassName: fromClass.name,
            toClassName: toClass.name,
        };
    } catch (error) {
        console.error('❌ [ChildrenByClass transferStudents] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi chuyển lớp');
    }
};

/**
 * ✅ Xóa 1 học sinh ra khỏi lớp
 */
const removeStudentFromClass = async (id, userId) => {
    try {
        console.log('🗑️ [ChildrenByClass removeStudentFromClass] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        // ✅ Tìm record
        const record = await ChildrenByClassModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate({
                path: 'academicYearId',
                select: 'status fromYear toYear',
            })
            .populate('classId', 'name')
            .populate('studentId', 'fullName studentCode')
            .lean();

        if (!record) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy học sinh trong lớp này');
        }

        // ✅ Chỉ cho phép xóa trong năm học active
        if (record.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được xóa học sinh trong năm học đang hoạt động');
        }

        // ✅ Lưu thông tin trước khi xóa
        const studentInfo = {
            fullName: record.studentId.fullName,
            studentCode: record.studentId.studentCode,
            className: record.classId.name,
            studentId: record.studentId._id,
        };

        // ✅ HARD DELETE - Xóa cứng record khỏi database
        await ChildrenByClassModel.findByIdAndDelete(id);

        // ✅ Update ChildrenManagement
        await ChildrenManagementModel.findByIdAndUpdate(studentInfo.studentId, {
            $set: {
                hasClass: false,
                currentClassName: 'Chưa có',
            },
        });

        console.log('✅ [ChildrenByClass removeStudentFromClass] Hard deleted successfully');

        return {
            message: `Đã xóa học sinh "${studentInfo.fullName}" ra khỏi lớp "${studentInfo.className}"`,
            studentInfo: {
                fullName: studentInfo.fullName,
                studentCode: studentInfo.studentCode,
                className: studentInfo.className,
            },
        };
    } catch (error) {
        console.error('❌ [ChildrenByClass removeStudentFromClass] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa học sinh ra khỏi lớp');
    }
};

/**
 * ✅ Xóa nhiều học sinh ra khỏi lớp
 */
const removeStudentsFromClass = async (ids, userId) => {
    try {
        console.log('🗑️ [ChildrenByClass removeStudentsFromClass] Starting with', ids.length, 'students');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        // ✅ Tìm các records
        const records = await ChildrenByClassModel.find({
            _id: { $in: ids },
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate({
                path: 'academicYearId',
                select: 'status',
            })
            .populate('studentId', '_id')
            .lean();

        if (records.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy học sinh nào trong lớp');
        }

        if (records.length !== ids.length) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Một số học sinh không tồn tại hoặc đã bị xóa');
        }

        // ✅ Kiểm tra năm học active
        const inactiveRecords = records.filter((r) => r.academicYearId.status !== 'active');
        if (inactiveRecords.length > 0) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được xóa học sinh trong năm học đang hoạt động');
        }

        // ✅ Lấy danh sách studentIds
        const studentIds = records.map((r) => r.studentId._id);

        // ✅ HARD DELETE - Xóa cứng records khỏi database
        const deleteResult = await ChildrenByClassModel.deleteMany({ _id: { $in: ids } });

        console.log('📋 [removeStudentsFromClass] Deleted count:', deleteResult.deletedCount);

        // ✅ Update ChildrenManagement
        const updateResult = await ChildrenManagementModel.updateMany(
            { _id: { $in: studentIds } },
            {
                $set: {
                    hasClass: false,
                    currentClassName: 'Chưa có',
                },
            },
        );

        console.log('📋 [removeStudentsFromClass] Updated ChildrenManagement:', updateResult.modifiedCount);

        console.log(
            '✅ [ChildrenByClass removeStudentsFromClass] Hard deleted:',
            deleteResult.deletedCount,
            'students',
        );

        return {
            message: `Đã xóa ${deleteResult.deletedCount} học sinh ra khỏi lớp`,
            count: deleteResult.deletedCount,
        };
    } catch (error) {
        console.error('❌ [ChildrenByClass removeStudentsFromClass] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa nhiều học sinh ra khỏi lớp');
    }
};

export const childrenByClassServices = {
    getAll,
    getAvailableStudents,
    addStudentsToClass,
    getAvailableClassesForTransfer,
    transferStudents,
    removeStudentFromClass,
    removeStudentsFromClass,
};

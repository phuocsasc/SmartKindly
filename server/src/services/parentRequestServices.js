// server/src/services/parentRequestServices.js

import { ParentRequestModel } from '~/models/parentRequestModel.js';
import { UserModel } from '~/models/userModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { ClassModel } from '~/models/classModel.js';
import { ChildrenManagementModel } from '~/models/childrenManagementModel.js';
import { ChildrenByClassModel } from '~/models/childrenByClassModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';

// Map tên tổ -> tên khối (Class.grade)
const DEPT_TO_GRADE = {
    'Khối Nhà Trẻ': 'Nhà trẻ',
    'Khối Mầm': 'Mầm',
    'Khối Chồi': 'Chồi',
    'Khối Lá': 'Lá',
};

const ensureUserSchool = async (userId) => {
    const user = await UserModel.findById(userId).select('schoolId role _id studentId');
    if (!user || !user.schoolId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
    }
    return user;
};

const getAcademicYearOrThrow = async (schoolId, academicYearId) => {
    const year = await AcademicYearModel.findOne({ _id: academicYearId, schoolId, _destroy: false });
    if (!year) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
    return year;
};

/**
 * ✅ Get accessible class IDs based on user role
 */
const getAccessibleClassIds = async (user, academicYearId) => {
    // Ban giám hiệu: All classes
    if (user.role === 'ban_giam_hieu') {
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).select('_id');
        return classes.map((c) => c._id.toString());
    }

    // Tổ trưởng: Classes in managed departments
    if (user.role === 'to_truong') {
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            managers: user._id,
            _destroy: false,
        }).select('name');

        const managedGrades = departments.map((dept) => {
            const grade = DEPT_TO_GRADE[dept.name];
            if (!grade) {
                console.warn(`⚠️ Department "${dept.name}" not mapped to grade`);
            }
            return grade;
        });

        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            grade: { $in: managedGrades },
            _destroy: false,
        }).select('_id');

        return classes.map((c) => c._id.toString());
    }

    // Giáo viên: Classes where user is homeroom teacher
    if (user.role === 'giao_vien') {
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            homeRoomTeacher: user._id,
            _destroy: false,
        }).select('_id');
        return classes.map((c) => c._id.toString());
    }

    return [];
};

/**
 * ✅ CREATE - Phụ huynh tạo phiếu dặn dò
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [ParentRequest createNew] Starting:', { userId, data });

        const user = await ensureUserSchool(userId);

        // ✅ Chỉ phụ huynh mới được tạo
        if (user.role !== 'phu_huynh') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ phụ huynh mới có quyền tạo phiếu dặn dò');
        }

        if (!user.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        const { academicYearId, requestName, fromDate, toDate, parentNote } = data;

        // ✅ Validate năm học active
        const year = await getAcademicYearOrThrow(user.schoolId, academicYearId);
        if (year.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được tạo phiếu trong năm học đang hoạt động');
        }

        // ✅ Tự động lấy lớp hiện tại của học sinh trong năm học này
        const classRecord = await ChildrenByClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            studentId: user.studentId,
            _destroy: false,
        }).lean();

        if (!classRecord) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Học sinh chưa được xếp lớp trong năm học này. Vui lòng liên hệ nhà trường.',
            );
        }

        const classId = classRecord.classId;

        // ✅ Validate class
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).select('name grade ageGroup');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Validate student
        const student = await ChildrenManagementModel.findOne({
            _id: user.studentId,
            schoolId: user.schoolId,
            _destroy: false,
        }).select('fullName studentCode status');

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin học sinh');
        }

        // ✅ Validate dates
        const from = dayjs(fromDate);
        const to = dayjs(toDate);
        if (!from.isValid() || !to.isValid()) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Ngày không hợp lệ');
        }
        if (from.isAfter(to)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
        }

        // ✅ Create request
        const newRequest = new ParentRequestModel({
            schoolId: user.schoolId,
            academicYearId,
            classId, // ✅ Tự động lấy từ ChildrenByClassModel
            studentId: user.studentId,
            requestName,
            fromDate: from.toDate(),
            toDate: to.toDate(),
            parentNote,
            teacherReply: '',
            status: 'Chờ duyệt',
            createdBy: user._id,
        });

        await newRequest.save();

        const populated = await ParentRequestModel.findById(newRequest._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name grade ageGroup')
            .populate('studentId', 'fullName studentCode')
            .populate('createdBy', 'fullName')
            .lean();

        console.log('✅ [ParentRequest createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [ParentRequest createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo phiếu dặn dò: ' + error.message);
    }
};

/**
 * ✅ GET ALL - Lấy danh sách phiếu dặn dò theo lớp (School roles)
 */
const getAll = async (query, userId) => {
    try {
        const user = await ensureUserSchool(userId);
        const { page = 1, limit = 10, academicYearId = '', classId = '', status = '', search = '' } = query;

        if (!academicYearId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Năm học là bắt buộc');
        }

        if (!classId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Lớp học là bắt buộc');
        }

        // ✅ Validate year
        await getAcademicYearOrThrow(user.schoolId, academicYearId);

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, academicYearId);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem phiếu dặn dò của lớp này');
        }

        const filter = {
            schoolId: user.schoolId,
            academicYearId,
            classId,
            _destroy: false,
        };

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { requestName: { $regex: search, $options: 'i' } },
                { parentNote: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            ParentRequestModel.find(filter)
                .populate('academicYearId', 'fromYear toYear')
                .populate('classId', 'name')
                .populate('studentId', 'fullName studentCode')
                .populate('createdBy', 'fullName')
                .populate('lastUpdatedBy', 'fullName')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            ParentRequestModel.countDocuments(filter),
        ]);

        console.log('✅ [ParentRequest getAll] Found items:', items.length);

        return {
            items,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        console.error('❌ [ParentRequest getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách phiếu dặn dò: ' + error.message);
    }
};

/**
 * ✅ GET MY REQUESTS - Phụ huynh xem phiếu dặn dò của con mình
 */
const getMyRequests = async (query, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        if (user.role !== 'phu_huynh') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ phụ huynh mới có quyền xem phiếu dặn dò của con');
        }

        if (!user.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        const { page = 1, limit = 10, academicYearId = '', status = '', search = '' } = query;

        const filter = {
            schoolId: user.schoolId,
            studentId: user.studentId,
            _destroy: false,
        };

        if (academicYearId) {
            filter.academicYearId = academicYearId;
        }

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { requestName: { $regex: search, $options: 'i' } },
                { parentNote: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            ParentRequestModel.find(filter)
                .populate('academicYearId', 'fromYear toYear status')
                .populate('classId', 'name')
                .populate('studentId', 'fullName studentCode')
                .populate('createdBy', 'fullName')
                .populate('lastUpdatedBy', 'fullName')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            ParentRequestModel.countDocuments(filter),
        ]);

        console.log('✅ [ParentRequest getMyRequests] Found items:', items.length);

        return {
            items,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        console.error('❌ [ParentRequest getMyRequests] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách phiếu dặn dò: ' + error.message);
    }
};

/**
 * ✅ GET DETAILS
 */
const getDetails = async (id, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const request = await ParentRequestModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name grade ageGroup')
            .populate('studentId', 'fullName studentCode')
            .populate('createdBy', 'fullName')
            .populate('lastUpdatedBy', 'fullName')
            .lean();

        if (!request) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu dặn dò');
        }

        // ✅ Check permission
        if (user.role === 'phu_huynh') {
            if (!user.studentId || request.studentId._id.toString() !== user.studentId.toString()) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem phiếu dặn dò này');
            }
        } else {
            const accessibleClassIds = await getAccessibleClassIds(user, request.academicYearId._id);
            if (!accessibleClassIds.includes(request.classId._id.toString())) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem phiếu dặn dò này');
            }
        }

        return request;
    } catch (error) {
        console.error('❌ [ParentRequest getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy chi tiết phiếu dặn dò');
    }
};

/**
 * ✅ UPDATE - Cập nhật phiếu dặn dò
 */
const update = async (id, data, userId) => {
    try {
        console.log('✏️ [ParentRequest update] Starting:', { id, userId });

        const user = await ensureUserSchool(userId);

        const request = await ParentRequestModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!request) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu dặn dò');
        }

        // ✅ Chỉ cho phép update trong năm học active
        if (request.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật phiếu trong năm học đang hoạt động');
        }

        // ✅ PHÂN QUYỀN UPDATE
        if (user.role === 'phu_huynh') {
            // Phụ huynh chỉ được update nếu status = "Chờ duyệt"
            if (request.status !== 'Chờ duyệt') {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể chỉnh sửa phiếu đang ở trạng thái "Chờ duyệt"');
            }

            if (!user.studentId || request.studentId.toString() !== user.studentId.toString()) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền chỉnh sửa phiếu dặn dò này');
            }

            // Phụ huynh chỉ được update các field content (KHÔNG BAO GỒM classId)
            const allowedFields = ['requestName', 'fromDate', 'toDate', 'parentNote'];
            allowedFields.forEach((field) => {
                if (data[field] !== undefined) {
                    request[field] = data[field];
                }
            });
        } else {
            // Ban giám hiệu, Tổ trưởng, Giáo viên
            const accessibleClassIds = await getAccessibleClassIds(user, request.academicYearId._id);
            if (!accessibleClassIds.includes(request.classId.toString())) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền chỉnh sửa phiếu dặn dò này');
            }

            // School roles chỉ được update teacherReply và status
            if (data.teacherReply !== undefined) {
                request.teacherReply = data.teacherReply;
            }
            if (data.status !== undefined) {
                if (!['Chờ duyệt', 'Đã duyệt', 'Từ chối'].includes(data.status)) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, 'Trạng thái không hợp lệ');
                }
                request.status = data.status;
            }
        }

        // ✅ Validate dates if changed
        if (request.fromDate && request.toDate) {
            const from = dayjs(request.fromDate);
            const to = dayjs(request.toDate);
            if (from.isAfter(to)) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
            }
        }

        request.lastUpdatedBy = user._id;
        await request.save();

        const populated = await ParentRequestModel.findById(request._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name grade ageGroup')
            .populate('studentId', 'fullName studentCode')
            .populate('createdBy', 'fullName')
            .populate('lastUpdatedBy', 'fullName')
            .lean();

        console.log('✅ [ParentRequest update] Updated successfully');
        return populated;
    } catch (error) {
        console.error('❌ [ParentRequest update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật phiếu dặn dò: ' + error.message);
    }
};

/**
 * ✅ DELETE - Xóa phiếu dặn dò (chỉ phụ huynh, status = "Chờ duyệt")
 */
const deleteRequest = async (id, userId) => {
    try {
        console.log('🗑️ [ParentRequest delete] Starting:', { id, userId });

        const user = await ensureUserSchool(userId);

        if (user.role !== 'phu_huynh') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ phụ huynh mới có quyền xóa phiếu dặn dò');
        }

        const request = await ParentRequestModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'status')
            .populate('studentId', 'fullName studentCode');

        if (!request) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu dặn dò');
        }

        // ✅ Chỉ cho phép xóa trong năm học active
        if (request.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa phiếu trong năm học đang hoạt động');
        }

        // ✅ Chỉ phụ huynh của học sinh mới được xóa
        if (!user.studentId || request.studentId._id.toString() !== user.studentId.toString()) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa phiếu dặn dò này');
        }

        // ✅ Chỉ được xóa nếu status = "Chờ duyệt"
        if (request.status !== 'Chờ duyệt') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa phiếu đang ở trạng thái "Chờ duyệt"');
        }

        await ParentRequestModel.deleteOne({ _id: request._id });

        console.log('✅ [ParentRequest delete] Deleted successfully');
        return {
            message: 'Xóa phiếu dặn dò thành công',
            requestInfo: {
                requestName: request.requestName,
                studentName: request.studentId.fullName,
            },
        };
    } catch (error) {
        console.error('❌ [ParentRequest delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa phiếu dặn dò: ' + error.message);
    }
};

/**
 * ✅ GET ACCESSIBLE CLASSES - Lấy danh sách lớp có quyền truy cập
 */
const getAccessibleClassesList = async (academicYearId, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        }).select('fromYear toYear status');

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        const classIds = await getAccessibleClassIds(user, academicYearId);

        const classes = await ClassModel.find({
            _id: { $in: classIds },
            _destroy: false,
        })
            .select('name grade ageGroup')
            .sort({ name: 1 })
            .lean();

        return { classes };
    } catch (error) {
        console.error('❌ [ParentRequest getAccessibleClassesList] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp học');
    }
};

export const parentRequestServices = {
    createNew,
    getAll,
    getMyRequests,
    getDetails,
    update,
    deleteRequest,
    getAccessibleClassesList,
};

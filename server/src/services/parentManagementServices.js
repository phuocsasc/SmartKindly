// server/src/services/parentManagementServices.js

import { UserModel } from '~/models/userModel.js';
import { SchoolModel } from '~/models/schoolModel.js';
import { ChildrenManagementModel } from '~/models/childrenManagementModel.js';
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
 * ✅ Helper: Generate username từ họ tên học sinh
 * Format: viettat.hovaten (VD: "Nguyễn Văn A" → "nva.nguyenvana")
 */
const generateUsername = (abbreviation, fullName) => {
    const normalized = removeVietnameseTones(fullName.toLowerCase().trim());

    // Tách họ tên thành các từ
    const parts = normalized.split(/\s+/).filter((p) => p);

    // Lấy chữ cái đầu của mỗi từ (viết tắt)
    const initials = parts.map((p) => p[0]).join('');

    // Username: viettat.hovaten
    return `${abbreviation}.${initials}${normalized.replace(/\s+/g, '')}`.toLowerCase();
};

/**
 * ✅ Helper: Ensure unique username
 */
const ensureUniqueUsername = async (baseUsername) => {
    let username = baseUsername;
    let counter = 1;

    while (await UserModel.findOne({ username, _destroy: false })) {
        const randomNum = Math.floor(10 + Math.random() * 90); // Random 2 chữ số
        username = `${baseUsername}${randomNum}`;
        counter++;

        if (counter > 100) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Không thể tạo username duy nhất');
        }
    }

    return username;
};

/**
 * =========================================================
 * ✅ CREATE NEW PARENT USER
 * =========================================================
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [ParentManagement createNew] Starting with data:', data);

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        const { studentIds } = data; // Array of student IDs

        if (!studentIds || studentIds.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Vui lòng chọn ít nhất 1 học sinh');
        }

        // ✅ Lấy thông tin trường để tạo username
        const school = await SchoolModel.findOne({
            schoolId: user.schoolId,
            _destroy: false,
        }).select('abbreviation');

        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trường học');
        }

        // ✅ Validate học sinh
        const students = await ChildrenManagementModel.find({
            _id: { $in: studentIds },
            schoolId: user.schoolId,
            status: 'Đang học', // Chỉ cho phép tạo tài khoản cho học sinh đang học
            _destroy: false,
        }).select('fullName gender studentCode');

        if (students.length !== studentIds.length) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Một số học sinh không hợp lệ hoặc không ở trạng thái "Đang học"',
            );
        }

        // ✅ Kiểm tra học sinh đã có tài khoản phụ huynh chưa
        const existingParents = await UserModel.find({
            studentId: { $in: studentIds },
            schoolId: user.schoolId,
            role: 'phu_huynh',
            _destroy: false,
        }).select('studentId fullName username');

        if (existingParents.length > 0) {
            const existingStudentIds = existingParents.map((p) => p.studentId.toString());
            const duplicateStudents = students.filter((s) => existingStudentIds.includes(s._id.toString()));

            throw new ApiError(
                StatusCodes.CONFLICT,
                `Học sinh sau đã có tài khoản phụ huynh: ${duplicateStudents.map((s) => `${s.fullName} (${s.studentCode})`).join(', ')}`,
            );
        }

        // ✅ Tạo tài khoản phụ huynh cho từng học sinh
        const createdParents = [];
        const errors = [];

        for (const student of students) {
            try {
                // Generate username: abbreviation.viettat.hovaten
                const baseUsername = generateUsername(school.abbreviation, student.fullName);
                const username = await ensureUniqueUsername(baseUsername);

                // Tạo userId tự động
                const newUserId = await UserModel.generateUserId();

                // Mật khẩu mặc định
                const password = '123456';

                const newParent = new UserModel({
                    userId: newUserId,
                    username,
                    password,
                    fullName: student.fullName, // ✅ Lấy từ học sinh
                    gender: student.gender || '', // ✅ Lấy từ học sinh
                    email: data.email || '', // ✅ Optional: Email riêng nếu có
                    phone: data.phone || '', // ✅ Optional: Phone riêng nếu có
                    role: 'phu_huynh',
                    schoolId: user.schoolId,
                    studentId: student._id, // ✅ Liên kết với học sinh
                    status: true,
                });

                await newParent.save();

                // Populate student info
                const parentWithStudent = await UserModel.findById(newParent._id)
                    .select('-password')
                    .populate('studentId', 'fullName studentCode status gender')
                    .lean();

                createdParents.push(parentWithStudent);

                console.log(`✅ Created parent for student: ${student.fullName} (${student.studentCode})`);
            } catch (error) {
                console.error(`❌ Error creating parent for ${student.fullName}:`, error);
                errors.push({
                    studentName: student.fullName,
                    studentCode: student.studentCode,
                    error: error.message,
                });
            }
        }

        if (createdParents.length === 0) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Không thể tạo tài khoản phụ huynh nào');
        }

        return {
            created: createdParents,
            errors: errors.length > 0 ? errors : null,
            message:
                errors.length > 0
                    ? `Tạo thành công ${createdParents.length}/${students.length} tài khoản`
                    : 'Tạo tài khoản phụ huynh thành công',
        };
    } catch (error) {
        console.error('❌ [ParentManagement createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo tài khoản phụ huynh: ' + error.message);
    }
};

/**
 * =========================================================
 * ✅ GET ALL PARENTS
 * =========================================================
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, search = '', status = '' } = query;
        const skip = (page - 1) * limit;

        const filter = {
            schoolId: user.schoolId,
            role: 'phu_huynh',
            _destroy: false,
        };

        // Text search
        if (search && search.trim()) {
            // Lấy danh sách studentId từ ChildrenManagementModel
            const searchNormalized = removeVietnameseTones(search.trim()).toLowerCase();

            const students = await ChildrenManagementModel.find({
                schoolId: user.schoolId,
                _destroy: false,
                $or: [
                    { fullName: { $regex: search, $options: 'i' } }, // Tìm có dấu
                    { fullNameWithoutAccent: { $regex: searchNormalized, $options: 'i' } }, // Tìm không dấu
                    { studentCode: { $regex: search, $options: 'i' } }, // Tìm theo mã HS
                ],
            }).select('_id');

            const studentIds = students.map((s) => s._id);

            if (studentIds.length > 0) {
                filter.studentId = { $in: studentIds };
            } else {
                // Không tìm thấy học sinh nào khớp => trả về empty
                return {
                    parents: [],
                    pagination: {
                        currentPage: Number(page),
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: Number(limit),
                    },
                };
            }
        }

        // Filter by status
        if (status !== '') {
            filter.status = status === 'true';
        }

        // ✅ Parallel query
        const [parents, total] = await Promise.all([
            UserModel.find(filter)
                .select('-password')
                .populate('studentId', 'fullName studentCode status gender currentAgeGroup')
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 })
                .lean(),
            UserModel.countDocuments(filter),
        ]);

        return {
            parents,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit),
            },
        };
    } catch (error) {
        console.error('❌ [ParentManagement getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách phụ huynh');
    }
};

/**
 * =========================================================
 * ✅ GET PARENT DETAILS
 * =========================================================
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const parent = await UserModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('-password')
            .populate('studentId', 'fullName studentCode status gender currentAgeGroup birthDate')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        return parent;
    } catch (error) {
        console.error('❌ [ParentManagement getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin phụ huynh');
    }
};

/**
 * =========================================================
 * ✅ UPDATE PARENT
 * =========================================================
 */
const update = async (id, data, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        const parent = await UserModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            role: 'phu_huynh',
            _destroy: false,
        });

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phụ huynh');
        }

        // ✅ Kiểm tra email nếu thay đổi
        if (data.email && data.email !== parent.email) {
            const existingEmail = await UserModel.findOne({
                email: data.email,
                schoolId: user.schoolId,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingEmail) {
                throw new ApiError(StatusCodes.CONFLICT, 'Email đã được sử dụng');
            }
        }

        // ✅ Không cho phép thay đổi: userId, username, schoolId, password, studentId, role
        delete data.userId;
        delete data.username;
        delete data.schoolId;
        delete data.password;
        delete data.studentId; // ✅ Không cho đổi học sinh liên kết
        delete data.role;

        // ✅ Allowed fields to update
        const allowedFields = ['fullName', 'gender', 'email', 'phone', 'status'];
        const updateData = {};

        allowedFields.forEach((field) => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });

        const updatedParent = await UserModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .select('-password')
            .populate('studentId', 'fullName studentCode status gender currentAgeGroup');

        return updatedParent;
    } catch (error) {
        console.error('❌ [ParentManagement update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật thông tin phụ huynh');
    }
};

/**
 * =========================================================
 * ✅ DELETE PARENT
 * =========================================================
 */
const deleteParent = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        const parent = await UserModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            role: 'phu_huynh',
            _destroy: false,
        });

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phụ huynh');
        }

        // Soft delete
        // await UserModel.findByIdAndUpdate(id, { _destroy: true });

        // ❌ XÓA CỨNG KHỎI DATABASE
        await UserModel.deleteOne({ _id: id });

        return { message: 'Xóa tài khoản phụ huynh thành công' };
    } catch (error) {
        console.error('❌ [ParentManagement delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa tài khoản phụ huynh');
    }
};

/**
 * =========================================================
 * ✅ DELETE MANY PARENTS
 * =========================================================
 */
const deleteManyParents = async (ids, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        const parents = await UserModel.find({
            _id: { $in: ids },
            schoolId: user.schoolId,
            role: 'phu_huynh',
        }).select('_id');

        if (parents.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phụ huynh nào');
        }

        // ❌ XÓA CỨNG KHỎI DATABASE
        const result = await UserModel.deleteMany({
            _id: { $in: ids },
            schoolId: user.schoolId, // Thêm điều kiện này để chắc chắn an toàn 100%
        });

        return {
            message: `Đã xóa vĩnh viễn ${result.deletedCount} tài khoản phụ huynh`,
            deletedCount: result.deletedCount,
        };
    } catch (error) {
        console.error('❌ [ParentManagement deleteMany] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa nhiều tài khoản phụ huynh');
    }
};

/**
 * =========================================================
 * ✅ GET AVAILABLE STUDENTS (Học sinh chưa có tài khoản phụ huynh)
 * =========================================================
 */
const getAvailableStudents = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        checkPermission(user);

        // ✅ Parse pagination params
        const { page = 1, limit = 10, search = '' } = query;
        const skip = (page - 1) * limit;

        // ✅ Lấy danh sách studentId đã có tài khoản phụ huynh
        const existingParents = await UserModel.find({
            schoolId: user.schoolId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('studentId')
            .lean();

        const existingStudentIds = existingParents.map((p) => p.studentId?.toString()).filter(Boolean);

        // ✅ Build filter
        const filter = {
            schoolId: user.schoolId,
            status: 'Đang học',
            _destroy: false,
            _id: { $nin: existingStudentIds },
        };

        // ✅ Search by fullName or studentCode
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { fullName: searchRegex },
                { fullNameWithoutAccent: searchRegex },
                { studentCode: searchRegex },
            ];
        }

        // ✅ Parallel query with pagination
        const [students, total] = await Promise.all([
            ChildrenManagementModel.find(filter)
                .select('fullName studentCode gender currentAgeGroup birthDate') // ✅ Thêm birthDate
                .sort({ fullName: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            ChildrenManagementModel.countDocuments(filter),
        ]);

        console.log(`✅ [ParentManagement getAvailableStudents] Found: ${students.length}/${total} students`);

        return {
            students,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit),
            },
        };
    } catch (error) {
        console.error('❌ [ParentManagement getAvailableStudents] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách học sinh');
    }
};

export const parentManagementServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteParent,
    deleteManyParents,
    getAvailableStudents,
};

import { UserModel } from '~/models/userModel.js';
import { SchoolModel } from '~/models/schoolModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { removeVietnameseTones } from '~/utils/formatters.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { ClassModel } from '~/models/classModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';

/**
 * ✅ Kiểm tra user có đang được sử dụng trong năm học active không
 */
const checkUserInUse = async (userId, schoolId) => {
    try {
        // Lấy năm học đang active
        const activeYear = await AcademicYearModel.findOne({
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            return { inUse: false };
        }

        // ✅ Kiểm tra trong Tổ bộ môn
        const departmentUsage = await DepartmentModel.findOne({
            schoolId,
            academicYearId: activeYear._id,
            managers: userId,
            _destroy: false,
        }).select('name');

        if (departmentUsage) {
            return {
                inUse: true,
                type: 'department',
                name: departmentUsage.name,
                message: `Cán bộ đang được phân công trong tổ bộ môn "${departmentUsage.name}" của năm học ${activeYear.fromYear}-${activeYear.toYear}`,
            };
        }

        // ✅ Kiểm tra làm giáo viên chủ nhiệm
        const classUsage = await ClassModel.findOne({
            schoolId,
            academicYearId: activeYear._id,
            homeRoomTeacher: userId,
            _destroy: false,
        }).select('name');

        if (classUsage) {
            return {
                inUse: true,
                type: 'class',
                name: classUsage.name,
                message: `Giáo viên đang làm chủ nhiệm lớp "${classUsage.name}" của năm học ${activeYear.fromYear}-${activeYear.toYear}`,
            };
        }

        return { inUse: false };
    } catch (error) {
        console.error('❌ Error checking user in use:', error);
        return { inUse: false };
    }
};

// ✅ Hàm tạo username tự động
const generateUsername = (abbreviation, fullName) => {
    const namePart = removeVietnameseTones(fullName).toLowerCase().replace(/\s+/g, ''); // Xóa khoảng trắng

    return `${abbreviation}.${namePart}`;
};

// ✅ Hàm đảm bảo username unique
const ensureUniqueUsername = async (baseUsername) => {
    let username = baseUsername;
    let counter = 0;

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

const createNew = async (data, schoolScope) => {
    try {
        console.log('📥 [UserManagement createNew] Starting:', { data, schoolScope }); // ✅ ADD DEBUG

        // ✅ Kiểm tra schoolScope
        if (!schoolScope || !schoolScope.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Không xác định được trường học');
        }

        // ✅ Tự động gán schoolId từ scope
        data.schoolId = schoolScope.schoolId;

        // ✅ KHÔNG cho phép tạo Ban giám hiệu nếu không phải root
        if (data.role === 'ban_giam_hieu') {
            const requestUser = await UserModel.findById(schoolScope.userId);

            // Chỉ BGH root mới được tạo BGH
            if (!requestUser.isRoot || requestUser.role !== 'ban_giam_hieu') {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Chỉ Ban giám hiệu Root mới có thể tạo tài khoản Ban giám hiệu',
                );
            }
        }

        // ✅ Validate họ tên (bắt buộc)
        if (!data.fullName || !data.fullName.trim()) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Họ tên là bắt buộc');
        }

        // ✅ Lấy thông tin trường để tạo username
        const school = await SchoolModel.findOne({
            schoolId: schoolScope.schoolId,
            _destroy: false,
        });

        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trường học');
        }

        // ✅ Tạo username tự động: abbreviation.hovaten
        const baseUsername = generateUsername(school.abbreviation, data.fullName);
        const username = await ensureUniqueUsername(baseUsername);

        // Kiểm tra email đã tồn tại (nếu có)
        if (data.email) {
            const existingEmail = await UserModel.findOne({
                email: data.email,
                schoolId: schoolScope.schoolId,
                _destroy: false,
            });

            if (existingEmail) {
                throw new ApiError(StatusCodes.CONFLICT, 'Email đã được sử dụng trong trường này');
            }
        }

        // Tạo userId tự động
        const userId = await UserModel.generateUserId();

        // Mật khẩu mặc định
        const password = '123456';

        const newUser = new UserModel({
            ...data,
            userId,
            username,
            password,
            schoolId: schoolScope.schoolId,
        });

        const savedUser = await newUser.save();

        // Trả về user không có password
        const userObject = savedUser.toObject();
        delete userObject.password;

        console.log('✅ [UserManagement createNew] Success:', userObject._id);
        return userObject;
    } catch (error) {
        console.error('❌ [UserManagement createNew] Error:', error); // ✅ ADD DEBUG
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo người dùng mới');
    }
};

const getAll = async (query, schoolScope) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = query;
        const skip = (page - 1) * limit;

        // ✅ Filter cơ bản
        const filter = {
            _destroy: false,
            role: { $ne: 'admin' }, // Không hiển thị admin
        };

        // ✅ Chỉ lấy user cùng trường
        if (schoolScope && schoolScope.role !== 'admin') {
            filter.schoolId = schoolScope.schoolId;
            // ✅ UPDATED: Loại bỏ phụ huynh khỏi danh sách
            filter.role = { $ne: 'phu_huynh' };
        }

        // Tìm kiếm
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        // Lọc theo role
        if (role) {
            filter.role = role;
        }

        // Lọc theo status
        if (status !== '') {
            filter.status = status === 'true';
        }

        const users = await UserModel.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await UserModel.countDocuments(filter);

        return {
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách người dùng');
    }
};

const getDetails = async (id) => {
    try {
        const user = await UserModel.findOne({ _id: id, _destroy: false }).select('-password');
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }
        return user;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin người dùng');
    }
};

const update = async (id, data, schoolScope) => {
    try {
        const user = await UserModel.findOne({ _id: id, _destroy: false });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        // ✅ KIỂM TRA NẾU THAY ĐỔI VAI TRÒ
        if (data.role && data.role !== user.role) {
            console.log('🔄 [UserManagement update] Attempting to change role:', {
                oldRole: user.role,
                newRole: data.role,
            });

            // ✅ Kiểm tra user có đang được sử dụng không
            const usageCheck = await checkUserInUse(id, user.schoolId);

            if (usageCheck.inUse) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    `Không thể thay đổi vai trò! ${usageCheck.message}. Vui lòng xóa khỏi ${usageCheck.type === 'department' ? 'tổ bộ môn' : 'lớp học'} trước.`,
                );
            }
        }

        // ✅ FIX: Kiểm tra BGH - CHO PHÉP TỰ CẬP NHẬT THÔNG TIN CÁ NHÂN
        if (user.role === 'ban_giam_hieu') {
            const requestUser = await UserModel.findById(schoolScope.userId);
            const isSelf = requestUser._id.toString() === id;

            // ✅ Nếu KHÔNG phải tự update mình
            if (!isSelf) {
                if (schoolScope.role !== 'admin' && (!requestUser.isRoot || requestUser.role !== 'ban_giam_hieu')) {
                    throw new ApiError(
                        StatusCodes.FORBIDDEN,
                        'Chỉ Ban giám hiệu Root mới có thể cập nhật tài khoản Ban giám hiệu khác',
                    );
                }
            }

            // ✅ BGH root không thể tự bỏ quyền root của mình
            if (isSelf && requestUser.isRoot && data.isRoot === false) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể tự bỏ quyền Root của chính mình');
            }

            // ✅ BGH thường không thể tự nâng cấp lên root
            if (isSelf && !requestUser.isRoot && data.isRoot === true) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền tự nâng cấp lên Root');
            }

            // ✅ BGH thường không thể tự đổi role của mình
            if (isSelf && !requestUser.isRoot && data.role && data.role !== user.role) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thay đổi vai trò của chính mình');
            }
        }

        // ✅ Không cho phép đổi role thành ban_giam_hieu nếu không phải root
        if (data.role === 'ban_giam_hieu' && user.role !== 'ban_giam_hieu') {
            const requestUser = await UserModel.findById(schoolScope.userId);

            if (!requestUser.isRoot || requestUser.role !== 'ban_giam_hieu') {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Chỉ Ban giám hiệu Root mới có thể thay đổi vai trò thành Ban giám hiệu',
                );
            }
        }

        // Kiểm tra email nếu thay đổi
        if (data.email && data.email !== user.email) {
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

        // ✅ Không cho phép thay đổi userId, username, schoolId, password
        delete data.userId;
        delete data.username;
        delete data.schoolId;
        if (data.password) {
            delete data.password;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).select('-password');

        return updatedUser;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật người dùng');
    }
};

const deleteUser = async (id, schoolScope) => {
    try {
        const user = await UserModel.findOne({ _id: id, _destroy: false });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        // ✅ KIỂM TRA USER CÓ ĐANG ĐƯỢC SỬ DỤNG KHÔNG
        const usageCheck = await checkUserInUse(id, user.schoolId);

        if (usageCheck.inUse) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                `Không thể xóa! ${usageCheck.message}. Vui lòng xóa khỏi ${usageCheck.type === 'department' ? 'tổ bộ môn' : 'lớp học'} trước.`,
            );
        }

        // ✅ Không cho phép BGH thường xóa BGH
        if (user.role === 'ban_giam_hieu') {
            const requestUser = await UserModel.findById(schoolScope.userId);

            if (!requestUser.isRoot || requestUser.role !== 'ban_giam_hieu') {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Chỉ Ban giám hiệu Root mới có thể xóa tài khoản Ban giám hiệu',
                );
            }

            if (requestUser.isRoot && requestUser._id.toString() === id) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể tự xóa tài khoản Root của chính mình');
            }
        }

        // Hard delete - xóa vĩnh viễn
        await UserModel.findByIdAndDelete(id);

        return { message: 'Xóa người dùng thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa người dùng');
    }
};

const deleteManyUsers = async (ids, schoolScope) => {
    try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Danh sách ID không hợp lệ');
        }

        const filter = {
            _id: { $in: ids },
            _destroy: false,
            schoolId: schoolScope.schoolId,
        };

        const users = await UserModel.find(filter);

        if (users.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng nào để xóa');
        }

        const requestUser = await UserModel.findById(schoolScope.userId);

        // ✅ Kiểm tra từng user
        for (const user of users) {
            // ✅ KIỂM TRA USER CÓ ĐANG ĐƯỢC SỬ DỤNG KHÔNG
            const usageCheck = await checkUserInUse(user._id.toString(), user.schoolId);

            if (usageCheck.inUse) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    `Không thể xóa "${user.fullName}" (${user.username})! ${usageCheck.message}. Vui lòng xóa khỏi ${usageCheck.type === 'department' ? 'tổ bộ môn' : 'lớp học'} trước.`,
                );
            }

            // ✅ Không cho phép BGH thường xóa BGH
            if (user.role === 'ban_giam_hieu') {
                if (!requestUser.isRoot || requestUser.role !== 'ban_giam_hieu') {
                    throw new ApiError(
                        StatusCodes.FORBIDDEN,
                        `Chỉ Ban giám hiệu Root mới có thể xóa: ${user.fullName} (${user.username})`,
                    );
                }

                if (requestUser._id.toString() === user._id.toString()) {
                    throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể tự xóa tài khoản của chính mình');
                }
            }
        }

        // Soft delete
        const result = await UserModel.deleteMany({
            _id: { $in: ids },
            schoolId: schoolScope.schoolId,
        });

        return { message: `Đã xóa thành công ${result.deletedCount} người dùng` };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa nhiều người dùng');
    }
};

const changePassword = async (id, currentPassword, newPassword) => {
    try {
        const user = await UserModel.findOne({ _id: id, _destroy: false });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            // ✅ Đổi từ UNAUTHORIZED (401) sang BAD_REQUEST (400)
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Mật khẩu hiện tại không chính xác');
        }

        // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
        const isSameAsOld = await user.comparePassword(newPassword);
        if (isSameAsOld) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Mật khẩu mới không được trùng với mật khẩu hiện tại');
        }

        // Cập nhật mật khẩu mới
        user.password = newPassword;
        await user.save();

        return { message: 'Đổi mật khẩu thành công' };
    } catch (error) {
        // ✅ Log chi tiết lỗi để debug
        console.error('❌ Error in changePassword service:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đổi mật khẩu');
    }
};

export const userManagementServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteUser,
    deleteManyUsers,
    changePassword,
    checkUserInUse,
};

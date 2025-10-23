import { UserModel } from '~/models/userModel';
import { SchoolModel } from '~/models/schoolModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { removeVietnameseTones } from '~/utils/formatters';

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

        return userObject;
    } catch (error) {
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

        // ✅ FIX: Kiểm tra BGH - CHO PHÉP TỰ CẬP NHẬT THÔNG TIN CÁ NHÂN
        if (user.role === 'ban_giam_hieu') {
            const requestUser = await UserModel.findById(schoolScope.userId);
            const isSelf = requestUser._id.toString() === id; // ✅ Kiểm tra có phải tự update mình không

            // ✅ Nếu KHÔNG phải tự update mình
            if (!isSelf) {
                // Chỉ admin hoặc BGH root mới được update BGH khác
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
        delete data.username; // ✅ Username không bao giờ đổi
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

        // ✅ Không cho phép BGH thường xóa BGH
        if (user.role === 'ban_giam_hieu') {
            const requestUser = await UserModel.findById(schoolScope.userId);

            // Chỉ BGH root mới được xóa BGH
            if (!requestUser.isRoot || requestUser.role !== 'ban_giam_hieu') {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Chỉ Ban giám hiệu Root mới có thể xóa tài khoản Ban giám hiệu',
                );
            }

            // Không cho phép BGH root tự xóa mình
            if (requestUser.isRoot && requestUser._id.toString() === id) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể tự xóa tài khoản Root của chính mình');
            }
        }

        // Soft delete
        await UserModel.findByIdAndUpdate(id, { _destroy: true });

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

        // ✅ Filter: chỉ xóa user cùng trường
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

        // Kiểm tra từng user
        for (const user of users) {
            // ✅ Không cho phép BGH thường xóa BGH
            if (user.role === 'ban_giam_hieu') {
                if (!requestUser.isRoot || requestUser.role !== 'ban_giam_hieu') {
                    throw new ApiError(
                        StatusCodes.FORBIDDEN,
                        `Chỉ Ban giám hiệu Root mới có thể xóa: ${user.fullName} (${user.username})`,
                    );
                }

                // Không cho phép tự xóa mình
                if (requestUser._id.toString() === user._id.toString()) {
                    throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể tự xóa tài khoản của chính mình');
                }
            }
        }

        // Soft delete
        const result = await UserModel.updateMany(filter, { _destroy: true });

        return { message: `Đã xóa thành công ${result.modifiedCount} người dùng` };
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
};

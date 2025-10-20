import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

const createNew = async (data) => {
    try {
        // Kiểm tra username đã tồn tại chưa
        const existingUser = await UserModel.findOne({
            username: data.username,
            _destroy: false,
        });

        if (existingUser) {
            throw new ApiError(StatusCodes.CONFLICT, 'Tên tài khoản đã tồn tại');
        }

        // Kiểm tra email đã tồn tại (nếu có)
        if (data.email) {
            const existingEmail = await UserModel.findOne({
                email: data.email,
                _destroy: false,
            });

            if (existingEmail) {
                throw new ApiError(StatusCodes.CONFLICT, 'Email đã được sử dụng');
            }
        }

        // Tạo userId tự động
        const userId = await UserModel.generateUserId();

        // Mật khẩu mặc định là 123456 nếu không được cung cấp
        const password = data.password || '123456';

        const newUser = new UserModel({
            ...data,
            userId,
            password,
        });

        const savedUser = await newUser.save();

        // Trả về user mà không có password
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

const getAll = async (query) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false };

        // Tìm kiếm theo tất cả các trường: username, fullName, email, phone, gender
        if (search) {
            const searchConditions = [
                { username: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { gender: { $regex: search, $options: 'i' } },
            ];

            filter.$or = searchConditions;
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

const update = async (id, data) => {
    try {
        const user = await UserModel.findOne({ _id: id, _destroy: false });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        // Kiểm tra username nếu thay đổi
        if (data.username && data.username !== user.username) {
            const existingUser = await UserModel.findOne({
                username: data.username,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingUser) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên tài khoản đã tồn tại');
            }
        }

        // Kiểm tra email nếu thay đổi
        if (data.email && data.email !== user.email) {
            const existingEmail = await UserModel.findOne({
                email: data.email,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingEmail) {
                throw new ApiError(StatusCodes.CONFLICT, 'Email đã được sử dụng');
            }
        }

        // Không cho phép thay đổi userId và password qua API update này
        delete data.userId;
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

const deleteUser = async (id) => {
    try {
        const user = await UserModel.findOne({ _id: id, _destroy: false });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        // Soft delete - chỉ đánh dấu _destroy: true
        await UserModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa người dùng thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa người dùng');
    }
};

const deleteManyUsers = async (ids) => {
    try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Danh sách ID không hợp lệ');
        }

        const result = await UserModel.updateMany({ _id: { $in: ids }, _destroy: false }, { _destroy: true });

        if (result.modifiedCount === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng nào để xóa');
        }

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
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đổi mật khẩu');
    }
};

// const resetPassword = async (id) => {
//     try {
//         const user = await UserModel.findOne({ _id: id, _destroy: false });
//         if (!user) {
//             throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
//         }

//         // Reset về mật khẩu mặc định 123456
//         user.password = '123456';
//         await user.save();

//         return { message: 'Reset mật khẩu thành công. Mật khẩu mới: 123456' };
//     } catch (error) {
//         if (error instanceof ApiError) throw error;
//         throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi reset mật khẩu');
//     }
// };

export const userManagementServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteUser,
    deleteManyUsers,
    changePassword,
    // resetPassword,
};

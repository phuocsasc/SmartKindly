import { UserModel } from '~/models/userModel';
import { SchoolModel } from '~/models/schoolModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { removeVietnameseTones } from '~/utils/formatters';

const createNew = async (data) => {
    try {
        // Kiểm tra trường học có tồn tại không
        const school = await SchoolModel.findOne({
            schoolId: data.schoolId,
            _destroy: false,
        });

        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy trường học');
        }

        // ✅ FIX: Chỉ kiểm tra isRoot khi role là ban_giam_hieu
        if (data.role === 'ban_giam_hieu' && data.isRoot === true) {
            const existingRoot = await UserModel.findOne({
                schoolId: data.schoolId,
                role: 'ban_giam_hieu',
                isRoot: true,
                _destroy: false,
            });

            if (existingRoot) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    `Trường này đã có Ban giám hiệu root: ${existingRoot.fullName} (${existingRoot.username})`,
                );
            }
        }

        // ✅ FIX: Tự động set isRoot = false nếu role không phải ban_giam_hieu
        const isRoot = data.role === 'ban_giam_hieu' ? data.isRoot || false : false;

        // Tạo userId tự động (8 chữ số random)
        const userId = await UserModel.generateUserId();

        // Tạo username tự động: abbreviation.hovaten
        const baseUsername = generateUsername(school.abbreviation, data.fullName);
        const username = await ensureUniqueUsername(baseUsername);

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

        // Mật khẩu mặc định
        const password = '123456';

        const newUser = new UserModel({
            ...data,
            userId,
            username,
            password,
            schoolId: school.schoolId,
            isRoot, // ✅ Sử dụng giá trị đã xử lý
        });

        const savedUser = await newUser.save();

        // Populate school info
        const userWithSchool = await UserModel.findById(savedUser._id).select('-password').lean();

        // Lấy school info
        const schoolInfo = await SchoolModel.findOne({
            schoolId: userWithSchool.schoolId,
            _destroy: false,
        }).select('name abbreviation address');

        return {
            ...userWithSchool,
            school: schoolInfo || null,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo người dùng mới');
    }
};

const getAll = async (query) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '', schoolId = '' } = query;
        const skip = (page - 1) * limit;

        // ✅ Luôn loại trừ admin khỏi danh sách
        const filter = {
            _destroy: false,
            role: { $ne: 'admin' }, // ✅ Không lấy user có role admin
        };

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

        // Lọc theo schoolId
        if (schoolId) {
            filter.schoolId = schoolId;
        }

        const users = await UserModel.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Populate school info cho từng user
        const usersWithSchool = await Promise.all(
            users.map(async (user) => {
                const school = await SchoolModel.findOne({
                    schoolId: user.schoolId,
                    _destroy: false,
                }).select('name abbreviation address');

                return {
                    ...user,
                    school: school || null,
                };
            }),
        );

        const total = await UserModel.countDocuments(filter);

        return {
            users: usersWithSchool,
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
        const user = await UserModel.findOne({ _id: id, _destroy: false }).select('-password').lean();

        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        // Populate school info
        const school = await SchoolModel.findOne({
            schoolId: user.schoolId,
            _destroy: false,
        }).select('name abbreviation address');

        return {
            ...user,
            school: school || null,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin người dùng');
    }
};

const update = async (id, data, requestUser) => {
    try {
        const user = await UserModel.findOne({ _id: id, _destroy: false });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        // Nếu user là ban_giam_hieu có isRoot = true
        // Chỉ root hoặc admin mới được update
        if (user.role === 'ban_giam_hieu' && user.isRoot === true) {
            const requestUserDoc = await UserModel.findById(requestUser.id);
            if (!requestUserDoc || requestUserDoc.role !== 'admin') {
                if (!requestUserDoc.isRoot || requestUserDoc.schoolId !== user.schoolId) {
                    throw new ApiError(
                        StatusCodes.FORBIDDEN,
                        'Chỉ Ban giám hiệu root hoặc admin mới có thể cập nhật tài khoản này',
                    );
                }
            }
        }

        // ✅ FIX: Kiểm tra isRoot chỉ khi role mới là ban_giam_hieu
        if (data.role === 'ban_giam_hieu' && data.isRoot === true && !user.isRoot) {
            const existingRoot = await UserModel.findOne({
                schoolId: user.schoolId,
                role: 'ban_giam_hieu',
                isRoot: true,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingRoot) {
                throw new ApiError(
                    StatusCodes.CONFLICT,
                    `Trường này đã có Ban giám hiệu root: ${existingRoot.fullName}`,
                );
            }
        }

        // ✅ FIX: Tự động set isRoot = false nếu role không phải ban_giam_hieu
        if (data.role && data.role !== 'ban_giam_hieu') {
            data.isRoot = false;
        }

        // ✅ FIX: Không cho phép thay đổi username, userId, schoolId, password
        delete data.username;
        delete data.userId;
        delete data.schoolId; // ✅ Xóa schoolId từ data update
        delete data.password;

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

        const updatedUser = await UserModel.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        })
            .select('-password')
            .lean();

        // Populate school info
        const school = await SchoolModel.findOne({
            schoolId: updatedUser.schoolId,
            _destroy: false,
        }).select('name abbreviation address');

        return {
            ...updatedUser,
            school: school || null,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật người dùng');
    }
};

const deleteUser = async (id, requestUser) => {
    try {
        const user = await UserModel.findOne({ _id: id, _destroy: false });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        // Không cho phép xóa admin
        if (user.role === 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể xóa tài khoản admin hệ thống');
        }

        // Nếu user là ban_giam_hieu có isRoot = true
        // Chỉ admin mới được xóa
        if (user.role === 'ban_giam_hieu' && user.isRoot === true) {
            const requestUserDoc = await UserModel.findById(requestUser.id);
            if (!requestUserDoc || requestUserDoc.role !== 'admin') {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể xóa Ban giám hiệu root. Chỉ admin mới có quyền.');
            }
        }

        // Nếu user là ban_giam_hieu thường, kiểm tra quyền
        if (user.role === 'ban_giam_hieu' && !user.isRoot) {
            const requestUserDoc = await UserModel.findById(requestUser.id);
            // Chỉ root của cùng trường hoặc admin mới được xóa
            if (requestUserDoc.role !== 'admin') {
                if (!requestUserDoc.isRoot || requestUserDoc.schoolId !== user.schoolId) {
                    throw new ApiError(
                        StatusCodes.FORBIDDEN,
                        'Chỉ Ban giám hiệu root hoặc admin mới có thể xóa tài khoản này',
                    );
                }
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

// Helper function: Generate username
const generateUsername = (abbreviation, fullName) => {
    const namePart = removeVietnameseTones(fullName).toLowerCase().replace(/\s+/g, ''); // Xóa khoảng trắng

    return `${abbreviation}.${namePart}`;
};

// Helper function: Ensure unique username
const ensureUniqueUsername = async (baseUsername) => {
    let username = baseUsername;
    let counter = 0;

    while (await UserModel.findOne({ username, _destroy: false })) {
        const randomNum = Math.floor(10 + Math.random() * 90); // Random 2 chữ số
        username = `${baseUsername}${randomNum}`;
        counter++;

        // Tránh vòng lặp vô hạn
        if (counter > 100) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Không thể tạo username duy nhất');
        }
    }

    return username;
};
// ✅ Xóa nhiều người dùng
const deleteManyUsers = async (ids, requestUser) => {
    try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Danh sách ID không hợp lệ');
        }

        // Lấy danh sách users cần xóa
        const users = await UserModel.find({ _id: { $in: ids }, _destroy: false });

        if (users.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng nào để xóa');
        }

        const requestUserDoc = await UserModel.findById(requestUser.id);
        const isAdmin = requestUserDoc?.role === 'admin';

        // Kiểm tra quyền xóa từng user
        for (const user of users) {
            // Không cho phép xóa admin
            if (user.role === 'admin') {
                throw new ApiError(StatusCodes.FORBIDDEN, `Không thể xóa tài khoản admin hệ thống: ${user.username}`);
            }

            // Nếu user là ban_giam_hieu có isRoot = true
            // Chỉ admin mới được xóa
            if (user.role === 'ban_giam_hieu' && user.isRoot === true) {
                if (!isAdmin) {
                    throw new ApiError(
                        StatusCodes.FORBIDDEN,
                        `Không thể xóa Ban giám hiệu root: ${user.fullName} (${user.username}). Chỉ admin mới có quyền.`,
                    );
                }
            }

            // Nếu user là ban_giam_hieu thường, kiểm tra quyền
            if (user.role === 'ban_giam_hieu' && !user.isRoot) {
                if (!isAdmin) {
                    if (!requestUserDoc.isRoot || requestUserDoc.schoolId !== user.schoolId) {
                        throw new ApiError(
                            StatusCodes.FORBIDDEN,
                            `Chỉ Ban giám hiệu root hoặc admin mới có thể xóa: ${user.fullName} (${user.username})`,
                        );
                    }
                }
            }
        }

        // Soft delete tất cả users đã validate
        const result = await UserModel.updateMany({ _id: { $in: ids }, _destroy: false }, { _destroy: true });

        return { message: `Đã xóa thành công ${result.modifiedCount} người dùng` };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa nhiều người dùng');
    }
};

export const adminUserManagementServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteUser,
    deleteManyUsers, // ✅ Export thêm
};

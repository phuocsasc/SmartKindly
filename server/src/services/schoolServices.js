import { SchoolModel } from '~/models/schoolModel.js';
import { slugify } from '~/utils/formatters.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { UserModel } from '~/models/userModel.js';

const createNew = async (data) => {
    try {
        // Kiểm tra tên trường đã tồn tại chưa
        const existingSchool = await SchoolModel.findOne({
            name: data.name,
            _destroy: false,
        });

        if (existingSchool) {
            throw new ApiError(StatusCodes.CONFLICT, 'Tên trường học đã tồn tại');
        }

        // Kiểm tra tên viết tắt đã tồn tại chưa
        const existingAbbreviation = await SchoolModel.findOne({
            abbreviation: data.abbreviation.toUpperCase(),
            _destroy: false,
        });

        if (existingAbbreviation) {
            throw new ApiError(StatusCodes.CONFLICT, 'Tên viết tắt đã được sử dụng');
        }

        // Tạo schoolId tự động
        const schoolId = await SchoolModel.generateSchoolId();

        // Tạo slug và kiểm tra unique
        let baseSlug = slugify(data.name);
        let slug = baseSlug;
        let counter = 1;

        while (await SchoolModel.findOne({ slug, _destroy: false })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const newSchool = new SchoolModel({
            ...data,
            schoolId,
            slug,
            abbreviation: data.abbreviation.toUpperCase(),
        });

        return await newSchool.save();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo trường học mới');
    }
};

const getAll = async (query) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false };

        // Tìm kiếm theo tên trường, địa chỉ, mã trường, tên viết tắt
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { schoolId: { $regex: search, $options: 'i' } },
                { abbreviation: { $regex: search, $options: 'i' } },
                { manager: { $regex: search, $options: 'i' } },
            ];
        }

        // Lọc theo trạng thái
        if (status) {
            filter.status = status;
        }

        const schools = await SchoolModel.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

        const total = await SchoolModel.countDocuments(filter);

        return {
            schools,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách trường học');
    }
};

const getDetails = async (id) => {
    try {
        const school = await SchoolModel.findOne({ _id: id, _destroy: false });
        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy trường học');
        }
        return school;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin trường học');
    }
};

const update = async (id, data) => {
    try {
        const school = await SchoolModel.findOne({ _id: id, _destroy: false });
        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy trường học');
        }

        // ✅ Kiểm tra nếu status thay đổi
        const isStatusChanged = 'status' in data && school.status !== data.status;
        const oldStatus = school.status;
        const newStatus = data.status;

        // Kiểm tra tên trường đã tồn tại (trừ chính nó)
        if (data.name) {
            const existingSchool = await SchoolModel.findOne({
                name: data.name,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingSchool) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên trường học đã tồn tại');
            }

            // Tạo slug mới
            let baseSlug = slugify(data.name);
            let slug = baseSlug;
            let counter = 1;

            while (await SchoolModel.findOne({ slug, _id: { $ne: id }, _destroy: false })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            data.slug = slug;
        }

        // Kiểm tra tên viết tắt đã tồn tại (trừ chính nó)
        if (data.abbreviation) {
            const existingAbbreviation = await SchoolModel.findOne({
                abbreviation: data.abbreviation.toUpperCase(),
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingAbbreviation) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên viết tắt đã được sử dụng');
            }

            data.abbreviation = data.abbreviation.toUpperCase();
        }

        // Không cho phép thay đổi schoolId
        delete data.schoolId;

        const updatedSchool = await SchoolModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        // ✅ Xử lý thay đổi status của users
        if (isStatusChanged) {
            console.log('🔄 [update] Trường thay đổi trạng thái:', {
                schoolId: school.schoolId,
                oldStatus,
                newStatus,
            });

            if (newStatus === false) {
                // ✅ Trường chuyển sang "Không hoạt động" → Vô hiệu hóa tất cả user
                console.log('⛔ [update] Vô hiệu hóa tất cả user của trường...');

                const updateResult = await UserModel.updateMany(
                    {
                        schoolId: school.schoolId,
                        _destroy: false,
                        role: { $ne: 'admin' }, // Không ảnh hưởng đến admin hệ thống
                    },
                    {
                        status: false,
                    },
                );

                console.log(`✅ [update] Đã vô hiệu hóa ${updateResult.modifiedCount} tài khoản`);
            } else if (newStatus === true) {
                // ✅ Trường chuyển sang "Hoạt động" → Kích hoạt lại tất cả user
                console.log('✅ [update] Kích hoạt lại tất cả user của trường...');

                const updateResult = await UserModel.updateMany(
                    {
                        schoolId: school.schoolId,
                        _destroy: false,
                        role: { $ne: 'admin' }, // Không ảnh hưởng đến admin hệ thống
                    },
                    {
                        status: true,
                    },
                );

                console.log(`✅ [update] Đã kích hoạt lại ${updateResult.modifiedCount} tài khoản`);
            }
        }

        return updatedSchool;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật trường học');
    }
};

const deleteSchool = async (id) => {
    try {
        const school = await SchoolModel.findOne({ _id: id, _destroy: false });
        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy trường học');
        }

        // ✅ Kiểm tra trường có đang hoạt động không (status === true)
        if (school.status === true) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Không thể xóa trường đang hoạt động. Vui lòng chuyển sang trạng thái "Không hoạt động" trước.',
            );
        }

        // Soft delete - chỉ đánh dấu _destroy: true
        await SchoolModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa trường học thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa trường học');
    }
};

// ✅ Thêm logging trong getBySchoolId
const getBySchoolId = async (schoolId) => {
    try {
        console.log('🔍 Service getBySchoolId - schoolId:', schoolId);

        const school = await SchoolModel.findOne({ schoolId, _destroy: false });

        if (!school) {
            console.log('❌ School not found with schoolId:', schoolId);
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trường học');
        }

        console.log('✅ School found:', school.name);
        return school;
    } catch (error) {
        console.error('❌ Error in getBySchoolId:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin trường học');
    }
};

// ✅ Thêm logging trong updateSchoolInfo
const updateSchoolInfo = async (schoolId, data, requestUser) => {
    try {
        console.log('🔍 Service updateSchoolInfo - schoolId:', schoolId);
        console.log('🔍 Request user:', requestUser);

        const school = await SchoolModel.findOne({ schoolId, _destroy: false });
        if (!school) {
            console.log('❌ School not found');
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trường học');
        }

        // ✅ Kiểm tra quyền: Chỉ BGH root mới được update
        const user = await UserModel.findById(requestUser.id);
        console.log('🔍 User check:', {
            exists: !!user,
            role: user?.role,
            // isRoot: user?.isRoot,
            userSchoolId: user?.schoolId,
            targetSchoolId: schoolId,
        });

        if (!user || user.role !== 'ban_giam_hieu' || user.schoolId !== schoolId) {
            console.log('❌ Permission denied');
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền cập nhật thông tin trường học');
        }

        // ✅ Không cho phép thay đổi status, abbreviation, schoolId
        delete data.status;
        delete data.abbreviation;
        delete data.schoolId;

        console.log('🔍 Data to update:', data);

        // Kiểm tra tên trường nếu thay đổi
        if (data.name && data.name !== school.name) {
            const existingName = await SchoolModel.findOne({
                name: data.name,
                _id: { $ne: school._id },
                _destroy: false,
            });

            if (existingName) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên trường học đã tồn tại');
            }

            // Tạo slug mới
            let baseSlug = slugify(data.name);
            let slug = baseSlug;
            let counter = 1;

            while (await SchoolModel.findOne({ slug, _id: { $ne: school._id }, _destroy: false })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            data.slug = slug;
        }

        const updatedSchool = await SchoolModel.findByIdAndUpdate(school._id, data, {
            new: true,
            runValidators: true,
        });

        console.log('✅ School updated successfully');
        return updatedSchool;
    } catch (error) {
        console.error('❌ Error in updateSchoolInfo:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật thông tin trường học');
    }
};

export const schoolServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteSchool,
    getBySchoolId, // ✅ Export thêm
    updateSchoolInfo, // ✅ Export thêm
};

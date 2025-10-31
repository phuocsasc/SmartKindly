// server/src/services/personnelRecordServices.js
import { PersonnelRecordModel } from '~/models/personnelRecordModel';
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

const createNew = async (data, userId) => {
    try {
        console.log('📥 [PersonnelRecord createNew] Starting with data:', data);

        // ✅ Lấy schoolId từ user
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schoolId = user.schoolId;

        // ✅ Kiểm tra email đã tồn tại chưa
        const existingEmail = await PersonnelRecordModel.findOne({
            schoolId,
            email: data.email.toLowerCase(),
            _destroy: false,
        });

        if (existingEmail) {
            throw new ApiError(StatusCodes.CONFLICT, 'Email đã tồn tại trong hệ thống');
        }

        // ✅ Kiểm tra CMND đã tồn tại chưa
        const existingIdCard = await PersonnelRecordModel.findOne({
            schoolId,
            idCardNumber: data.idCardNumber,
            _destroy: false,
        });

        if (existingIdCard) {
            throw new ApiError(StatusCodes.CONFLICT, 'Số CMND đã tồn tại trong hệ thống');
        }

        // ✅ Tạo personnelCode tự động
        const personnelCode = await PersonnelRecordModel.generatePersonnelCode(schoolId);

        // ✅ Tạo personnel record mới
        const newPersonnelRecord = new PersonnelRecordModel({
            personnelCode,
            schoolId,
            ...data,
            createdBy: userId,
        });

        const savedPersonnelRecord = await newPersonnelRecord.save();
        console.log('✅ [PersonnelRecord createNew] Created successfully');

        // ✅ Populate data để trả về
        const populatedRecord = await PersonnelRecordModel.findById(savedPersonnelRecord._id)
            .populate('createdBy', 'fullName username')
            .lean();

        return populatedRecord;
    } catch (error) {
        console.error('❌ [PersonnelRecord createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo hồ sơ cán bộ: ' + error.message);
    }
};

const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, search = '', department = '', workStatus = '', positionGroup = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false, schoolId: user.schoolId };

        // ✅ Text search
        if (search) {
            filter.$text = { $search: search };
        }

        if (department) filter.department = department;
        if (workStatus) filter.workStatus = workStatus;
        if (positionGroup) {
            filter.positionGroup = positionGroup;
        }

        // ✅ Parallel query
        const [records, total] = await Promise.all([
            PersonnelRecordModel.find(filter)
                .select('-_destroy')
                .populate('createdBy', 'fullName username')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),

            PersonnelRecordModel.countDocuments(filter),
        ]);

        return {
            records,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách hồ sơ cán bộ');
    }
};

const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const record = await PersonnelRecordModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('createdBy', 'fullName username')
            .lean();

        if (!record) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hồ sơ cán bộ');
        }

        return record;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin hồ sơ cán bộ');
    }
};

const update = async (id, data, userId) => {
    try {
        console.log('📝 [PersonnelRecord update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const record = await PersonnelRecordModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!record) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hồ sơ cán bộ');
        }

        // ✅ Kiểm tra email nếu thay đổi
        if (data.email && data.email.toLowerCase() !== record.email.toLowerCase()) {
            const existingEmail = await PersonnelRecordModel.findOne({
                schoolId: user.schoolId,
                email: data.email.toLowerCase(),
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingEmail) {
                throw new ApiError(StatusCodes.CONFLICT, 'Email đã tồn tại trong hệ thống');
            }
        }

        // ✅ Kiểm tra CMND nếu thay đổi
        if (data.idCardNumber && data.idCardNumber !== record.idCardNumber) {
            const existingIdCard = await PersonnelRecordModel.findOne({
                schoolId: user.schoolId,
                idCardNumber: data.idCardNumber,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingIdCard) {
                throw new ApiError(StatusCodes.CONFLICT, 'Số CMND đã tồn tại trong hệ thống');
            }
        }

        // ✅ Cập nhật
        const updatedRecord = await PersonnelRecordModel.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        })
            .populate('createdBy', 'fullName username')
            .lean();

        console.log('✅ [PersonnelRecord update] Updated successfully');

        return updatedRecord;
    } catch (error) {
        console.error('❌ [PersonnelRecord update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật hồ sơ cán bộ: ' + error.message);
    }
};

const deleteRecord = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const record = await PersonnelRecordModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!record) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hồ sơ cán bộ');
        }

        // Soft delete
        await PersonnelRecordModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa hồ sơ cán bộ thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa hồ sơ cán bộ');
    }
};

const importBulk = async (records, userId) => {
    try {
        console.log('📥 [importBulk Service] Starting with userId:', userId);
        console.log('📥 [importBulk Service] Records count:', records.length);

        // ✅ Kiểm tra userId
        if (!userId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'User ID không hợp lệ');
        }

        const user = await UserModel.findById(userId).select('schoolId');
        console.log('👤 [importBulk Service] User found:', user);

        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        console.log('🏫 [importBulk Service] School ID:', user.schoolId);

        let created = 0;
        let updated = 0;
        const errors = [];

        for (const [index, recordData] of records.entries()) {
            try {
                // ✅ Nếu có personnelCode → Cập nhật
                if (recordData.personnelCode && recordData.personnelCode.trim() !== '') {
                    const existing = await PersonnelRecordModel.findOne({
                        personnelCode: recordData.personnelCode,
                        schoolId: user.schoolId,
                        _destroy: false,
                    });

                    if (existing) {
                        Object.assign(existing, recordData);
                        await existing.save();
                        updated++;
                        console.log(`✅ [importBulk] Updated: ${recordData.personnelCode}`);
                    } else {
                        errors.push({
                            row: index + 6,
                            message: `Không tìm thấy mã cán bộ ${recordData.personnelCode}`,
                        });
                    }
                }
                // ✅ Nếu không có personnelCode → Tạo mới
                else {
                    // Check duplicate email
                    if (recordData.email) {
                        const existingEmail = await PersonnelRecordModel.findOne({
                            schoolId: user.schoolId,
                            email: recordData.email.toLowerCase(),
                            _destroy: false,
                        });
                        if (existingEmail) {
                            errors.push({ row: index + 6, message: `Email ${recordData.email} đã tồn tại` });
                            continue;
                        }
                    }

                    // Check duplicate idCard
                    if (recordData.idCardNumber) {
                        const existingIdCard = await PersonnelRecordModel.findOne({
                            schoolId: user.schoolId,
                            idCardNumber: recordData.idCardNumber,
                            _destroy: false,
                        });
                        if (existingIdCard) {
                            errors.push({
                                row: index + 6,
                                message: `CMND ${recordData.idCardNumber} đã tồn tại`,
                            });
                            continue;
                        }
                    }

                    // Generate personnelCode
                    const personnelCode = await PersonnelRecordModel.generatePersonnelCode(user.schoolId);

                    // Create new
                    await PersonnelRecordModel.create({
                        ...recordData,
                        personnelCode,
                        schoolId: user.schoolId,
                        createdBy: userId,
                    });
                    created++;
                    console.log(`✅ [importBulk] Created: ${recordData.fullName} (${personnelCode})`);
                }
            } catch (error) {
                console.error(`❌ [importBulk] Row ${index + 6} error:`, error.message);
                errors.push({ row: index + 6, message: error.message });
            }
        }

        console.log(`✅ [importBulk] Finished: ${created} created, ${updated} updated, ${errors.length} errors`);

        return { created, updated, errors };
    } catch (error) {
        console.error('❌ [importBulk Service] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi import dữ liệu: ' + error.message);
    }
};

export const personnelRecordServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteRecord,
    importBulk,
};

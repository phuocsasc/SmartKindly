import { ChildrenManagementModel } from '~/models/childrenManagementModel.js';
import { UserModel } from '~/models/userModel.js';
// import { AcademicYearModel } from '~/models/academicYearModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { removeVietnameseTones } from '~/utils/formatters.js';

/**
 * ✅ Helper: Tạo mã học sinh tự động (schoolId-HS000001)
 */
const generateStudentCode = async (schoolId) => {
    const prefix = `${schoolId}-HS`;

    try {
        const lastStudent = await ChildrenManagementModel.findOne({
            schoolId,
            studentCode: { $regex: `^${prefix}` },
        })
            .sort({ studentCode: -1 })
            .select('studentCode')
            .lean();

        let nextNumber = 1;
        if (lastStudent && lastStudent.studentCode) {
            const match = lastStudent.studentCode.match(/HS(\d+)$/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        const newCode = `${prefix}${nextNumber.toString().padStart(6, '0')}`;
        console.log('✅ [generateStudentCode] Generated:', newCode);
        return newCode;
    } catch (error) {
        console.error('❌ [generateStudentCode] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Không thể tạo mã học sinh');
    }
};

/**
 * ✅ Helper: Kiểm tra quyền (chỉ BGH mới được tạo/sửa/xóa)
 */
const checkPermission = (user) => {
    if (user.role !== 'ban_giam_hieu') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền thực hiện thao tác này');
    }
};

/**
 * ✅ Tạo trẻ mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [ChildrenManagement createNew] Starting');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được tạo
        checkPermission(user);

        // ✅ Tạo mã học sinh tự động
        const studentCode = await generateStudentCode(user.schoolId);

        // ✅ Tạo mới
        const newChild = new ChildrenManagementModel({
            ...data,
            schoolId: user.schoolId,
            studentCode,
            createdBy: userId,
            lastUpdatedBy: userId,
        });

        await newChild.save();

        const populated = await ChildrenManagementModel.findById(newChild._id)
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [ChildrenManagement createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [ChildrenManagement createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo thông tin trẻ: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách trẻ toàn trường
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, search = '', status = '', hasClass = '', ageGroup = '' } = query;

        const filter = {
            schoolId: user.schoolId,
            _destroy: false,
        };

        // ✅ Filter theo trạng thái
        if (status) {
            filter.status = status;
        }

        // ✅ Filter theo đã có lớp chưa
        if (hasClass !== '') {
            filter.hasClass = hasClass === 'true';
        }

        // ✅ Filter theo nhóm tuổi
        if (ageGroup) {
            filter.currentAgeGroup = ageGroup;
        }

        // ✅ Tìm kiếm theo tên hoặc mã học sinh
        if (search) {
            const searchNormalized = removeVietnameseTones(search.trim()).toLowerCase();
            filter.$or = [
                { fullNameWithoutAccent: { $regex: searchNormalized, $options: 'i' } },
                { studentCode: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [children, total] = await Promise.all([
            ChildrenManagementModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            ChildrenManagementModel.countDocuments(filter),
        ]);

        return {
            children,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit),
            },
        };
    } catch (error) {
        console.error('❌ [ChildrenManagement getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách trẻ');
    }
};

/**
 * ✅ Lấy chi tiết trẻ
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const child = await ChildrenManagementModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!child) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trẻ');
        }

        return child;
    } catch (error) {
        console.error('❌ [ChildrenManagement getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy chi tiết thông tin trẻ');
    }
};

/**
 * ✅ Cập nhật thông tin trẻ
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [ChildrenManagement update] Starting');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được cập nhật
        checkPermission(user);

        const child = await ChildrenManagementModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!child) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trẻ');
        }

        // ✅ Cập nhật các field được phép
        const allowedFields = [
            'fullName',
            'nickname',
            'birthDate',
            'gender',
            'ethnicity',
            'enrollmentDate',
            'currentAgeGroup',
            'status',
            'motherName',
            'motherBirthYear',
            'motherPhone',
            'motherEmail',
            'fatherName',
            'fatherBirthYear',
            'fatherPhone',
            'fatherEmail',
            'permanentAddress',
            'currentAddress',
        ];

        allowedFields.forEach((field) => {
            if (data[field] !== undefined) {
                child[field] = data[field];
            }
        });

        child.lastUpdatedBy = userId;
        await child.save();

        const updated = await ChildrenManagementModel.findById(child._id)
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [ChildrenManagement update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [ChildrenManagement update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật thông tin trẻ');
    }
};

/**
 * ✅ Xóa 1 trẻ (chỉ cho phép xóa trẻ có trạng thái "Nghỉ học")
 */
const deleteChild = async (id, userId) => {
    try {
        console.log('🗑️ [ChildrenManagement delete] Starting');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được xóa
        checkPermission(user);

        const child = await ChildrenManagementModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!child) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trẻ');
        }

        // ✅ Chỉ cho phép xóa trẻ có trạng thái "Nghỉ học"
        if (child.status === 'Đang học') {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                `Không thể xóa trẻ "${child.fullName}" đang có trạng thái "Đang học". Vui lòng chuyển sang trạng thái "Nghỉ học" trước khi xóa.`,
            );
        }

        // ✅ Soft delete
        child._destroy = true;
        await child.save();

        console.log('✅ [ChildrenManagement delete] Deleted successfully');
        return {
            message: `Xóa thông tin trẻ "${child.fullName}" thành công`,
            childInfo: {
                fullName: child.fullName,
                studentCode: child.studentCode,
            },
        };
    } catch (error) {
        console.error('❌ [ChildrenManagement delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa thông tin trẻ');
    }
};

/**
 * ✅ Xóa nhiều trẻ cùng lúc (chỉ xóa trẻ có trạng thái "Nghỉ học")
 */
const deleteMany = async (ids, userId) => {
    try {
        console.log('🗑️ [ChildrenManagement deleteMany] Starting with', ids.length, 'items');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được xóa
        checkPermission(user);

        // ✅ Lấy danh sách trẻ
        const children = await ChildrenManagementModel.find({
            _id: { $in: ids },
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (children.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trẻ nào để xóa');
        }

        // ✅ Kiểm tra trạng thái: chỉ xóa trẻ "Nghỉ học"
        const activeChildren = children.filter((child) => child.status === 'Đang học');
        if (activeChildren.length > 0) {
            const activeNames = activeChildren.map((c) => c.fullName).join(', ');
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                `Không thể xóa ${activeChildren.length} trẻ đang có trạng thái "Đang học": ${activeNames}. Vui lòng chuyển sang trạng thái "Nghỉ học" trước khi xóa.`,
            );
        }

        // ✅ Xóa tất cả (soft delete)
        const result = await ChildrenManagementModel.updateMany(
            { _id: { $in: ids }, schoolId: user.schoolId, _destroy: false },
            { $set: { _destroy: true } },
        );

        console.log(`✅ [ChildrenManagement deleteMany] Deleted ${result.modifiedCount} items`);

        return {
            message: `Đã xóa thành công ${result.modifiedCount} trẻ`,
            deletedCount: result.modifiedCount,
        };
    } catch (error) {
        console.error('❌ [ChildrenManagement deleteMany] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa nhiều thông tin trẻ');
    }
};

/**
 * ✅ Auto-upgrade age group và reset hasClass khi tạo năm học mới
 * - Tăng nhóm tuổi lên 1 bậc cho tất cả trẻ "Đang học"
 * - Reset hasClass = false cho trẻ "Đang học" có hasClass = true
 * - Không thay đổi gì với trẻ "Nghỉ học"
 */
const resetHasClassForNewYear = async (schoolId) => {
    try {
        console.log('🔄 [ChildrenManagement resetHasClassForNewYear] Starting for school:', schoolId);

        // ✅ Mapping nhóm tuổi: current → next
        const AGE_GROUP_UPGRADE = {
            '12-24 tháng': '24-36 tháng',
            '24-36 tháng': '3-4 tuổi',
            '3-4 tuổi': '4-5 tuổi',
            '4-5 tuổi': '5-6 tuổi',
            '5-6 tuổi': '5-6 tuổi', // Giữ nguyên
        };

        // ✅ FIX: Lấy snapshot danh sách trẻ TRƯỚC KHI update để tránh trùng lặp
        const childrenToUpdate = await ChildrenManagementModel.find({
            schoolId,
            status: 'Đang học',
            _destroy: false,
        })
            .select('_id currentAgeGroup fullName')
            .lean();

        console.log(`📋 Found ${childrenToUpdate.length} children with status "Đang học"`);

        // ✅ Nhóm children theo currentAgeGroup
        const groupedByAgeGroup = childrenToUpdate.reduce((acc, child) => {
            if (!acc[child.currentAgeGroup]) {
                acc[child.currentAgeGroup] = [];
            }
            acc[child.currentAgeGroup].push(child._id);
            return acc;
        }, {});

        console.log('📊 Grouped by age group:', {
            '12-24 tháng': groupedByAgeGroup['12-24 tháng']?.length || 0,
            '24-36 tháng': groupedByAgeGroup['24-36 tháng']?.length || 0,
            '3-4 tuổi': groupedByAgeGroup['3-4 tuổi']?.length || 0,
            '4-5 tuổi': groupedByAgeGroup['4-5 tuổi']?.length || 0,
            '5-6 tuổi': groupedByAgeGroup['5-6 tuổi']?.length || 0,
        });

        let totalUpdated = 0;

        // ✅ Update từng nhóm với danh sách _id cố định
        for (const [currentAgeGroup, nextAgeGroup] of Object.entries(AGE_GROUP_UPGRADE)) {
            const childIds = groupedByAgeGroup[currentAgeGroup] || [];

            if (childIds.length === 0) {
                console.log(`  ⏭️ [${currentAgeGroup}]: No children to update`);
                continue;
            }

            console.log(`📋 Processing: ${currentAgeGroup} → ${nextAgeGroup} (${childIds.length} children)`);

            // ✅ Update bằng _id cụ thể, không dùng filter currentAgeGroup
            const result = await ChildrenManagementModel.updateMany(
                {
                    _id: { $in: childIds }, // ✅ CHỈ UPDATE ĐÚNG CÁC ID ĐÃ XÁC ĐỊNH
                    schoolId, // Safety check
                    _destroy: false,
                },
                {
                    $set: {
                        currentAgeGroup: nextAgeGroup,
                        hasClass: false,
                        currentClassName: 'Chưa có',
                    },
                },
            );

            console.log(
                `  ✅ [${currentAgeGroup}] → [${nextAgeGroup}]: Updated ${result.modifiedCount}/${childIds.length} students`,
            );
            totalUpdated += result.modifiedCount;
        }

        console.log('✅ [ChildrenManagement resetHasClassForNewYear] Summary:');
        console.log(`   - Total children (Đang học): ${childrenToUpdate.length}`);
        console.log(`   - Total updated: ${totalUpdated} students`);

        return {
            totalUpdated,
            status: 'success',
        };
    } catch (error) {
        console.error('❌ [ChildrenManagement resetHasClassForNewYear] Error:', error);
        throw error;
    }
};
/**
 * ✅ Import bulk children
 */
const importBulk = async (data, userId) => {
    try {
        console.log('📋 [ChildrenManagement importBulk] Starting with', data.length, 'children');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được import
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền import');
        }

        const created = [];
        const updated = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // ✅ Nếu có studentCode: Cập nhật
                if (row.studentCode && row.studentCode.trim() !== '') {
                    const existing = await ChildrenManagementModel.findOne({
                        schoolId: user.schoolId,
                        studentCode: row.studentCode,
                        _destroy: false,
                    });

                    if (existing) {
                        // Update
                        Object.assign(existing, {
                            fullName: row.fullName,
                            nickname: row.nickname || '',
                            birthDate: row.birthDate,
                            gender: row.gender,
                            ethnicity: row.ethnicity,
                            enrollmentDate: row.enrollmentDate,
                            currentAgeGroup: row.currentAgeGroup, // ✅ THÊM
                            status: row.status,
                            motherName: row.motherName || '',
                            motherBirthYear: row.motherBirthYear || null,
                            motherPhone: row.motherPhone || '',
                            motherEmail: row.motherEmail || '',
                            fatherName: row.fatherName || '',
                            fatherBirthYear: row.fatherBirthYear || null,
                            fatherPhone: row.fatherPhone || '',
                            fatherEmail: row.fatherEmail || '',
                            permanentAddress: row.permanentAddress,
                            currentAddress: row.currentAddress,
                            lastUpdatedBy: userId,
                        });

                        await existing.save();
                        updated.push({ fullName: existing.fullName, studentCode: existing.studentCode });
                    } else {
                        // Tạo mới với mã student code có sẵn
                        const newChild = new ChildrenManagementModel({
                            ...row,
                            schoolId: user.schoolId,
                            studentCode: row.studentCode,
                            createdBy: userId,
                            lastUpdatedBy: userId,
                        });
                        await newChild.save();
                        created.push({ fullName: newChild.fullName, studentCode: newChild.studentCode });
                    }
                } else {
                    // ✅ Không có studentCode: Thêm mới (hệ thống tự tạo mã)
                    const studentCode = await generateStudentCode(user.schoolId);

                    const newChild = new ChildrenManagementModel({
                        ...row,
                        schoolId: user.schoolId,
                        studentCode,
                        createdBy: userId,
                        lastUpdatedBy: userId,
                    });

                    await newChild.save();
                    created.push({ fullName: newChild.fullName, studentCode: newChild.studentCode });
                }
            } catch (err) {
                console.error(`❌ Error processing row ${i + 1}:`, err);
                errors.push({
                    row: i + 7, // Excel row number (header at row 6, data from row 7)
                    fullName: row.fullName || '(Chưa có tên)',
                    studentCode: row.studentCode || '',
                    error: err.message,
                });
            }
        }

        console.log(`✅ [importBulk] Created: ${created.length}, Updated: ${updated.length}, Errors: ${errors.length}`);

        return {
            created,
            updated,
            errors,
        };
    } catch (error) {
        console.error('❌ [ChildrenManagement importBulk] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi import danh sách trẻ: ' + error.message);
    }
};

export const childrenManagementServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteChild,
    deleteMany,
    resetHasClassForNewYear,
    importBulk,
};

import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import { ChildrenProfileModel } from '~/models/childrenProfileModel';
import { ClassModel } from '~/models/classModel';
import { AcademicYearModel } from '~/models/academicYearModel';
import { DepartmentModel } from '~/models/departmentModel';
import { UserModel } from '~/models/userModel';

// ✅ Constants nhóm tuổi
const AGE_GROUPS = ['3-12 tháng', '12-24 tháng', '24-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi'];

// ✅ Mapping Department name → Class ageGroups
const DEPARTMENT_TO_AGE_GROUPS = {
    'Khối Nhà Trẻ': ['3-12 tháng', '12-24 tháng', '24-36 tháng'],
    'Khối Mầm': ['3-4 tuổi'],
    'Khối Chồi': ['4-5 tuổi'],
    'Khối Lá': ['5-6 tuổi'],
};

// ✅ Helper: Normalize department name to grade (giữ nguyên format từ DB)
const normalizeDepartmentToGrade = (departmentName) => {
    // "Khối Nhà Trẻ" → "Nhà trẻ" (lowercase "trẻ")
    // "Khối Mầm" → "Mầm"
    // "Khối Chồi" → "Chồi"
    // "Khối Lá" → "Lá"
    const mapping = {
        'Khối Nhà Trẻ': 'Nhà trẻ',
        'Khối Mầm': 'Mầm',
        'Khối Chồi': 'Chồi',
        'Khối Lá': 'Lá',
    };
    return mapping[departmentName] || departmentName.replace(/^Khối\s+/i, '').trim();
};

/**
 * ✅ Lấy danh sách nhóm tuổi theo quyền hạn
 */
const getAccessibleAgeGroups = async (academicYearId, userId) => {
    try {
        console.log('📋 [getAccessibleAgeGroups] Starting with:', { academicYearId, userId });

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        let accessibleAgeGroups = [];

        if (user.role === 'ban_giam_hieu') {
            accessibleAgeGroups = AGE_GROUPS;
            console.log('✅ BGH: Full access to all age groups');
        } else if (user.role === 'to_truong') {
            const departments = await DepartmentModel.find({
                schoolId: user.schoolId,
                academicYearId: academicYearId,
                managers: user._id,
                _destroy: false,
            }).select('name');

            console.log('📚 Tổ trưởng departments:', departments);

            const ageGroupsSet = new Set();
            departments.forEach((dept) => {
                const mappedGroups = DEPARTMENT_TO_AGE_GROUPS[dept.name];
                if (mappedGroups) {
                    mappedGroups.forEach((group) => ageGroupsSet.add(group));
                    console.log(`  ✅ Mapped "${dept.name}" → [${mappedGroups.join(', ')}]`);
                }
            });

            accessibleAgeGroups = Array.from(ageGroupsSet);
            console.log('✅ Tổ trưởng accessible age groups:', accessibleAgeGroups);
        } else if (user.role === 'giao_vien') {
            const assignedClass = await ClassModel.findOne({
                schoolId: user.schoolId,
                academicYearId: academicYearId,
                homeRoomTeacher: user._id,
                _destroy: false,
            }).select('ageGroup');

            if (assignedClass) {
                accessibleAgeGroups = [assignedClass.ageGroup];
                console.log('✅ Giáo viên accessible age group:', accessibleAgeGroups);
            }
        }

        return { ageGroups: accessibleAgeGroups };
    } catch (error) {
        console.error('❌ [getAccessibleAgeGroups] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin nhóm tuổi: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách lớp theo age group và quyền hạn
 */
const getClassesByAgeGroup = async (academicYearId, ageGroup, userId) => {
    try {
        console.log('📋 [getClassesByAgeGroup] Starting with:', { academicYearId, ageGroup, userId });

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        let query = {
            schoolId: user.schoolId,
            academicYearId: academicYearId,
            ageGroup: ageGroup,
            _destroy: false,
        };

        if (user.role === 'ban_giam_hieu') {
            // No filter
        } else if (user.role === 'to_truong') {
            const departments = await DepartmentModel.find({
                schoolId: user.schoolId,
                academicYearId: academicYearId,
                managers: user._id,
                _destroy: false,
            }).select('name');

            // ✅ Normalize department names to grades (chính xác từ mapping)
            const grades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
            console.log('📚 Tổ trưởng normalized grades:', grades);

            // ✅ Sử dụng regex để so sánh case-insensitive
            query.grade = { $in: grades.map((g) => new RegExp(`^${g}$`, 'i')) };
        } else if (user.role === 'giao_vien') {
            query.homeRoomTeacher = user._id;
        }

        const classes = await ClassModel.find(query).select('_id name grade ageGroup').sort({ name: 1 }).lean();

        console.log('✅ Classes found:', classes.length);
        if (classes.length > 0) {
            console.log('📋 Sample class:', classes[0]);
        }

        return { classes };
    } catch (error) {
        console.error('❌ [getClassesByAgeGroup] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp: ' + error.message);
    }
};
// ✅ Helper: Tạo mã học sinh dạng schoolId-HS000001, tăng dần
const generateStudentCode = async (schoolId) => {
    const prefix = `${schoolId}-HS`;

    try {
        // ✅ Tìm tất cả studentCode có format đúng (kể cả đã xóa)
        // Sử dụng regex để match: schoolId-HS + 6 chữ số
        const lastProfile = await ChildrenProfileModel.findOne({
            schoolId,
            studentCode: { $regex: `^${prefix}\\d{6}$` },
        })
            .sort({ studentCode: -1 }) // Sort DESC để lấy mã lớn nhất
            .select('studentCode')
            .lean();

        let nextNumber = 1;

        if (lastProfile) {
            // Extract số từ studentCode (VD: "79242894-HS000005" → 5)
            const currentNumber = parseInt(lastProfile.studentCode.slice(-6), 10);
            if (!isNaN(currentNumber)) {
                nextNumber = currentNumber + 1;
            }
        }

        const paddedNumber = String(nextNumber).padStart(6, '0');
        const newCode = `${prefix}${paddedNumber}`;

        console.log('🔢 [generateStudentCode] Generated:', {
            lastCode: lastProfile?.studentCode || 'none',
            newCode,
            nextNumber,
        });

        return newCode;
    } catch (error) {
        console.error('❌ [generateStudentCode] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Không thể tạo mã học sinh');
    }
};

/**
 * ✅ Tạo hồ sơ trẻ mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📋 [ChildrenProfile createNew] Starting with data:', data);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Verify academic year active
        const academicYear = await AcademicYearModel.findOne({
            _id: data.academicYearId,
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được thêm hồ sơ cho năm học đang hoạt động');
        }

        // ✅ Verify class exists
        const classData = await ClassModel.findOne({
            _id: data.classId,
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            _destroy: false,
        });

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        console.log('🏫 [createNew] Class data:', {
            name: classData.name,
            grade: classData.grade,
            ageGroup: classData.ageGroup,
        });

        // ✅ Check permission based on role
        if (user.role === 'to_truong') {
            const departments = await DepartmentModel.find({
                schoolId: user.schoolId,
                academicYearId: data.academicYearId,
                managers: user._id,
                _destroy: false,
            }).select('name');

            console.log(
                '📚 [createNew] Tổ trưởng departments:',
                departments.map((d) => d.name),
            );

            // ✅ Normalize department names and check if class.grade is in managed grades
            const managedGrades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
            console.log('✅ [createNew] Managed grades:', managedGrades);
            console.log('✅ [createNew] Class grade:', classData.grade);

            const hasPermission = managedGrades.some((grade) => grade.toLowerCase() === classData.grade.toLowerCase());

            if (!hasPermission) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    `Bạn không có quyền thêm hồ sơ cho lớp "${classData.name}" (Khối ${classData.grade})`,
                );
            }
        } else if (user.role === 'giao_vien') {
            if (classData.homeRoomTeacher.toString() !== user._id.toString()) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn chỉ được thêm hồ sơ cho lớp của mình');
            }
        }

        // ✅ Generate unique studentCode
        // ✅ Generate studentCode dạng schoolId-HS000001, HS000002,...
        const studentCode = await generateStudentCode(user.schoolId);

        // ✅ Create profile
        const newProfile = await ChildrenProfileModel.create({
            ...data,
            schoolId: user.schoolId,
            studentCode,
            createdBy: user._id,
        });

        const populated = await ChildrenProfileModel.findById(newProfile._id)
            .populate('classId', 'name grade ageGroup')
            .lean();

        console.log('✅ Profile created successfully with studentCode:', studentCode);
        return populated;
    } catch (error) {
        console.error('❌ [ChildrenProfile createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo hồ sơ trẻ: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách hồ sơ trẻ
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId = '', classId = '', search = '' } = query;

        let filter = {
            schoolId: user.schoolId,
            _destroy: false,
        };

        if (academicYearId) filter.academicYearId = academicYearId;
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { studentCode: { $regex: search, $options: 'i' } },
            ];
        }

        // ✅ Ban giám hiệu: Xem tất cả
        if (user.role === 'ban_giam_hieu') {
            // Nếu có classId trong query, áp dụng filter
            if (classId) {
                filter.classId = classId;
            }
        }
        // ✅ Tổ trưởng: Chỉ xem lớp trong khối được quản lý
        else if (user.role === 'to_truong') {
            const departments = await DepartmentModel.find({
                schoolId: user.schoolId,
                academicYearId: academicYearId || undefined,
                managers: user._id,
                _destroy: false,
            }).select('name');

            const grades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
            const accessibleClasses = await ClassModel.find({
                schoolId: user.schoolId,
                academicYearId: academicYearId || undefined,
                grade: { $in: grades.map((g) => new RegExp(`^${g}$`, 'i')) },
                _destroy: false,
            }).select('_id');

            const accessibleClassIds = accessibleClasses.map((c) => c._id);

            // ✅ FIX: Nếu user chọn classId từ dropdown
            if (classId) {
                // Kiểm tra classId có nằm trong danh sách accessible không
                if (accessibleClassIds.some((id) => id.toString() === classId)) {
                    filter.classId = classId; // ✅ Chỉ filter theo classId đã chọn
                } else {
                    // Nếu classId không thuộc quyền hạn, trả về empty
                    return {
                        profiles: [],
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 0,
                            totalItems: 0,
                            itemsPerPage: parseInt(limit),
                        },
                    };
                }
            } else {
                // Nếu không chọn classId, hiển thị tất cả lớp thuộc quyền
                filter.classId = { $in: accessibleClassIds };
            }
        }
        // ✅ Giáo viên: Chỉ xem lớp của mình
        else if (user.role === 'giao_vien') {
            const assignedClass = await ClassModel.findOne({
                schoolId: user.schoolId,
                academicYearId: academicYearId || undefined,
                homeRoomTeacher: user._id,
                _destroy: false,
            }).select('_id');

            if (assignedClass) {
                filter.classId = assignedClass._id;
            } else {
                return {
                    profiles: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: parseInt(limit),
                    },
                };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [profiles, totalItems] = await Promise.all([
            ChildrenProfileModel.find(filter)
                .populate('classId', 'name grade ageGroup')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            ChildrenProfileModel.countDocuments(filter),
        ]);

        console.log('✅ [getAll] Profiles found:', profiles.length);

        return {
            profiles,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                totalItems,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        console.error('❌ [getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách hồ sơ: ' + error.message);
    }
};

/**
 * ✅ Lấy chi tiết hồ sơ
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const profile = await ChildrenProfileModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('classId', 'name grade ageGroup')
            .lean();

        if (!profile) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }

        // ✅ Check permission
        if (user.role === 'to_truong') {
            const classData = await ClassModel.findById(profile.classId);
            const departments = await DepartmentModel.find({
                schoolId: user.schoolId,
                managers: user._id,
                _destroy: false,
            }).select('name');

            const managedGrades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
            const hasPermission = managedGrades.some((grade) => grade.toLowerCase() === classData.grade.toLowerCase());

            if (!hasPermission) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem hồ sơ này');
            }
        } else if (user.role === 'giao_vien') {
            const classData = await ClassModel.findById(profile.classId);
            if (classData.homeRoomTeacher.toString() !== user._id.toString()) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem hồ sơ này');
            }
        }

        return profile;
    } catch (error) {
        console.error('❌ [getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin hồ sơ: ' + error.message);
    }
};

/**
 * ✅ Cập nhật hồ sơ
 */
const update = async (id, data, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const profile = await ChildrenProfileModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!profile) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }

        // ✅ Verify active year
        const academicYear = await AcademicYearModel.findOne({
            _id: profile.academicYearId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được sửa hồ sơ trong năm học đang hoạt động');
        }

        // ✅ Check permission
        if (user.role === 'to_truong') {
            const classData = await ClassModel.findById(profile.classId);
            const departments = await DepartmentModel.find({
                schoolId: user.schoolId,
                managers: user._id,
                _destroy: false,
            }).select('name');

            const managedGrades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
            const hasPermission = managedGrades.some((grade) => grade.toLowerCase() === classData.grade.toLowerCase());

            if (!hasPermission) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền sửa hồ sơ này');
            }
        } else if (user.role === 'giao_vien') {
            const classData = await ClassModel.findById(profile.classId);
            if (classData.homeRoomTeacher.toString() !== user._id.toString()) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền sửa hồ sơ này');
            }
        }

        // ✅ Update
        Object.assign(profile, data);
        await profile.save();

        const updated = await ChildrenProfileModel.findById(id).populate('classId', 'name grade ageGroup').lean();

        return updated;
    } catch (error) {
        console.error('❌ [update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật hồ sơ: ' + error.message);
    }
};

/**
 * ✅ Xóa hồ sơ
 */
const deleteProfile = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const profile = await ChildrenProfileModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!profile) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hồ sơ');
        }

        // ✅ Verify active year
        const academicYear = await AcademicYearModel.findOne({
            _id: profile.academicYearId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được xóa hồ sơ trong năm học đang hoạt động');
        }

        // ✅ Check permission
        if (user.role === 'to_truong') {
            const classData = await ClassModel.findById(profile.classId);
            const departments = await DepartmentModel.find({
                schoolId: user.schoolId,
                managers: user._id,
                _destroy: false,
            }).select('name');

            const managedGrades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
            const hasPermission = managedGrades.some((grade) => grade.toLowerCase() === classData.grade.toLowerCase());

            if (!hasPermission) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa hồ sơ này');
            }
        } else if (user.role === 'giao_vien') {
            const classData = await ClassModel.findById(profile.classId);
            if (classData.homeRoomTeacher.toString() !== user._id.toString()) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa hồ sơ này');
            }
        }

        // ✅ Soft delete
        // ✅ Sau: Hard delete
        await ChildrenProfileModel.findByIdAndDelete(id);

        return { message: 'Xóa hồ sơ thành công!' };
    } catch (error) {
        console.error('❌ [deleteProfile] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa hồ sơ: ' + error.message);
    }
};

/**
 * ✅ Import bulk children profiles from Excel
 */
const importBulk = async (data, userId) => {
    try {
        console.log('📋 [importBulk] Starting with', data.length, 'profiles');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Get active academic year
        const academicYear = await AcademicYearModel.findOne({
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Không tìm thấy năm học đang hoạt động');
        }

        const results = {
            created: [],
            updated: [],
            errors: [],
        };

        for (const [index, item] of data.entries()) {
            try {
                const rowNumber = index + 6; // Excel row number

                // ✅ Find class by name
                const classData = await ClassModel.findOne({
                    schoolId: user.schoolId,
                    academicYearId: academicYear._id,
                    name: item.className,
                    ageGroup: item.ageGroup,
                    _destroy: false,
                });

                if (!classData) {
                    results.errors.push({
                        row: rowNumber,
                        studentCode: item.studentCode,
                        fullName: item.fullName,
                        error: `Không tìm thấy lớp "${item.className}" trong khối "${item.ageGroup}"`,
                    });
                    continue;
                }

                // ✅ Check permission
                if (user.role === 'to_truong') {
                    const departments = await DepartmentModel.find({
                        schoolId: user.schoolId,
                        academicYearId: academicYear._id,
                        managers: user._id,
                        _destroy: false,
                    }).select('name');

                    const managedGrades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
                    const hasPermission = managedGrades.some(
                        (grade) => grade.toLowerCase() === classData.grade.toLowerCase(),
                    );

                    if (!hasPermission) {
                        results.errors.push({
                            row: rowNumber,
                            studentCode: item.studentCode,
                            fullName: item.fullName,
                            error: `Bạn không có quyền import vào lớp "${classData.name}" (Khối ${classData.grade})`,
                        });
                        continue;
                    }
                } else if (user.role === 'giao_vien') {
                    if (classData.homeRoomTeacher.toString() !== user._id.toString()) {
                        results.errors.push({
                            row: rowNumber,
                            studentCode: item.studentCode,
                            fullName: item.fullName,
                            error: 'Bạn chỉ được import vào lớp của mình',
                        });
                        continue;
                    }
                }

                // ✅ Prepare data
                const profileData = {
                    fullName: item.fullName,
                    birthDate: item.birthDate,
                    gender: item.gender,
                    ageGroup: item.ageGroup,
                    classId: classData._id,
                    status: item.status || 'Đang học',
                    enrollmentDate: item.enrollmentDate,
                    enrollmentForm: item.enrollmentForm || '',
                    birthPlace: item.birthPlace || '',
                    hometown: item.hometown || '',
                    permanentAddress: item.permanentAddress,
                    temporaryAddress: item.temporaryAddress,
                    ethnicity: item.ethnicity,
                    religion: item.religion || '',
                    swimmingLevel: item.swimmingLevel || '',
                    bloodType: item.bloodType || '',
                    hasComputer: item.hasComputer || '',
                    hasSmartphone: item.hasSmartphone || '',
                    familyComponent: item.familyComponent || '',
                    fatherName: item.fatherName || '',
                    fatherBirthYear: item.fatherBirthYear || '',
                    fatherOccupation: item.fatherOccupation || '',
                    fatherPhone: item.fatherPhone || '',
                    fatherEmail: item.fatherEmail || '',
                    motherName: item.motherName || '',
                    motherBirthYear: item.motherBirthYear || '',
                    motherOccupation: item.motherOccupation || '',
                    motherPhone: item.motherPhone || '',
                    motherEmail: item.motherEmail || '',
                    guardianName: item.guardianName || '',
                    guardianBirthYear: item.guardianBirthYear || '',
                    guardianOccupation: item.guardianOccupation || '',
                    guardianPhone: item.guardianPhone || '',
                    guardianEmail: item.guardianEmail || '',
                    schoolId: user.schoolId,
                    academicYearId: academicYear._id,
                };

                // ✅ Update or Create
                if (item.studentCode) {
                    // Update existing
                    const existing = await ChildrenProfileModel.findOne({
                        schoolId: user.schoolId,
                        studentCode: item.studentCode,
                        _destroy: false,
                    });

                    if (existing) {
                        Object.assign(existing, profileData);
                        await existing.save();
                        results.updated.push({
                            studentCode: item.studentCode,
                            fullName: item.fullName,
                        });
                    } else {
                        results.errors.push({
                            row: rowNumber,
                            studentCode: item.studentCode,
                            fullName: item.fullName,
                            error: `Không tìm thấy học sinh với mã "${item.studentCode}"`,
                        });
                    }
                } else {
                    // Create new
                    const studentCode = await generateStudentCode(user.schoolId);
                    profileData.studentCode = studentCode;
                    profileData.createdBy = user._id;

                    const newProfile = await ChildrenProfileModel.create(profileData);
                    results.created.push({
                        studentCode: newProfile.studentCode,
                        fullName: newProfile.fullName,
                    });
                }
            } catch (error) {
                results.errors.push({
                    row: index + 6,
                    studentCode: item.studentCode || '',
                    fullName: item.fullName || '',
                    error: error.message,
                });
            }
        }

        console.log('✅ [importBulk] Results:', {
            created: results.created.length,
            updated: results.updated.length,
            errors: results.errors.length,
        });

        return results;
    } catch (error) {
        console.error('❌ [importBulk] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi import hồ sơ: ' + error.message);
    }
};

/**
 * ✅ Xóa nhiều hồ sơ trẻ cùng lúc
 */
const deleteManyProfiles = async (ids, userId) => {
    try {
        console.log('📋 [deleteManyProfiles] Starting with ids:', ids);

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Danh sách ID không hợp lệ');
        }

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Lấy danh sách profiles
        const profiles = await ChildrenProfileModel.find({
            _id: { $in: ids },
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('classId academicYearId');

        if (profiles.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hồ sơ nào để xóa');
        }

        // ✅ Kiểm tra tất cả profiles phải trong năm học đang hoạt động
        for (const profile of profiles) {
            const academicYear = await AcademicYearModel.findOne({
                _id: profile.academicYearId,
                status: 'active',
                _destroy: false,
            });

            if (!academicYear) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Chỉ được xóa hồ sơ trong năm học đang hoạt động. Hồ sơ "${profile.fullName}" không thuộc năm học đang hoạt động.`,
                );
            }

            // ✅ Check permission theo role
            if (user.role === 'to_truong') {
                const classData = await ClassModel.findById(profile.classId);
                const departments = await DepartmentModel.find({
                    schoolId: user.schoolId,
                    managers: user._id,
                    _destroy: false,
                }).select('name');

                const managedGrades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
                const hasPermission = managedGrades.some(
                    (grade) => grade.toLowerCase() === classData.grade.toLowerCase(),
                );

                if (!hasPermission) {
                    throw new ApiError(StatusCodes.FORBIDDEN, `Bạn không có quyền xóa hồ sơ "${profile.fullName}"`);
                }
            } else if (user.role === 'giao_vien') {
                const classData = await ClassModel.findById(profile.classId);
                if (classData.homeRoomTeacher.toString() !== user._id.toString()) {
                    throw new ApiError(StatusCodes.FORBIDDEN, `Bạn không có quyền xóa hồ sơ "${profile.fullName}"`);
                }
            }
        }

        // ✅ Hard delete tất cả profiles
        const result = await ChildrenProfileModel.deleteMany({
            _id: { $in: ids },
        });

        console.log(`✅ [deleteManyProfiles] Deleted ${result.deletedCount} profiles`);

        return {
            message: `Đã xóa thành công ${result.deletedCount} hồ sơ trẻ em`,
            deletedCount: result.deletedCount,
        };
    } catch (error) {
        console.error('❌ [deleteManyProfiles] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa nhiều hồ sơ: ' + error.message);
    }
};

// ✅ Export thêm function mới
export const childrenProfileServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteProfile,
    deleteManyProfiles, // ✅ Add this
    getAccessibleAgeGroups,
    getClassesByAgeGroup,
    importBulk,
};

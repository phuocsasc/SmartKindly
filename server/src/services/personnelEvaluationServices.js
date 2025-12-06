// server/src/services/personnelEvaluationServices.js

import { PersonnelEvaluationModel } from '~/models/personnelEvaluationModel.js';
import { PersonnelRecordModel } from '~/models/personnelRecordModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Lấy tất cả đánh giá theo năm học
 * - Năm học active: Tự động sync với PersonnelRecord
 * - Năm học đã xong: Chỉ hiển thị dữ liệu đã lưu (không sync)
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, search = '', academicYearId = '' } = query;
        const skip = (page - 1) * limit;

        let targetYearId = academicYearId;
        let targetYear;

        if (!targetYearId) {
            targetYear = await AcademicYearModel.findOne({
                schoolId: user.schoolId,
                status: 'active',
                _destroy: false,
            });

            if (!targetYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học đang hoạt động');
            }
            targetYearId = targetYear._id.toString();
        } else {
            targetYear = await AcademicYearModel.findById(targetYearId);
            if (!targetYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
            }
        }

        console.log(`📊 [PersonnelEvaluation getAll] Year ${targetYearId}, Status: ${targetYear.status}`);

        // ✅ CHỈ SYNC NẾU NĂM HỌC ĐANG ACTIVE
        if (targetYear.status === 'active') {
            console.log('🔄 [PersonnelEvaluation getAll] Syncing for active year...');

            // ✅ Lấy PersonnelRecord đủ điều kiện (workStatus = "Đang làm việc")
            const personnelRecords = await PersonnelRecordModel.find({
                schoolId: user.schoolId,
                _destroy: false,
                positionGroup: { $in: ['Tổ trưởng', 'Tổ phó', 'Giáo viên'] },
                workStatus: 'Đang làm việc', // ✅ CHỈ lấy người đang làm việc
            })
                .select('_id personnelCode fullName')
                .lean();

            console.log(`📊 Found ${personnelRecords.length} eligible personnel (workStatus = "Đang làm việc")`);

            // ✅ Lấy tất cả evaluation hiện có trong năm active
            const existingEvaluations = await PersonnelEvaluationModel.find({
                schoolId: user.schoolId,
                academicYearId: targetYearId,
                _destroy: false,
            })
                .select('personnelRecordId')
                .lean();

            const existingPersonnelIds = new Set(existingEvaluations.map((e) => e.personnelRecordId.toString()));
            const activePersonnelIds = new Set(personnelRecords.map((p) => p._id.toString()));

            // ✅ Tạo evaluation cho cán bộ mới đủ điều kiện
            for (const record of personnelRecords) {
                if (!existingPersonnelIds.has(record._id.toString())) {
                    try {
                        await PersonnelEvaluationModel.create({
                            personnelRecordId: record._id,
                            academicYearId: targetYearId,
                            schoolId: user.schoolId,
                            fullName: record.fullName,
                            personnelCode: record.personnelCode,
                            officialEvaluation: '',
                            regularTraining: '',
                            excellentTeacher: '',
                            emulationTitle: '',
                            notes: '',
                        });
                        console.log(`✅ Created evaluation for ${record.fullName}`);
                    } catch (error) {
                        if (error.code !== 11000) {
                            console.error(`❌ Error creating evaluation for ${record.fullName}:`, error.message);
                        }
                    }
                }
            }

            // ✅ Xóa (_destroy: true) evaluation của những người KHÔNG CÒN đủ điều kiện
            for (const evaluation of existingEvaluations) {
                const personnelId = evaluation.personnelRecordId.toString();
                if (!activePersonnelIds.has(personnelId)) {
                    await PersonnelEvaluationModel.updateOne({ _id: evaluation._id }, { _destroy: true });
                    console.log(`✅ Removed evaluation for personnelId: ${personnelId} (không còn đủ điều kiện)`);
                }
            }
        } else {
            console.log('📋 [PersonnelEvaluation getAll] Năm học đã xong - chỉ đọc dữ liệu, KHÔNG sync');
        }

        // ✅ Build filter
        const evalFilter = {
            schoolId: user.schoolId,
            academicYearId: targetYearId,
        };

        // ✅ NẾU NĂM HỌC ĐANG ACTIVE: Chỉ lấy evaluation chưa bị _destroy (cán bộ "Đang làm việc")
        // ✅ NẾU NĂM HỌC ĐÃ KẾT THÚC: Lấy TẤT CẢ evaluation (bao gồm cả người "Nghỉ việc")
        if (targetYear.status === 'active') {
            evalFilter._destroy = false; // ✅ Chỉ lấy người đang làm việc
            console.log('🔍 [PersonnelEvaluation getAll] Active year - Chỉ hiển thị người đang làm việc');
        } else {
            // ❌ KHÔNG lọc _destroy - Hiển thị tất cả (kể cả người nghỉ việc)
            console.log('🔍 [PersonnelEvaluation getAll] Inactive year - Hiển thị tất cả (kể cả người nghỉ việc)');
        }

        if (search) {
            evalFilter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { personnelCode: { $regex: search, $options: 'i' } },
            ];
        }

        // ✅ Query
        const [records, totalItems] = await Promise.all([
            PersonnelEvaluationModel.find(evalFilter)
                .populate('personnelRecordId', 'fullName personnelCode department positionGroup workStatus')
                .populate('academicYearId', 'fromYear toYear status')
                .populate('lastUpdatedBy', 'fullName username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            PersonnelEvaluationModel.countDocuments(evalFilter),
        ]);

        console.log(`✅ [PersonnelEvaluation getAll] Returning ${records.length} records (total: ${totalItems})`);

        return {
            records,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            },
        };
    } catch (error) {
        console.error('❌ [PersonnelEvaluation getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách đánh giá');
    }
};

/**
 * ✅ Lấy chi tiết đánh giá
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const evaluation = await PersonnelEvaluationModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('personnelRecordId')
            .populate('academicYearId')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!evaluation) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        return evaluation;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin đánh giá');
    }
};

/**
 * ✅ Cập nhật đánh giá (CHỈ cho năm học đang active)
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [PersonnelEvaluation update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const evaluation = await PersonnelEvaluationModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId');

        if (!evaluation) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // ✅ Kiểm tra năm học có đang active không
        if (evaluation.academicYearId.status !== 'active') {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                `Không thể chỉnh sửa đánh giá của năm học ${evaluation.academicYearId.fromYear}-${evaluation.academicYearId.toYear}. Năm học đã kết thúc, dữ liệu chỉ để tham khảo!`,
            );
        }

        // ✅ CHỈ cho phép update các fields đánh giá
        const allowedFields = ['officialEvaluation', 'regularTraining', 'excellentTeacher', 'emulationTitle', 'notes'];
        const updateData = {};

        allowedFields.forEach((field) => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });

        updateData.lastUpdatedBy = userId;

        console.log('🔍 [PersonnelEvaluation update] Data to update:', updateData);

        // ✅ Update
        const updatedEvaluation = await PersonnelEvaluationModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate('personnelRecordId')
            .populate('academicYearId')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [PersonnelEvaluation update] Updated successfully');

        return updatedEvaluation;
    } catch (error) {
        console.error('❌ [PersonnelEvaluation update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật đánh giá: ' + error.message);
    }
};

/**
 * ✅ Xóa đánh giá (CHỈ cho năm học đang active)
 */
const deleteEvaluation = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const evaluation = await PersonnelEvaluationModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId');

        if (!evaluation) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // ✅ Kiểm tra năm học có đang active không
        if (evaluation.academicYearId.status !== 'active') {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Không thể xóa đánh giá của năm học đã kết thúc. Dữ liệu chỉ để tham khảo!',
            );
        }

        // Soft delete
        await PersonnelEvaluationModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa đánh giá thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa đánh giá');
    }
};

export const personnelEvaluationServices = {
    getAll,
    getDetails,
    update,
    deleteEvaluation,
};

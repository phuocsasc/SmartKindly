// server/src/services/personnelEvaluationServices.js

import { PersonnelEvaluationModel } from '~/models/personnelEvaluationModel';
import { PersonnelRecordModel } from '~/models/personnelRecordModel';
import { AcademicYearModel } from '~/models/academicYearModel';
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Lấy tất cả đánh giá theo năm học (tự động sync với PersonnelRecord)
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, search = '', academicYearId = '' } = query;
        const skip = (page - 1) * limit;

        // ✅ Lấy năm học đang active nếu không truyền academicYearId
        let targetYearId = academicYearId;
        if (!targetYearId) {
            const activeYear = await AcademicYearModel.findOne({
                schoolId: user.schoolId,
                status: 'active',
                _destroy: false,
            });

            if (!activeYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học đang hoạt động');
            }
            targetYearId = activeYear._id.toString();
        }

        // ✅ Lấy PersonnelRecord đủ điều kiện
        const personnelRecords = await PersonnelRecordModel.find({
            schoolId: user.schoolId,
            _destroy: false,
            positionGroup: { $in: ['Tổ trưởng', 'Tổ phó', 'Giáo viên'] },
            workStatus: 'Đang làm việc',
        })
            .select('_id personnelCode fullName')
            .lean();

        console.log(
            `📊 [PersonnelEvaluation getAll] Found ${personnelRecords.length} eligible personnel for year ${targetYearId}`,
        );

        // ✅ Sync: Tạo evaluation cho năm học hiện tại nếu chưa có
        for (const record of personnelRecords) {
            try {
                const existingEval = await PersonnelEvaluationModel.findOne({
                    personnelRecordId: record._id,
                    academicYearId: targetYearId,
                    _destroy: false,
                });

                if (!existingEval) {
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
                    console.log(`✅ [PersonnelEvaluation] Created for ${record.fullName} in year ${targetYearId}`);
                }
            } catch (error) {
                if (error.code !== 11000) {
                    console.error(
                        `❌ [PersonnelEvaluation] Error creating evaluation for ${record.fullName}:`,
                        error.message,
                    );
                }
            }
        }

        // ✅ Build filter
        const evalFilter = {
            schoolId: user.schoolId,
            academicYearId: targetYearId,
            _destroy: false,
        };

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
                `Không thể chỉnh sửa đánh giá của năm học ${evaluation.academicYearId.fromYear}-${evaluation.academicYearId.toYear}. Chỉ có thể đánh giá trong năm học đang hoạt động!`,
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
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa đánh giá trong năm học đang hoạt động');
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

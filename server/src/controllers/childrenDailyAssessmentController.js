// server/src/controllers/childrenDailyAssessmentController.js

import { StatusCodes } from 'http-status-codes';
import { childrenDailyAssessmentServices } from '~/services/childrenDailyAssessmentServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenDailyAssessmentServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo đánh giá thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ FIX: Đổi từ getAll() → getAssessmentsByClass()
const getAssessmentsByClass = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenDailyAssessmentServices.getAssessmentsByClass(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách đánh giá thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenDailyAssessmentServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin đánh giá thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenDailyAssessmentServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật đánh giá thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteAssessment = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await childrenDailyAssessmentServices.deleteAssessment(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa đánh giá thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const getAccessibleClassesList = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await childrenDailyAssessmentServices.getAccessibleClassesList(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const childrenDailyAssessmentController = {
    createNew,
    getAssessmentsByClass,
    getDetails,
    update,
    deleteAssessment,
    getAccessibleClassesList,
};

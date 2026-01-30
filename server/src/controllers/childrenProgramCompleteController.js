// server/src/controllers/childrenProgramCompleteController.js

import { StatusCodes } from 'http-status-codes';
import { childrenProgramCompleteServices } from '~/services/childrenProgramCompleteServices.js';

// ===== CONFIG ENDPOINTS =====

const upsertConfig = async (req, res, next) => {
    try {
        const result = await childrenProgramCompleteServices.upsertConfig(req.body, req.jwtDecoded.id);
        res.status(StatusCodes.OK).json({
            message: 'Cấu hình mục tiêu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getConfigByYear = async (req, res, next) => {
    try {
        const result = await childrenProgramCompleteServices.getConfigByYear(
            req.query.academicYearId,
            req.jwtDecoded.id,
        );
        res.status(StatusCodes.OK).json({
            message: 'Lấy cấu hình mục tiêu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteConfig = async (req, res, next) => {
    try {
        const { ageGroup, academicYearId } = req.query;
        const result = await childrenProgramCompleteServices.deleteConfig(ageGroup, academicYearId, req.jwtDecoded.id);
        res.status(StatusCodes.OK).json({
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

// ===== CRUD ENDPOINTS =====

const createNew = async (req, res, next) => {
    try {
        const result = await childrenProgramCompleteServices.createNew(req.body, req.jwtDecoded.id);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo đánh giá thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await childrenProgramCompleteServices.getAll(req.query, req.jwtDecoded.id);
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
        const result = await childrenProgramCompleteServices.getDetails(req.params.id, req.jwtDecoded.id);
        res.status(StatusCodes.OK).json({
            message: 'Lấy chi tiết đánh giá thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await childrenProgramCompleteServices.update(req.params.id, req.body, req.jwtDecoded.id);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật đánh giá thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteEvaluation = async (req, res, next) => {
    try {
        const result = await childrenProgramCompleteServices.deleteEvaluation(req.params.id, req.jwtDecoded.id);
        res.status(StatusCodes.OK).json({
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

const getAccessibleClassesList = async (req, res, next) => {
    try {
        const result = await childrenProgramCompleteServices.getAccessibleClassesList(
            req.query.academicYearId,
            req.jwtDecoded.id,
        );
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const childrenProgramCompleteController = {
    // Config
    upsertConfig,
    getConfigByYear,
    deleteConfig,
    // CRUD
    createNew,
    getAll,
    getDetails,
    update,
    deleteEvaluation,
    getAccessibleClassesList,
};

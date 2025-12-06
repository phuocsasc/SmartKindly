import { StatusCodes } from 'http-status-codes';
import { childrenProgramCompleteServices } from '~/services/childrenProgramCompleteServices.js';

const createNew = async (req, res, next) => {
    try {
        const result = await childrenProgramCompleteServices.createNew(req.body, req.jwtDecoded.id);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo đánh giá hoàn thành chương trình thành công!',
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
            message: 'Lấy thông tin đánh giá thành công!',
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
            message: result.message,
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

export const childrenProgramCompleteController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteEvaluation,
    upsertConfig,
    getConfigByYear,
};

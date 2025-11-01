// server/src/controllers/personnelEvaluationController.js

import { StatusCodes } from 'http-status-codes';
import { personnelEvaluationServices } from '~/services/personnelEvaluationServices';

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelEvaluationServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách đánh giá xếp loại thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelEvaluationServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin đánh giá xếp loại thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelEvaluationServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật đánh giá xếp loại thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteEvaluation = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelEvaluationServices.deleteEvaluation(req.params.id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const personnelEvaluationController = {
    getAll,
    getDetails,
    update,
    deleteEvaluation,
};

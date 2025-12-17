// server/src/controllers/nutritionalStandardController.js

import { StatusCodes } from 'http-status-codes';
import { nutritionalStandardServices } from '~/services/nutritionalStandardServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await nutritionalStandardServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo định mức dinh dưỡng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await nutritionalStandardServices.getAll(req.query);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách định mức dinh dưỡng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const result = await nutritionalStandardServices.getDetails(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin định mức dinh dưỡng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await nutritionalStandardServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật định mức dinh dưỡng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteStandard = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await nutritionalStandardServices.deleteStandard(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa định mức dinh dưỡng thành công!',
        });
    } catch (error) {
        next(error);
    }
};

export const nutritionalStandardController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteStandard,
};

// server/src/controllers/schoolNutritionalStandardController.js

import { StatusCodes } from 'http-status-codes';
import { schoolNutritionalStandardServices } from '~/services/schoolNutritionalStandardServices.js';

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolNutritionalStandardServices.getAll(req.query, userId);
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
        const userId = req.jwtDecoded.id;
        const result = await schoolNutritionalStandardServices.getDetails(req.params.id, userId);
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
        const result = await schoolNutritionalStandardServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật định mức dinh dưỡng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const checkAndSync = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolNutritionalStandardServices.checkAndSync(userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const forceSync = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolNutritionalStandardServices.forceSync(userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const schoolNutritionalStandardController = {
    getAll,
    getDetails,
    update,
    checkAndSync,
    forceSync,
};

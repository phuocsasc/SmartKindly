// server/src/controllers/yearTargetController.js

import { StatusCodes } from 'http-status-codes';
import { yearTargetServices } from '~/services/yearTargetServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await yearTargetServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo mục tiêu năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await yearTargetServices.getAll(req.query);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách mục tiêu năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const result = await yearTargetServices.getDetails(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin mục tiêu năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await yearTargetServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật mục tiêu năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteYearTarget = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await yearTargetServices.deleteYearTarget(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            data: {
                deletedActivitiesCount: result.deletedActivitiesCount,
                yearTargetInfo: result.yearTargetInfo,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const yearTargetController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteYearTarget,
};

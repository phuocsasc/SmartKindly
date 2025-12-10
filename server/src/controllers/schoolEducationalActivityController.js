// server/src/controllers/schoolEducationalActivityController.js

import { StatusCodes } from 'http-status-codes';
import { schoolEducationalActivityServices } from '~/services/schoolEducationalActivityServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolEducationalActivityServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo hoạt động giáo dục thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolEducationalActivityServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách hoạt động giáo dục thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolEducationalActivityServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy chi tiết hoạt động giáo dục thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolEducationalActivityServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật hoạt động giáo dục thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteActivity = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolEducationalActivityServices.deleteActivity(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            activityInfo: result.activityInfo, // ✅ Trả về để audit log sử dụng
        });
    } catch (error) {
        next(error);
    }
};

const copyFromYear = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolEducationalActivityServices.copyFromYear(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Copy hoạt động giáo dục từ năm học cũ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const schoolEducationalActivityController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteActivity,
    copyFromYear,
};

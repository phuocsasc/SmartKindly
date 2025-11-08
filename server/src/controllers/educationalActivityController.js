// server/src/controllers/educationalActivityController.js

import { StatusCodes } from 'http-status-codes';
import { educationalActivityServices } from '~/services/educationalActivityServices';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await educationalActivityServices.createNew(req.body, userId);
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
        const result = await educationalActivityServices.getAll(req.query);
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
        const result = await educationalActivityServices.getDetails(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin hoạt động giáo dục thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getByTargetCode = async (req, res, next) => {
    try {
        const result = await educationalActivityServices.getByTargetCode(req.query);
        res.status(StatusCodes.OK).json({
            message: 'Lấy hoạt động giáo dục theo mục tiêu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await educationalActivityServices.update(req.params.id, req.body, userId);
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
        await educationalActivityServices.deleteActivity(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa hoạt động giáo dục thành công!',
        });
    } catch (error) {
        next(error);
    }
};

export const educationalActivityController = {
    createNew,
    getAll,
    getDetails,
    getByTargetCode,
    update,
    deleteActivity,
};

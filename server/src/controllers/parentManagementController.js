// server/src/controllers/parentManagementController.js

import { StatusCodes } from 'http-status-codes';
import { parentManagementServices } from '~/services/parentManagementServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentManagementServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: result.message,
            data: {
                created: result.created,
                errors: result.errors,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentManagementServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách phụ huynh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentManagementServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin phụ huynh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentManagementServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật thông tin phụ huynh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteParent = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await parentManagementServices.deleteParent(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa tài khoản phụ huynh thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const deleteManyParents = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentManagementServices.deleteManyParents(req.body.ids, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const getAvailableStudents = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        // ✅ Truyền query params vào service
        const result = await parentManagementServices.getAvailableStudents(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách học sinh chưa có tài khoản phụ huynh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const parentManagementController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteParent,
    deleteManyParents,
    getAvailableStudents,
};

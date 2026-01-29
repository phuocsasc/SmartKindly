// server/src/controllers/parentRequestController.js

import { StatusCodes } from 'http-status-codes';
import { parentRequestServices } from '~/services/parentRequestServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentRequestServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo phiếu dặn dò thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentRequestServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách phiếu dặn dò thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getMyRequests = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentRequestServices.getMyRequests(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách phiếu dặn dò của con thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentRequestServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy chi tiết phiếu dặn dò thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentRequestServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật phiếu dặn dò thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteRequest = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await parentRequestServices.deleteRequest(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa phiếu dặn dò thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const getAccessibleClassesList = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await parentRequestServices.getAccessibleClassesList(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const parentRequestController = {
    createNew,
    getAll,
    getMyRequests,
    getDetails,
    update,
    deleteRequest,
    getAccessibleClassesList,
};

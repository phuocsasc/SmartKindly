import { StatusCodes } from 'http-status-codes';
import { childrenManagementServices } from '~/services/childrenManagementServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenManagementServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo thông tin trẻ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenManagementServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách trẻ toàn trường thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenManagementServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy chi tiết thông tin trẻ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenManagementServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật thông tin trẻ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteChild = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenManagementServices.deleteChild(req.params.id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteMany = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenManagementServices.deleteMany(req.body.ids, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const importBulk = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenManagementServices.importBulk(req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Import danh sách trẻ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const childrenManagementController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteChild,
    deleteMany,
    importBulk,
};

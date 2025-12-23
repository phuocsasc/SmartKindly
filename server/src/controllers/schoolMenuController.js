import { StatusCodes } from 'http-status-codes';
import { schoolMenuServices } from '~/services/schoolMenuServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo thực đơn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách thực đơn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy chi tiết thực đơn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật thực đơn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteMenu = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await schoolMenuServices.deleteMenu(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa thực đơn thành công!',
        });
    } catch (error) {
        next(error);
    }
};

export const schoolMenuController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteMenu,
};

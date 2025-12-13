// server/src/controllers/foodController.js

import { StatusCodes } from 'http-status-codes';
import { foodServices } from '~/services/foodServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await foodServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo thực phẩm thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await foodServices.getAll(req.query);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách thực phẩm thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const result = await foodServices.getDetails(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin thực phẩm thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await foodServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật thực phẩm thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteFood = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await foodServices.deleteFood(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa thực phẩm thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const deleteManyFoods = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { ids } = req.body;
        const result = await foodServices.deleteManyFoods(ids, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

const importBulk = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await foodServices.importBulk(req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Import thực phẩm thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const foodController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteFood,
    deleteManyFoods,
    importBulk,
};

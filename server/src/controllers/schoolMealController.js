// server/src/controllers/schoolMealController.js

import { StatusCodes } from 'http-status-codes';
import { schoolMealServices } from '~/services/schoolMealServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMealServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo món ăn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMealServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách món ăn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMealServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin món ăn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMealServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật món ăn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteMeal = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMealServices.deleteMeal(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa món ăn thành công!',
            // ✅ ADD: Thêm mealInfo để audit log có thể access
            mealInfo: result.mealInfo,
        });
    } catch (error) {
        next(error);
    }
};

const searchFoods = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMealServices.searchFoods(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Tìm kiếm thực phẩm thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const schoolMealController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteMeal,
    searchFoods,
};

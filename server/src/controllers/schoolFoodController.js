// server/src/controllers/schoolFoodController.js

import { StatusCodes } from 'http-status-codes';
import { schoolFoodServices } from '~/services/schoolFoodServices.js';

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolFoodServices.getAll(req.query, userId);
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
        const userId = req.jwtDecoded.id;
        const result = await schoolFoodServices.getDetails(req.params.id, userId);
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
        const result = await schoolFoodServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật thực phẩm thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Check và sync nếu cần (lần đầu)
const checkAndSync = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolFoodServices.checkAndSync(userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            data: { synced: result.synced },
        });
    } catch (error) {
        next(error);
    }
};

// ✅ NEW: Force sync tất cả thực phẩm
const forceSync = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolFoodServices.forceSync(userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            data: {
                synced: result.synced,
                total: result.total,
                upserted: result.upserted,
                modified: result.modified,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const schoolFoodController = {
    getAll,
    getDetails,
    update,
    checkAndSync,
    forceSync, // ✅ NEW
};

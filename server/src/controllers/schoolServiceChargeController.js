// server/src/controllers/schoolServiceChargeController.js

import { StatusCodes } from 'http-status-codes';
import { schoolServiceChargeServices } from '~/services/schoolServiceChargeServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolServiceChargeServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo tiền dịch vụ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolServiceChargeServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách tiền dịch vụ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolServiceChargeServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin tiền dịch vụ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolServiceChargeServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật tiền dịch vụ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteServiceCharge = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await schoolServiceChargeServices.deleteServiceCharge(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa tiền dịch vụ thành công!',
        });
    } catch (error) {
        next(error);
    }
};

export const schoolServiceChargeController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteServiceCharge,
};

import { StatusCodes } from 'http-status-codes';
import { departmentServices } from '~/services/departmentServices';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await departmentServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo tổ bộ môn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await departmentServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách tổ bộ môn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await departmentServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin tổ bộ môn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await departmentServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật tổ bộ môn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await departmentServices.deleteDepartment(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa tổ bộ môn thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const getAvailableManagers = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { departmentName } = req.query;

        if (!departmentName) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Tên tổ bộ môn là bắt buộc',
            });
        }

        const result = await departmentServices.getAvailableManagers(departmentName, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách cán bộ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const departmentController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteDepartment,
    getAvailableManagers,
};

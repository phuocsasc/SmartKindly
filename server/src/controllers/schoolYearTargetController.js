import { StatusCodes } from 'http-status-codes';
import { schoolYearTargetServices } from '~/services/schoolYearTargetServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolYearTargetServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo mục tiêu năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolYearTargetServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách mục tiêu năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolYearTargetServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin mục tiêu năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolYearTargetServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật mục tiêu năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteTarget = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await schoolYearTargetServices.deleteTarget(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa mục tiêu năm học thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const copyFromYear = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolYearTargetServices.copyFromYear(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Copy mục tiêu từ năm học cũ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const initializeDefaults = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolYearTargetServices.initializeDefaultTargets(req.body.academicYearId, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Khởi tạo mục tiêu mặc định thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
const getSystemPreview = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolYearTargetServices.getSystemPreview(userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin xem trước từ hệ thống thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
const copyFromSystem = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolYearTargetServices.copyFromSystem(req.body.academicYearId, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Copy mục tiêu từ hệ thống thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const schoolYearTargetController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteTarget,
    copyFromYear,
    copyFromSystem, // ✅ Add new function
    getSystemPreview,
    initializeDefaults,
};

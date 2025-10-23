import { StatusCodes } from 'http-status-codes';
import { academicYearServices } from '~/services/academicYearServices';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await academicYearServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo mới năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id; // ✅ Thêm userId
        const result = await academicYearServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id; // ✅ Thêm userId
        const result = await academicYearServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id; // ✅ Thêm userId
        const result = await academicYearServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteAcademicYear = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id; // ✅ Thêm userId
        await academicYearServices.deleteAcademicYear(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa năm học thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const setActive = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id; // ✅ Thêm userId
        const result = await academicYearServices.setActive(req.params.id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const academicYearController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteAcademicYear,
    setActive,
};

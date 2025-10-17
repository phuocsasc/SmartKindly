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
        const result = await academicYearServices.getAll(req.query);
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
        const result = await academicYearServices.getDetails(req.params.id);
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
        const result = await academicYearServices.update(req.params.id, req.body);
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
        await academicYearServices.deleteAcademicYear(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Xóa năm học thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const setActive = async (req, res, next) => {
    try {
        const result = await academicYearServices.setActive(req.params.id);
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

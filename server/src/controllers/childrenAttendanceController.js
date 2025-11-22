import { StatusCodes } from 'http-status-codes';
import { childrenAttendanceServices } from '~/services/childrenAttendanceServices';

const bulkAttendance = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenAttendanceServices.bulkAttendance(req.body, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAttendanceByClass = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenAttendanceServices.getAttendanceByClass(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy dữ liệu điểm danh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateAttendance = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenAttendanceServices.updateAttendance(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật điểm danh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteAttendance = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenAttendanceServices.deleteAttendance(req.params.id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const getAccessibleClassesList = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await childrenAttendanceServices.getAccessibleClassesList(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getWeeksList = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await childrenAttendanceServices.getWeeksList(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách tuần thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const childrenAttendanceController = {
    bulkAttendance,
    getAttendanceByClass,
    updateAttendance,
    deleteAttendance,
    getAccessibleClassesList,
    getWeeksList,
};

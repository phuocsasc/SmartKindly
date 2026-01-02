import { StatusCodes } from 'http-status-codes';
import { childrenAttendanceServices } from '~/services/childrenAttendanceServices.js';

// ✅ Điểm danh hàng loạt trong ngày (chỉ năm active)
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

// ✅ Lấy dữ liệu điểm danh theo lớp/tuần hoặc theo ngày
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

// ✅ Cập nhật 1 bản ghi điểm danh (chỉ năm active)
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

// ✅ Xóa 1 bản ghi điểm danh (chỉ năm active)
const deleteAttendance = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenAttendanceServices.deleteAttendance(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Lấy danh sách lớp theo năm học hiện tại (theo quyền truy cập)
const getAccessibleClassesList = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await childrenAttendanceServices.getAccessibleClassesList(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Lấy danh sách tuần + ngày nghỉ (Mon-Fri)
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
    getAccessibleClassesList,
    getWeeksList,
    bulkAttendance,
    getAttendanceByClass,
    updateAttendance,
    deleteAttendance,
};

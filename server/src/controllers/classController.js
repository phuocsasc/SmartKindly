import { StatusCodes } from 'http-status-codes';
import { classServices } from '~/services/classServices';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await classServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo mới lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await classServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await classServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await classServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteClass = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await classServices.deleteClass(req.params.id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const getAvailableTeachers = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId, currentClassId } = req.query;

        if (!academicYearId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Năm học là bắt buộc',
            });
        }

        const result = await classServices.getAvailableTeachers(academicYearId, userId, currentClassId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách giáo viên thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAgeGroupsByGrade = async (req, res, next) => {
    try {
        const { grade } = req.query;

        if (!grade) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Khối là bắt buộc',
            });
        }

        const result = classServices.getAgeGroupsByGrade(grade);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách nhóm lớp thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const copyFromYear = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await classServices.copyFromYear(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Copy lớp học từ năm học cũ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const classController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteClass,
    getAvailableTeachers,
    getAgeGroupsByGrade,
    copyFromYear,
};

import { StatusCodes } from 'http-status-codes';
import { childrenByClassServices } from '~/services/childrenByClassServices.js';

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenByClassServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách trẻ theo lớp thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAvailableStudents = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId, classId } = req.query;
        const result = await childrenByClassServices.getAvailableStudents(academicYearId, classId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách trẻ chưa có lớp thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const addStudentsToClass = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenByClassServices.addStudentsToClass(req.body, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const getAvailableClassesForTransfer = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId, fromClassId, studentIds } = req.query;
        const studentIdsArray = studentIds ? studentIds.split(',') : [];
        const result = await childrenByClassServices.getAvailableClassesForTransfer(
            academicYearId,
            fromClassId,
            studentIdsArray,
            userId,
        );
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp phù hợp thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const transferStudents = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenByClassServices.transferStudents(req.body, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const removeStudentFromClass = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { id } = req.params;
        const result = await childrenByClassServices.removeStudentFromClass(id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const removeStudentsFromClass = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenByClassServices.removeStudentsFromClass(req.body.ids, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const childrenByClassController = {
    getAll,
    getAvailableStudents,
    addStudentsToClass,
    getAvailableClassesForTransfer,
    transferStudents,
    removeStudentFromClass,
    removeStudentsFromClass,
};

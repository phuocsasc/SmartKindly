import { StatusCodes } from 'http-status-codes';
import { childrenProfileServices } from '~/services/childrenProfileServices';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenProfileServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo hồ sơ trẻ em thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenProfileServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách hồ sơ trẻ em thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenProfileServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin hồ sơ trẻ em thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenProfileServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật hồ sơ trẻ em thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteProfile = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenProfileServices.deleteProfile(req.params.id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

// ✅ Lấy danh sách nhóm tuổi accessible
const getAccessibleAgeGroups = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;

        const result = await childrenProfileServices.getAccessibleAgeGroups(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách nhóm tuổi thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Lấy danh sách lớp theo age group
const getClassesByAgeGroup = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId, ageGroup } = req.query;

        const result = await childrenProfileServices.getClassesByAgeGroup(academicYearId, ageGroup, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const childrenProfileController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteProfile,
    getAccessibleAgeGroups,
    getClassesByAgeGroup,
};

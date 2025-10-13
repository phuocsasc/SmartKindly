import { StatusCodes } from 'http-status-codes';
import { schoolServices } from '~/services/schoolServices';

const createNew = async (req, res, next) => {
    try {
        const result = await schoolServices.createNew(req.body);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo mới trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await schoolServices.getAll(req.query);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const result = await schoolServices.getDetails(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await schoolServices.update(req.params.id, req.body);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteSchool = async (req, res, next) => {
    try {
        await schoolServices.deleteSchool(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Xóa trường học thành công!',
        });
    } catch (error) {
        next(error);
    }
};

export const schoolController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteSchool,
};

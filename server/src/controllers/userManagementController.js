import { StatusCodes } from 'http-status-codes';
import { userManagementServices } from '~/services/userManagementServices';

const createNew = async (req, res, next) => {
    try {
        const result = await userManagementServices.createNew(req.body);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo mới người dùng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await userManagementServices.getAll(req.query);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách người dùng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const result = await userManagementServices.getDetails(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin người dùng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await userManagementServices.update(req.params.id, req.body);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật người dùng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        await userManagementServices.deleteUser(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Xóa người dùng thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const deleteManyUsers = async (req, res, next) => {
    try {
        const result = await userManagementServices.deleteManyUsers(req.body.ids);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await userManagementServices.changePassword(req.params.id, currentPassword, newPassword);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const result = await userManagementServices.resetPassword(req.params.id);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const userManagementController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteUser,
    deleteManyUsers,
    changePassword,
    resetPassword,
};

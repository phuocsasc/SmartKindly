import { StatusCodes } from 'http-status-codes';
import { userManagementServices } from '~/services/userManagementServices';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
    try {
        const schoolScope = req.schoolScope;
        const result = await userManagementServices.createNew(req.body, schoolScope);
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
        const schoolScope = req.schoolScope;
        const result = await userManagementServices.getAll(req.query, schoolScope);
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
        const schoolScope = req.schoolScope;
        const result = await userManagementServices.update(req.params.id, req.body, schoolScope);
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
        const schoolScope = req.schoolScope;
        await userManagementServices.deleteUser(req.params.id, schoolScope);
        res.status(StatusCodes.OK).json({
            message: 'Xóa người dùng thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const deleteManyUsers = async (req, res, next) => {
    try {
        const schoolScope = req.schoolScope;
        const result = await userManagementServices.deleteManyUsers(req.body.ids, schoolScope);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id; // User đang đăng nhập
        const targetUserId = req.params.id; // User muốn đổi mật khẩu

        // Chỉ cho phép user đổi mật khẩu của chính mình
        if (userId !== targetUserId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn chỉ có thể đổi mật khẩu của chính mình');
        }

        const { currentPassword, newPassword } = req.body;
        const result = await userManagementServices.changePassword(targetUserId, currentPassword, newPassword);
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
};

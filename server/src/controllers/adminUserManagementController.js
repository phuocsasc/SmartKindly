import { StatusCodes } from 'http-status-codes';
import { adminUserManagementServices } from '~/services/adminUserManagementServices';

const createNew = async (req, res, next) => {
    try {
        const result = await adminUserManagementServices.createNew(req.body);
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
        const result = await adminUserManagementServices.getAll(req.query);
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
        const result = await adminUserManagementServices.getDetails(req.params.id);
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
        const requestUser = req.jwtDecoded; // User đang đăng nhập
        const result = await adminUserManagementServices.update(req.params.id, req.body, requestUser);
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
        const requestUser = req.jwtDecoded; // User đang đăng nhập
        await adminUserManagementServices.deleteUser(req.params.id, requestUser);
        res.status(StatusCodes.OK).json({
            message: 'Xóa người dùng thành công!',
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Xóa nhiều users
const deleteManyUsers = async (req, res, next) => {
    try {
        const requestUser = req.jwtDecoded;
        const result = await adminUserManagementServices.deleteManyUsers(req.body.ids, requestUser);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const adminUserManagementController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteUser,
    deleteManyUsers, // ✅ Export thêm
};

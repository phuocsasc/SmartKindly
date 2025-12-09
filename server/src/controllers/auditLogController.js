import { StatusCodes } from 'http-status-codes';
import { auditLogServices } from '~/services/auditLogServices.js';

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await auditLogServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lịch sử thao tác thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await auditLogServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy chi tiết lịch sử thao tác thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteLog = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await auditLogServices.deleteLog(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa lịch sử thao tác thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const deleteManyLogs = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { ids } = req.body;
        const result = await auditLogServices.deleteManyLogs(ids, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            data: { deletedCount: result.deletedCount },
        });
    } catch (error) {
        next(error);
    }
};

export const auditLogController = {
    getAll,
    getDetails,
    deleteLog,
    deleteManyLogs,
};

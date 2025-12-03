import { StatusCodes } from 'http-status-codes';
import { notificationServices } from '~/services/notificationServices';

const getNotifications = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await notificationServices.getNotifications(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách thông báo thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const count = await notificationServices.getUnreadCount(userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy số lượng thông báo chưa đọc thành công!',
            data: { unreadCount: count },
        });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await notificationServices.markAsRead(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Đánh dấu thông báo đã đọc thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await notificationServices.markAllAsRead(userId);
        res.status(StatusCodes.OK).json({
            message: 'Đánh dấu tất cả thông báo đã đọc thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const notificationController = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};

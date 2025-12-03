import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import { NotificationModel } from '~/models/notificationModel';
import { UserModel } from '~/models/userModel';
import { emitToUser } from '~/sockets';

/**
 * ✅ Tạo thông báo mới và gửi realtime
 */
const createNotification = async (data) => {
    try {
        console.log('📥 [Notification createNotification] Creating notification:', data);

        // ✅ Validate recipient
        const recipient = await UserModel.findById(data.recipientUserId).select('_id schoolId');
        if (!recipient) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Người nhận không tồn tại');
        }

        // ✅ Create notification
        const notification = await NotificationModel.create({
            recipientUserId: data.recipientUserId,
            schoolId: data.schoolId || recipient.schoolId,
            title: data.title,
            message: data.message,
            meta: data.meta || {},
        });

        console.log('✅ [Notification] Created:', notification._id);

        // ✅ Emit realtime notification
        emitToUser(data.recipientUserId.toString(), 'newNotification', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            meta: notification.meta,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
        });

        return notification;
    } catch (error) {
        console.error('❌ [Notification createNotification] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo thông báo');
    }
};

/**
 * ✅ Lấy danh sách thông báo của user
 */
const getNotifications = async (query, userId) => {
    try {
        const { page = 1, limit = 20, isRead } = query;

        const user = await UserModel.findById(userId).select('schoolId');
        if (!user) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Người dùng không tồn tại');
        }

        let filter = {
            recipientUserId: userId,
            _destroy: false,
        };

        // ✅ Filter by read status
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

        const totalItems = await NotificationModel.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / limit);

        const notifications = await NotificationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        console.log(`✅ [Notification getNotifications] Found ${notifications.length} notifications`);

        return {
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                totalItems,
            },
        };
    } catch (error) {
        console.error('❌ [Notification getNotifications] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách thông báo');
    }
};

/**
 * ✅ Đếm số thông báo chưa đọc
 */
const getUnreadCount = async (userId) => {
    try {
        const count = await NotificationModel.countDocuments({
            recipientUserId: userId,
            isRead: false,
            _destroy: false,
        });

        console.log(`✅ [Notification getUnreadCount] User ${userId} has ${count} unread notifications`);
        return count;
    } catch (error) {
        console.error('❌ [Notification getUnreadCount] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đếm thông báo chưa đọc');
    }
};

/**
 * ✅ Đánh dấu 1 thông báo đã đọc
 */
const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await NotificationModel.findOne({
            _id: notificationId,
            recipientUserId: userId,
            _destroy: false,
        });

        if (!notification) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông báo');
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
            console.log(`✅ [Notification markAsRead] Marked ${notificationId} as read`);
        }

        return notification;
    } catch (error) {
        console.error('❌ [Notification markAsRead] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đánh dấu đã đọc');
    }
};

/**
 * ✅ Đánh dấu tất cả thông báo đã đọc
 */
const markAllAsRead = async (userId) => {
    try {
        const result = await NotificationModel.updateMany(
            {
                recipientUserId: userId,
                isRead: false,
                _destroy: false,
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date(),
                },
            },
        );

        console.log(`✅ [Notification markAllAsRead] Marked ${result.modifiedCount} notifications as read`);
        return { modifiedCount: result.modifiedCount };
    } catch (error) {
        console.error('❌ [Notification markAllAsRead] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đánh dấu tất cả đã đọc');
    }
};

export const notificationServices = {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};

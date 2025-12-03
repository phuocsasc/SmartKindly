import express from 'express';
import { notificationController } from '~/controllers/notificationController';
import { authMiddleware } from '~/middlewares/authMiddleware';

const Router = express.Router();

// ✅ Lấy danh sách thông báo
Router.route('/').get(authMiddleware.isAuthorized, notificationController.getNotifications);

// ✅ Lấy số lượng chưa đọc
Router.route('/unread-count').get(authMiddleware.isAuthorized, notificationController.getUnreadCount);

// ✅ Đánh dấu tất cả đã đọc
Router.route('/mark-all-read').patch(authMiddleware.isAuthorized, notificationController.markAllAsRead);

// ✅ Đánh dấu 1 thông báo đã đọc
Router.route('/:id/read').patch(authMiddleware.isAuthorized, notificationController.markAsRead);

export const notificationRoute = Router;

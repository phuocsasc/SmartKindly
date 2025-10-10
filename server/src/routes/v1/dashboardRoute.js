import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { dashboardController } from '~/controllers/dashboardController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware_Level_2 } from '~/middlewares/rbacMiddleware-level-2';

const Router = express.Router();

Router.route('/access').get(authMiddleware.isAuthorized, dashboardController.access);

// Ví dụ API /messages cần quyền admin hoặc moderator để truy cập:
Router.route('/messages').get(
    authMiddleware.isAuthorized,
    rbacMiddleware_Level_2.isValidPermission(['read_messages']),
    (req, res) => {
        res.status(StatusCodes.OK).json({ message: 'Truy cập API GET: /message thành công!' });
    },
);

// Ví dụ API /admin-tools cần quyền admin hoặc moderator để truy cập:
Router.route('/admin-tools').get(
    authMiddleware.isAuthorized,
    rbacMiddleware_Level_2.isValidPermission(['read_admin_tools']),
    (req, res) => {
        res.status(StatusCodes.OK).json({ message: 'Truy cập API GET: /admin-tools thành công!' });
    },
);

export const dashboardRoute = Router;

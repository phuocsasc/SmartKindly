import express from 'express';
import { schoolMenuAiController } from '~/controllers/schoolMenuAiController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';

const Router = express.Router();

Router.route('/balance-menu').post(authMiddleware.isAuthorized, schoolMenuAiController.balanceMenuWithAi);

export const schoolMenuAiRoute = Router;

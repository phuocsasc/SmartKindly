// server/src/routes/v1/chatbotRoute.js

import express from 'express';
import { chatbotController } from '~/controllers/chatbotController.js';
import { chatbotValidation } from '~/validations/chatbotValidation.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';

const Router = express.Router();

Router.route('/conversations')
    .get(authMiddleware.isAuthorized, chatbotController.getAllConversations)
    .post(authMiddleware.isAuthorized, chatbotController.createConversation);

Router.route('/conversations/:id')
    .get(authMiddleware.isAuthorized, chatbotController.getConversationDetails)
    .delete(authMiddleware.isAuthorized, chatbotController.deleteConversation);

Router.route('/send-message').post(
    authMiddleware.isAuthorized,
    chatbotValidation.sendMessage,
    chatbotController.sendMessage,
);

export const chatbotRoute = Router;

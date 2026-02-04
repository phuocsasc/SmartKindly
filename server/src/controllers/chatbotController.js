// server/src/controllers/chatbotController.js

import { StatusCodes } from 'http-status-codes';
import { chatbotServices } from '~/services/chatbotServices.js';

const createConversation = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await chatbotServices.createConversation(userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo cuộc trò chuyện thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAllConversations = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await chatbotServices.getAllConversations(userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách cuộc trò chuyện thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getConversationDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await chatbotServices.getConversationDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy chi tiết cuộc trò chuyện thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const sendMessage = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { conversationId, message } = req.body;
        const result = await chatbotServices.sendMessage(conversationId, message, userId);
        res.status(StatusCodes.OK).json({
            message: 'Gửi tin nhắn thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteConversation = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await chatbotServices.deleteConversation(req.params.id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const chatbotController = {
    createConversation,
    getAllConversations,
    getConversationDetails,
    sendMessage,
    deleteConversation,
};

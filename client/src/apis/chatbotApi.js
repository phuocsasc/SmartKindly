// client/src/apis/chatbotApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const chatbotApi = {
    // Tạo cuộc trò chuyện mới
    createConversation: async () => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/chatbot/conversations`);
    },

    // Lấy danh sách cuộc trò chuyện
    getAllConversations: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/chatbot/conversations`);
    },

    // Lấy chi tiết cuộc trò chuyện
    getConversationDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/chatbot/conversations/${id}`);
    },

    // Gửi tin nhắn
    sendMessage: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/chatbot/send-message`, data);
    },

    // Xóa cuộc trò chuyện
    deleteConversation: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/chatbot/conversations/${id}`);
    },
};

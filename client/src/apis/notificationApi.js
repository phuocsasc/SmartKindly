import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const notificationApi = {
    // Lấy danh sách thông báo
    getAll: async (params) => {
        const { page = 1, limit = 20, isRead } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/notifications`, {
            params: { page, limit, isRead },
        });
    },

    // Lấy số lượng chưa đọc
    getUnreadCount: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/notifications/unread-count`);
    },

    // Đánh dấu 1 thông báo đã đọc
    markAsRead: async (id) => {
        return await authorizedAxiosInstance.patch(`${API_ROOT}/v1/notifications/${id}/read`);
    },

    // Đánh dấu tất cả đã đọc
    markAllAsRead: async () => {
        return await authorizedAxiosInstance.patch(`${API_ROOT}/v1/notifications/mark-all-read`);
    },
};

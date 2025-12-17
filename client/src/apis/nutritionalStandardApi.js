// client/src/apis/nutritionalStandardApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const nutritionalStandardApi = {
    // Lấy danh sách định mức dinh dưỡng
    getAll: async (params) => {
        const { page = 1, limit = 20, ageGroup = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/nutritional-standards`, {
            params: { page, limit, ageGroup },
        });
    },

    // Lấy chi tiết định mức dinh dưỡng
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/nutritional-standards/${id}`);
    },

    // Tạo định mức dinh dưỡng mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/nutritional-standards`, data);
    },

    // Cập nhật định mức dinh dưỡng
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/nutritional-standards/${id}`, data);
    },

    // Xóa định mức dinh dưỡng
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/nutritional-standards/${id}`);
    },
};

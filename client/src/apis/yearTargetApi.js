// client/src/apis/yearTargetApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const yearTargetApi = {
    // Lấy danh sách mục tiêu năm học
    getAll: async (params) => {
        const { page = 1, limit = 10, ageGroup = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/year-targets`, {
            params: { page, limit, ageGroup },
        });
    },

    // Lấy chi tiết mục tiêu năm học
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/year-targets/${id}`);
    },

    // Tạo mục tiêu năm học mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/year-targets`, data);
    },

    // Cập nhật mục tiêu năm học
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/year-targets/${id}`, data);
    },

    // Xóa mục tiêu năm học
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/year-targets/${id}`);
    },
};

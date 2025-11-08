// client/src/apis/educationalActivityApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const educationalActivityApi = {
    // Lấy danh sách hoạt động giáo dục
    getAll: async (params) => {
        const { page = 1, limit = 100, ageGroup = '', targetCode = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/educational-activities`, {
            params: { page, limit, ageGroup, targetCode },
        });
    },

    // Lấy hoạt động theo targetCode
    getByTargetCode: async (params) => {
        const { ageGroup, targetCode } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/educational-activities/by-target`, {
            params: { ageGroup, targetCode },
        });
    },

    // Lấy chi tiết hoạt động giáo dục
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/educational-activities/${id}`);
    },

    // Tạo hoạt động giáo dục mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/educational-activities`, data);
    },

    // Cập nhật hoạt động giáo dục
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/educational-activities/${id}`, data);
    },

    // Xóa hoạt động giáo dục
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/educational-activities/${id}`);
    },
};

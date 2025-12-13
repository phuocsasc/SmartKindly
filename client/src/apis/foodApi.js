// client/src/apis/foodApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const foodApi = {
    // Lấy danh sách thực phẩm
    getAll: async (params) => {
        const { page = 1, limit = 20, search = '', category = '', unit = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/foods`, {
            params: { page, limit, search, category, unit },
        });
    },

    // Lấy chi tiết thực phẩm
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/foods/${id}`);
    },

    // Tạo thực phẩm mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/foods`, data);
    },

    // Cập nhật thực phẩm
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/foods/${id}`, data);
    },

    // Xóa thực phẩm
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/foods/${id}`);
    },

    // ✅ Xóa nhiều thực phẩm
    deleteMany: async (ids) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/foods/delete-many`, { ids });
    },

    // Import bulk from Excel
    importBulk: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/foods/import-bulk`, data);
    },
};

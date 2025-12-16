// client/src/apis/schoolMealApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolMealApi = {
    // Lấy danh sách món ăn
    getAll: async (params) => {
        const { page = 1, limit = 20, search = '', mealType = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-meals`, {
            params: { page, limit, search, mealType },
        });
    },

    // Lấy chi tiết món ăn
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-meals/${id}`);
    },

    // Tạo món ăn mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-meals`, data);
    },

    // Cập nhật món ăn
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/school-meals/${id}`, data);
    },

    // Xóa món ăn
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/school-meals/${id}`);
    },

    // Search thực phẩm
    searchFoods: async (search = '', limit = 20) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-meals/search-foods`, {
            params: { search, limit },
        });
    },
};

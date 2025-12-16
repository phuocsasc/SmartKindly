// client/src/apis/schoolFoodApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolFoodApi = {
    // Lấy danh sách thực phẩm của trường
    getAll: async (params) => {
        const { page = 1, limit = 20, search = '', category = '', unit = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-foods`, {
            params: { page, limit, search, category, unit },
        });
    },

    // Lấy chi tiết thực phẩm
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-foods/${id}`);
    },

    // Cập nhật thực phẩm (chỉ BGH)
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/school-foods/${id}`, data);
    },

    // Kiểm tra và sync nếu cần (lần đầu)
    checkAndSync: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-foods/check-sync`);
    },

    // ✅ NEW: Force sync tất cả thực phẩm
    forceSync: async () => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-foods/force-sync`);
    },
};

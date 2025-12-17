// client/src/apis/schoolNutritionalStandardApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolNutritionalStandardApi = {
    // Lấy danh sách định mức dinh dưỡng của trường
    getAll: async (params) => {
        const { page = 1, limit = 20, ageGroup = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-nutritional-standards`, {
            params: { page, limit, ageGroup },
        });
    },

    // Lấy chi tiết định mức dinh dưỡng
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-nutritional-standards/${id}`);
    },

    // Cập nhật định mức dinh dưỡng (chỉ chọn PLG structure)
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/school-nutritional-standards/${id}`, data);
    },

    // Kiểm tra và đồng bộ lần đầu
    checkAndSync: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-nutritional-standards/check-sync`);
    },

    // Force sync (đồng bộ tất cả)
    forceSync: async () => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-nutritional-standards/force-sync`);
    },
};

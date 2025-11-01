// client/src/apis/personnelEvaluationApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const personnelEvaluationApi = {
    // Lấy danh sách đánh giá
    getAll: async (params) => {
        const { page = 1, limit = 10, search = '', academicYearId = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/personnel-evaluations`, {
            params: { page, limit, search, academicYearId },
        });
    },

    // Lấy chi tiết đánh giá
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/personnel-evaluations/${id}`);
    },

    // Cập nhật đánh giá
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/personnel-evaluations/${id}`, data);
    },
};

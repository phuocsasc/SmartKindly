// client/src/apis/schoolServiceChargeApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolServiceChargeApi = {
    // Lấy danh sách tiền dịch vụ
    getAll: async (params) => {
        const { page = 1, limit = 20, search = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-service-charges`, {
            params: { page, limit, search },
        });
    },

    // Lấy chi tiết tiền dịch vụ
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-service-charges/${id}`);
    },

    // Tạo tiền dịch vụ mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-service-charges`, data);
    },

    // Cập nhật tiền dịch vụ
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/school-service-charges/${id}`, data);
    },

    // Xóa tiền dịch vụ
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/school-service-charges/${id}`);
    },
};

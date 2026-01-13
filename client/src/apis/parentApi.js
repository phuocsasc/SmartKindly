// client/src/apis/parentApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const parentApi = {
    // Lấy danh sách phụ huynh
    getAll: async (params) => {
        const { page = 1, limit = 10, search = '', status = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-managements`, {
            params: { page, limit, search, status },
        });
    },

    // Lấy chi tiết phụ huynh
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-managements/${id}`);
    },

    // Lấy danh sách học sinh chưa có tài khoản phụ huynh
    getAvailableStudents: async (params) => {
        const { page = 1, limit = 10, search = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-managements/available-students`, {
            params: { page, limit, search },
        });
    },

    // Tạo tài khoản phụ huynh
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/parent-managements`, data);
    },

    // Cập nhật thông tin phụ huynh
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/parent-managements/${id}`, data);
    },

    // Xóa phụ huynh
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/parent-managements/${id}`);
    },

    // Xóa nhiều phụ huynh
    deleteMany: async (ids) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/parent-managements/delete-many`, { ids });
    },
};

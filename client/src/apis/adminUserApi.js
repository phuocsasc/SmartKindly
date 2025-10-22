import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const adminUserApi = {
    // Lấy danh sách người dùng toàn hệ thống
    getAll: async (params) => {
        const { page = 1, limit = 10, search = '', role = '', status = '', schoolId = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/admin/users`, {
            params: { page, limit, search, role, status, schoolId },
        });
    },

    // Lấy chi tiết người dùng
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/admin/users/${id}`);
    },

    // Tạo người dùng mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/admin/users`, data);
    },

    // Cập nhật người dùng
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/admin/users/${id}`, data);
    },

    // Xóa người dùng
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/admin/users/${id}`);
    },

    // ✅ Xóa nhiều người dùng cùng lúc
    deleteManyUsers: async (ids) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/admin/users/delete-many`, { ids });
    },
};

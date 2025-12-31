import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const childrenManagementApi = {
    // Lấy danh sách trẻ toàn trường
    getAll: async (params) => {
        const { page = 1, limit = 10, search = '', status = '', hasClass = '', ageGroup = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-managements`, {
            params: { page, limit, search, status, hasClass, ageGroup },
        });
    },

    // Lấy chi tiết trẻ
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-managements/${id}`);
    },

    // Tạo trẻ mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-managements`, data);
    },

    // Cập nhật thông tin trẻ
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/children-managements/${id}`, data);
    },

    // Xóa 1 trẻ
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/children-managements/${id}`);
    },

    // Xóa nhiều trẻ
    deleteMany: async (ids) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-managements/delete-many`, { ids });
    },

    // Import bulk children
    importBulk: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-managements/import-bulk`, data);
    },
};

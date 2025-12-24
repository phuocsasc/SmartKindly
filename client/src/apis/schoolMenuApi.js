import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolMenuApi = {
    // Lấy danh sách thực đơn
    getAll: async (params) => {
        const { page = 1, limit = 20, search = '', ageGroup } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-menus`, {
            params: { page, limit, search, ageGroup },
        });
    },

    // Lấy chi tiết thực đơn
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-menus/${id}`);
    },

    // Tạo thực đơn mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-menus`, data);
    },

    // Cập nhật thực đơn
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/school-menus/${id}`, data);
    },

    // Xóa thực đơn
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/school-menus/${id}`);
    },
};

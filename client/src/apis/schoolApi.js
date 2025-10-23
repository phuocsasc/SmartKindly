import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolApi = {
    // Lấy danh sách trường học
    getAll: async (params) => {
        const { page = 1, limit = 10, search = '', status = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/schools`, {
            params: { page, limit, search, status },
        });
    },

    // Lấy chi tiết trường học
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/schools/${id}`);
    },

    // ✅ Lấy thông tin trường của user hiện tại
    getSchoolInfo: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/schools/my-school`);
    },

    // ✅ Cập nhật thông tin trường của user hiện tại
    updateSchoolInfo: async (data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/schools/my-school`, data);
    },

    // Tạo trường học mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/schools`, data);
    },

    // Cập nhật trường học
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/schools/${id}`, data);
    },

    // Xóa trường học
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/schools/${id}`);
    },
};

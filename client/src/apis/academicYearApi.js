import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const academicYearApi = {
    // Lấy danh sách năm học
    getAll: async (params) => {
        const { page = 1, limit = 10, status = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/academic-years`, {
            params: { page, limit, status },
        });
    },

    // Lấy chi tiết năm học
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/academic-years/${id}`);
    },

    // Tạo năm học mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/academic-years`, data);
    },

    // Cập nhật năm học
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/academic-years/${id}`, data);
    },

    // Xóa năm học
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/academic-years/${id}`);
    },

    // Kích hoạt năm học
    setActive: async (id) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/academic-years/${id}/set-active`);
    },
};

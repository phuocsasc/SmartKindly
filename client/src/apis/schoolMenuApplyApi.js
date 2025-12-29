import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolMenuApplyApi = {
    // Lấy danh sách thực đơn áp dụng
    getAll: async (params) => {
        const { page = 1, limit = 100, academicYearId, ageGroup, weekNumber } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-menu-applies`, {
            params: { page, limit, academicYearId, ageGroup, weekNumber },
        });
    },

    // Lấy chi tiết thực đơn áp dụng
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-menu-applies/${id}`);
    },

    // Tạo thực đơn áp dụng mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-menu-applies`, data);
    },

    // Cập nhật thực đơn áp dụng
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/school-menu-applies/${id}`, data);
    },

    // Xóa thực đơn áp dụng
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/school-menu-applies/${id}`);
    },

    // Lấy danh sách tuần khả dụng
    getAvailableWeeks: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-menu-applies/available-weeks`, {
            params: { academicYearId },
        });
    },

    // Lấy danh sách ngày khả dụng
    getAvailableDays: async (academicYearId, weekNumber) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-menu-applies/available-days`, {
            params: { academicYearId, weekNumber },
        });
    },

    // Lấy danh sách thực đơn khả dụng
    getAvailableMenus: async (ageGroup) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-menu-applies/available-menus`, {
            params: { ageGroup },
        });
    },
};

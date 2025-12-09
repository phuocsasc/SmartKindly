import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const auditLogApi = {
    // Lấy danh sách lịch sử thao tác
    getAll: async (params) => {
        const {
            page = 1,
            limit = 20,
            action = '',
            resource = '',
            userName = '',
            userRole = '',
            startDate = '',
            endDate = '',
        } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/audit-logs`, {
            params: { page, limit, action, resource, userName, userRole, startDate, endDate },
        });
    },

    // Lấy chi tiết lịch sử thao tác
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/audit-logs/${id}`);
    },

    // Xóa lịch sử thao tác
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/audit-logs/${id}`);
    },

    // Xóa nhiều lịch sử thao tác
    deleteMany: async (ids) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/audit-logs/delete-many`, { ids });
    },
};
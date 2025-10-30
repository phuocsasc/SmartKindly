import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const personnelRecordApi = {
    // Lấy danh sách hồ sơ cán bộ
    getAll: async (params) => {
        const { page = 1, limit = 10, search = '', department = '', workStatus = '', positionGroup = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/personnel-records`, {
            params: { page, limit, search, department, workStatus, positionGroup },
        });
    },

    // Lấy chi tiết hồ sơ cán bộ
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/personnel-records/${id}`);
    },

    // Tạo hồ sơ cán bộ mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/personnel-records`, data);
    },

    // Cập nhật hồ sơ cán bộ
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/personnel-records/${id}`, data);
    },

    // Xóa hồ sơ cán bộ
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/personnel-records/${id}`);
    },
};

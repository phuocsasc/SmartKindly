import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const childrenProgramCompleteApi = {
    // CRUD
    getAll: async (params) => {
        const { page = 1, limit = 10, academicYearId = '', classId = '', search = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-program-completes`, {
            params: { page, limit, academicYearId, classId, search },
        });
    },

    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-program-completes/${id}`);
    },

    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-program-completes`, data);
    },

    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/children-program-completes/${id}`, data);
    },

    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/children-program-completes/${id}`);
    },

    // Config
    getConfigByYear: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-program-completes/config`, {
            params: { academicYearId },
        });
    },

    upsertConfig: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-program-completes/config`, data);
    },
};

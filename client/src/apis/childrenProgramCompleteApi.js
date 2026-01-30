// client/src/apis/childrenProgramCompleteApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const childrenProgramCompleteApi = {
    // ✅ CRUD Endpoints
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

    // ✅ Config Endpoints (BGH only)
    getConfigByYear: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-program-completes/config`, {
            params: { academicYearId },
        });
    },

    upsertConfig: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-program-completes/config`, data);
    },

    deleteConfig: async (ageGroup, academicYearId) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/children-program-completes/config`, {
            params: { ageGroup, academicYearId },
        });
    },

    // ✅ Get accessible classes
    getAccessibleClasses: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-program-completes/accessible-classes`, {
            params: { academicYearId },
        });
    },
};

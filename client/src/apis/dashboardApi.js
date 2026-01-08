// client/src/apis/dashboardApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const dashboardApi = {
    // Get dashboard statistics
    getStats: async (params) => {
        const { academicYearId, classId, weekNumber } = params;

        console.log('📤 [dashboardApi.getStats] Sending request:', {
            academicYearId,
            classId,
            weekNumber,
        });

        // ✅ Validate params before sending
        if (!academicYearId || !classId || !weekNumber) {
            console.error('❌ [dashboardApi.getStats] Missing required params:', {
                academicYearId,
                classId,
                weekNumber,
            });
            throw new Error('Missing required parameters');
        }

        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/dashboards/stats`, {
            params: { academicYearId, classId, weekNumber },
        });
    },

    // Get available academic years
    getAvailableYears: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/dashboards/available-years`);
    },

    // Get available weeks
    getAvailableWeeks: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/dashboards/available-weeks`, {
            params: { academicYearId },
        });
    },

    // Get accessible classes
    getAccessibleClasses: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/dashboards/accessible-classes`, {
            params: { academicYearId },
        });
    },
};

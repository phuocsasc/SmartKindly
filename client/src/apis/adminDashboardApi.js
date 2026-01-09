// client/src/apis/adminDashboardApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const adminDashboardApi = {
    /**
     * ✅ GET ADMIN DASHBOARD STATISTICS
     */
    getStats: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/admin/dashboard/stats`);
    },
};

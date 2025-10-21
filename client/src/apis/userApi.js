// client/src/apis/userApi.js
import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const userApi = {
    // Authentication
    login: async (credentials) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, credentials);
    },

    logout: async () => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`);
    },

    refreshToken: async (refreshToken) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/refresh_token`, { refreshToken });
    },

    // Forgot Password APIs
    sendOtpToEmail: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/forgot-password/send-otp`, data);
    },

    verifyOtp: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/forgot-password/verify-otp`, data);
    },

    resetPasswordWithOtp: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/forgot-password/reset-password`, data);
    },

    // User Management
    getAllUsers: async (params) => {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/management`, {
            params: { page, limit, search, role, status },
        });
    },

    getUserDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/management/${id}`);
    },

    createUser: async (userData) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/management`, userData);
    },

    updateUser: async (id, userData) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/management/${id}`, userData);
    },

    deleteUser: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/management/${id}`);
    },

    deleteManyUsers: async (ids) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/management/delete-many`, { ids });
    },

    changePassword: async (id, passwordData) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/management/${id}/change-password`, passwordData);
    },

    resetPassword: async (id) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/management/${id}/reset-password`);
    },
};

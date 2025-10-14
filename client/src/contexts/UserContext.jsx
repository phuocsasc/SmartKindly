import { createContext, useContext, useEffect, useState } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

const UserContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const res = await authorizedAxiosInstance.get(`${API_ROOT}/v1/dashboards/access`);
            setUser(res.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err);
            // Nếu lỗi 401 hoặc token hết hạn, redirect về login
            if (err.response?.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userInfo');
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    const clearUser = () => {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    width: '100vw',
                    height: '100vh',
                }}
            >
                <CircularProgress />
                <Typography>Đang tải thông tin người dùng...</Typography>
            </Box>
        );
    }

    return (
        <UserContext.Provider
            value={{
                user,
                loading,
                error,
                fetchUser,
                updateUser,
                clearUser,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

import { createContext, useContext, useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { userApi } from '~/apis/userApi';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ Fetch user info từ server khi app load
    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setLoading(false);
                return;
            }

            // ✅ Lấy thông tin user từ localStorage trước (để hiển thị nhanh)
            const storedUser = JSON.parse(localStorage.getItem('userInfo'));
            if (storedUser) {
                setUser(storedUser);
            }

            // ✅ Sau đó fetch từ server để đảm bảo data mới nhất
            const response = await userApi.getInfoUserDetails('me');
            const userData = response.data.data;

            // ✅ Cập nhật user với đầy đủ thông tin từ server
            const fullUserInfo = {
                id: userData._id,
                username: userData.username,
                fullName: userData.fullName,
                role: userData.role,
                isRoot: userData.isRoot || false,
                schoolId: userData.schoolId, // ✅ Lấy từ server
                schoolName: userData.school?.name || null, // ✅ Lấy từ server
            };

            setUser(fullUserInfo);
            // ✅ Cập nhật lại localStorage với data mới nhất
            localStorage.setItem('userInfo', JSON.stringify(fullUserInfo));
        } catch (err) {
            console.error('❌ Error fetching user:', err);
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
        // ✅ Cập nhật localStorage
        localStorage.setItem('userInfo', JSON.stringify(userData));
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                <CircularProgress size={40} />
                <Typography variant="h6">Đang tải...</Typography>
            </Box>
        );
    }

    return <UserContext.Provider value={{ user, updateUser, clearUser }}>{children}</UserContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => useContext(UserContext);

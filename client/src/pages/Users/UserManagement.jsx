import { Box, Typography, Paper, Breadcrumbs, Link, CircularProgress } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import MainLayout from '~/layouts/MainLayout';
import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

function UserManagement() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const res = await authorizedAxiosInstance.get(`${API_ROOT}/v1/dashboards/access`);
            setUser(res.data);
        };
        fetchData();
    }, []);

    if (!user) {
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
                <Typography>Loading user data...</Typography>
            </Box>
        );
    }

    return (
        <MainLayout user={user}>
            <Box sx={{ p: 2 }}>
                {/* Breadcrumb */}
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="/dashboard"
                        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Trang chủ
                    </Link>
                    <Typography color="text.primary">Quản lý người dùng</Typography>
                </Breadcrumbs>

                {/* Page Content */}
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                    <Typography variant="h4" gutterBottom>
                        Quản lý người dùng
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Nội dung trang quản lý người dùng sẽ được phát triển tại đây.
                    </Typography>
                </Paper>
            </Box>
        </MainLayout>
    );
}

export default UserManagement;

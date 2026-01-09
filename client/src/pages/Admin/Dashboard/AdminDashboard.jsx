// client/src/pages/Admin/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminLayout from '~/layouts/AdminLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { adminDashboardApi } from '~/apis';
import { toast } from 'react-toastify';

// Import dashboard components
import TotalSchools from './TotalSchools';
import TotalUsers from './TotalUsers';
import TotalFoods from './TotalFoods';
import AdminYearTargetStats from './AdminYearTargetStats';
import AdminActivityStats from './AdminActivityStats';

// ✅ ROW HEIGHTS
const ROW_HEIGHTS = {
    row1: 500, // Trường học, Người dùng, Thực phẩm
    row2: 500, // Mục tiêu năm học, Hoạt động giáo dục
};

export default function AdminDashboard() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await adminDashboardApi.getStats();
            setStats(res.data.data);
            console.log('✅ Admin Dashboard Stats:', res.data.data);
        } catch (error) {
            console.error('Error fetching admin dashboard stats:', error);
            toast.error('Lỗi khi tải thống kê!');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout user={user}>
                <PageContainer>
                    <PageBreadcrumb items={[{ text: 'Tổng quan hệ thống', icon: DashboardIcon }]} />
                    <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                            <Typography variant="body1" sx={{ ml: 2 }}>
                                Đang tải dữ liệu...
                            </Typography>
                        </Box>
                    </Paper>
                </PageContainer>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout user={user}>
            <PageContainer>
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2, bgcolor: '#f8f9fa' }}>
                    {/* Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" fontWeight={700}>
                            Tổng quan Hệ thống quản lý trường mầm non công lập
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Thống kê toàn hệ thống - Admin Dashboard
                        </Typography>
                    </Box>

                    {stats && (
                        <Grid container spacing={3}>
                            {/* Row 1: Trường học, Người dùng, Thực phẩm */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row1 }}>
                                    <TotalSchools data={stats.schools} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row1 }}>
                                    <TotalUsers data={stats.users} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row1 }}>
                                    <TotalFoods data={stats.foods} />
                                </Box>
                            </Grid>

                            {/* Row 2: Mục tiêu năm học, Hoạt động giáo dục */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ height: ROW_HEIGHTS.row2 }}>
                                    <AdminYearTargetStats data={stats.yearTargets.byAgeGroup} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ height: ROW_HEIGHTS.row2 }}>
                                    <AdminActivityStats data={stats.educationalActivities.byAgeGroup} />
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </Paper>
            </PageContainer>
        </AdminLayout>
    );
}

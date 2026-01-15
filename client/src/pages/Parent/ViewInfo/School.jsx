// client/src/pages/Parent/ViewInfo/School.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Divider, CircularProgress, Avatar, Chip } from '@mui/material';
import {
    School as SchoolIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Language as WebsiteIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function School() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [schoolData, setSchoolData] = useState(null);

    useEffect(() => {
        const fetchSchoolInfo = async () => {
            try {
                setLoading(true);
                const response = await parentChildrenApi.getSchoolInfo();
                setSchoolData(response.data.data);
                console.log('✅ [School] Fetched data:', response.data.data);
            } catch (error) {
                console.error('❌ [School] Error:', error);
                toast.error(error?.response?.data?.message || 'Không thể tải thông tin trường học');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchSchoolInfo();
        }
    }, [user]);

    if (loading) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress />
                    </Box>
                </PageContainer>
            </MainLayout>
        );
    }

    if (!schoolData) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Không có dữ liệu
                        </Typography>
                    </Paper>
                </PageContainer>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user}>
            <PageContainer>
                <Grid container spacing={3}>
                    {/* ✅ HEADER CARD */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                    <SchoolIcon sx={{ fontSize: 50 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" fontWeight={700}>
                                        {schoolData.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center' }}>
                                        <Chip
                                            label={schoolData.abbreviation}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                color: 'white',
                                                fontWeight: 600,
                                            }}
                                        />
                                        <Chip
                                            label={schoolData.status ? 'Đang hoạt động' : 'Không hoạt động'}
                                            size="small"
                                            sx={{
                                                bgcolor: schoolData.status
                                                    ? 'rgba(76, 175, 80, 0.2)'
                                                    : 'rgba(244, 67, 54, 0.2)',
                                                color: 'white',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* ✅ THÔNG TIN CHI TIẾT */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, borderRadius: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#667eea', mb: 3 }}>
                                Thông tin chi tiết
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={3}>
                                {/* Địa chỉ */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                bgcolor: '#e3f2fd',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <LocationIcon color="primary" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Địa chỉ
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {schoolData.address}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Số điện thoại */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                bgcolor: '#e8f5e9',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <PhoneIcon color="success" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Số điện thoại
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {schoolData.phone || 'Chưa cập nhật'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Email */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                bgcolor: '#fff3e0',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <EmailIcon color="warning" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Email
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {schoolData.email || 'Chưa cập nhật'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Website */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                bgcolor: '#f3e5f5',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <WebsiteIcon color="secondary" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Website
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {schoolData.website || 'Chưa cập nhật'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Hiệu trưởng */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                bgcolor: '#fce4ec',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <PersonIcon color="error" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Hiệu trưởng
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {schoolData.manager || 'Chưa cập nhật'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Ngày thành lập */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                bgcolor: '#e0f2f1',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <CalendarIcon color="info" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Ngày thành lập
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {schoolData.establishmentDate
                                                    ? dayjs(schoolData.establishmentDate).format('DD/MM/YYYY')
                                                    : 'Chưa cập nhật'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Mã trường */}
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                bgcolor: '#ede7f6',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <SchoolIcon sx={{ color: '#673ab7' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Mã trường
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {schoolData.schoolId}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </PageContainer>
        </MainLayout>
    );
}

export default School;

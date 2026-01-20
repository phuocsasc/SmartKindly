// client/src/pages/Parent/Dashboard/Dashboard.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    CircularProgress,
    Stack,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import CottageOutlinedIcon from '@mui/icons-material/CottageOutlined';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import logo_smartkindly from '/logo_thanh_menu_tach_nen.png';

function Dashboard() {
    const { user } = useUser();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [loading, setLoading] = useState(true);
    const [schoolData, setSchoolData] = useState(null);
    const [childrenData, setChildrenData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [schoolRes, childrenRes] = await Promise.all([
                    parentChildrenApi.getSchoolInfo(),
                    parentChildrenApi.getChildrenInfo(),
                ]);

                setSchoolData(schoolRes.data.data);
                setChildrenData(childrenRes.data.data);
            } catch (error) {
                console.error('❌ Error fetching dashboard data:', error);
                toast.error('Không thể tải thông tin');
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    if (loading) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress sx={{ color: '#667eea' }} />
                    </Box>
                </PageContainer>
            </MainLayout>
        );
    }

    const student = childrenData?.student;
    const currentClass = childrenData?.currentClass;
    const school = schoolData;

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* ✅ HERO SECTION - WELCOME BANNER */}
                <Paper
                    sx={{
                        p: { xs: 3, md: 5 },
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, #acb5ddff 0%, #9f7bc4ff 100%)',
                        color: 'white',
                        mb: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                    }}
                >
                    {/* Decorative circles giữ nguyên... */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                        }}
                    />

                    <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                        <Grid item xs={12}>
                            {' '}
                            {/* Chỉnh lại thành xs={12} để chiếm trọn chiều ngang */}
                            <Stack spacing={2}>
                                {/* Hàng chứa chữ Chào mừng và Logo */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700}>
                                        Chào mừng đến với phần mềm
                                    </Typography>
                                    <Box
                                        component="img"
                                        src={logo_smartkindly}
                                        alt="SmartKindly Logo"
                                        sx={{
                                            height: { xs: 30, md: 40 }, // Điều chỉnh độ cao logo cho khớp với cỡ chữ
                                            width: 'auto',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Box>

                                <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ opacity: 0.95 }}>
                                    Xin chào phụ huynh của bé{' '}
                                    <strong style={{ fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
                                        {student?.fullName}
                                    </strong>
                                    {student?.nickname && ` (${student.nickname})`}{' '}
                                </Typography>

                                <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 600 }}>
                                    Hệ thống quản lý trường mầm non SmartKindly - Kết nối nhà trường và phụ huynh, đồng
                                    hành cùng con trưởng thành mỗi ngày!
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                    <Chip
                                        icon={<SchoolIcon />}
                                        label={school?.name || 'Nhà trường'}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            fontWeight: 600,
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    />
                                    {currentClass && (
                                        <Chip
                                            icon={<CottageOutlinedIcon />}
                                            label={`Lớp ${currentClass.name}`}
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                color: 'white',
                                                fontWeight: 600,
                                                backdropFilter: 'blur(10px)',
                                            }}
                                        />
                                    )}
                                </Box>
                            </Stack>
                        </Grid>

                        {/* Đã xóa phần Grid item md={4} chứa Avatar cũ */}
                    </Grid>
                </Paper>

                <Divider sx={{ my: 4 }} />
            </PageContainer>
        </MainLayout>
    );
}

export default Dashboard;

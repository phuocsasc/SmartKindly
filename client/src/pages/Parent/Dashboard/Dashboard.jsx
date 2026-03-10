// client/src/pages/Parent/Dashboard/Dashboard.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, CircularProgress, Stack, Divider, useTheme, useMediaQuery } from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import CottageOutlinedIcon from '@mui/icons-material/CottageOutlined';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dashboardBg from '/hinh_nen_trang_phu_huynh.png';

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
                        <CircularProgress sx={{ color: '#0071bc' }} />
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
            {/* Nếu bạn muốn hình nền full màn hình toàn bộ layout, thì bạn phải đưa backgroundImage lên phần tử bọc ngoài cùng (ví dụ MainLayout hoặc PageContainer). 
                Tuy nhiên, theo yêu cầu "hình nền trang này full trang luôn", thường áp dụng cho khu vực Banner (Hero section). 
                Ở đây, tôi đã làm cho thẻ Paper (Banner) chiếm toàn bộ chiều rộng khả dụng và cao hơn. */}
            <PageContainer>
                {/* ✅ HERO SECTION - WELCOME BANNER VỚI HÌNH NỀN COVER & CANH GIỮA */}
                <Paper
                    sx={{
                        p: { xs: 3, md: 5 },
                        borderRadius: 4,
                        color: 'white',
                        mb: 4,
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0, 113, 188, 0.15)',
                        // Tăng minHeight để hiển thị được nhiều ảnh nền hơn
                        minHeight: { xs: 350, sm: 400, md: 450 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',

                        // ✅ Thiết lập hình nền Full
                        backgroundImage: `url('${dashboardBg}')`,
                        backgroundSize: 'cover', // Đảm bảo hình nền phủ kín (full) toàn bộ vùng Paper
                        backgroundPosition: 'center', // Canh giữa hình nền
                        backgroundRepeat: 'no-repeat', // Không lặp lại hình ảnh

                        textShadow: '1px 1px 4px rgba(0,0,0,0.5)', // Giúp chữ dễ đọc hơn trên nền ảnh
                    }}
                >
                    {/* Lớp phủ mờ (Overlay) để làm chữ nổi bật hơn trên bất kỳ hình nền nào */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(125, 172, 213, 0.4)',
                            zIndex: 0,
                        }}
                    />

                    <Box sx={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'center' }}>
                        <Stack spacing={2} alignItems="center">
                            {/* Hàng chứa chữ Chào mừng và Logo, canh giữa */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1.5,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700}>
                                    Chào mừng phụ huynh đến với SMARTKINDLY
                                </Typography>
                            </Box>

                            <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ opacity: 0.95, fontWeight: 500 }}>
                                Xin chào phụ huynh của bé{' '}
                                <strong style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', color: '#ffeb3b' }}>
                                    {student?.fullName}
                                </strong>
                                {student?.nickname && ` (${student.nickname})`}{' '}
                            </Typography>

                            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 700, mt: 1, fontWeight: 500 }}>
                                Hệ thống quản lý trường mầm non SmartKindly - Kết nối nhà trường và phụ huynh, đồng hành
                                cùng con trưởng thành mỗi ngày!
                            </Typography>

                            {/* Các Chip thông tin cũng canh giữa */}
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2, justifyContent: 'center' }}>
                                <Chip
                                    icon={<SchoolIcon sx={{ color: 'white !important' }} />}
                                    label={school?.name || 'Nhà trường'}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.25)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        py: 2.5,
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                    }}
                                />
                                {currentClass && (
                                    <Chip
                                        icon={<CottageOutlinedIcon sx={{ color: 'white !important' }} />}
                                        label={`Lớp ${currentClass.name}`}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.25)',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            py: 2.5,
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.4)',
                                        }}
                                    />
                                )}
                            </Box>
                        </Stack>
                    </Box>
                </Paper>

                <Divider sx={{ my: 4 }} />

                {/* Phần nội dung phía dưới được giữ nguyên theo yêu cầu */}
            </PageContainer>
        </MainLayout>
    );
}

export default Dashboard;

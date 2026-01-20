import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Avatar, Chip, Stack, Card, CardContent } from '@mui/material';
import {
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Language as WebsiteIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    Fingerprint as IDIcon,
    Verified as VerifiedIcon,
    ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
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
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Không thể tải thông tin trường học');
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchSchoolInfo();
    }, [user]);

    // UI Helper: Info Item Component
    const InfoCard = ({ icon: Icon, label, value, color }) => {
        const hasData = value && value.toString().trim() !== '';

        return (
            <Card
                sx={{
                    height: '100%',
                    borderRadius: 4,
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: 'transparent',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: hasData ? `${color}40` : 'transparent',
                        boxShadow: `0 8px 25px 0 ${hasData ? color + '20' : 'rgba(0,0,0,0.08)'}`,
                    },
                }}
            >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 3,
                            display: 'flex',
                            bgcolor: hasData ? `${color}15` : 'grey.100',
                            color: hasData ? color : 'grey.400',
                        }}
                    >
                        <Icon fontSize="medium" />
                    </Box>
                    <Box sx={{ overflow: 'hidden', flex: 1 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                            sx={{ display: 'block', mb: 0.2, textTransform: 'uppercase', letterSpacing: 0.5 }}
                        >
                            {label}
                        </Typography>
                        <Typography
                            variant="body2"
                            fontWeight={hasData ? 700 : 400}
                            sx={{
                                color: hasData ? 'text.primary' : 'text.disabled',
                                fontStyle: hasData ? 'normal' : 'italic',
                            }}
                        >
                            {hasData ? value : 'Chưa cập nhật'}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    if (loading)
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '60vh',
                            gap: 2,
                        }}
                    >
                        <CircularProgress thickness={5} size={50} sx={{ color: '#667eea' }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Đang tải dữ liệu trường học...
                        </Typography>
                    </Box>
                </PageContainer>
            </MainLayout>
        );

    if (!schoolData)
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Stack alignItems="center" spacing={2} sx={{ py: 10 }}>
                        <ErrorIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary">
                            Không tìm thấy thông tin trường học
                        </Typography>
                    </Stack>
                </PageContainer>
            </MainLayout>
        );

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Nhà trường' }]} />
                <Grid container spacing={4}>
                    {/* --- BANNER HEADER --- */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                position: 'relative',
                                p: { xs: 3, md: 5 },
                                borderRadius: 8,
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, #acb5ddff 0%, #9f7bc4ff 100%)',
                                color: 'white',
                                boxShadow: '0 12px 35px rgba(102, 126, 234, 0.35)',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -40,
                                    right: -40,
                                    width: 220,
                                    height: 220,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.12)',
                                }}
                            />

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems="center">
                                <Avatar
                                    sx={{
                                        width: { xs: 90, md: 120 },
                                        height: { xs: 90, md: 120 },
                                        bgcolor: 'rgba(255,255,255,0.25)',
                                        backdropFilter: 'blur(12px)',
                                        border: '4px solid rgba(255,255,255,0.4)',
                                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <LocationCityOutlinedIcon sx={{ fontSize: { xs: 50, md: 70 } }} />
                                </Avatar>

                                <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
                                    <Typography
                                        variant="h3"
                                        fontWeight={700}
                                        sx={{ mb: 1.5, letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
                                    >
                                        {schoolData.name || 'Tên trường chưa cập nhật'}
                                    </Typography>
                                    <Stack
                                        direction="row"
                                        spacing={1.5}
                                        justifyContent={{ xs: 'center', sm: 'flex-start' }}
                                        flexWrap="wrap"
                                        useFlexGap
                                    >
                                        <Chip
                                            label={schoolData.abbreviation || 'N/A'}
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                color: 'white',
                                                fontWeight: 700,
                                                px: 1,
                                            }}
                                        />
                                        <Chip
                                            icon={<VerifiedIcon style={{ color: 'white' }} />}
                                            label={schoolData.status ? 'Đang hoạt động' : 'Tạm dừng'}
                                            sx={{
                                                bgcolor: schoolData.status ? '#4caf50' : '#f44336',
                                                color: 'white',
                                                fontWeight: 700,
                                                px: 1,
                                            }}
                                        />
                                    </Stack>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* --- DETAILED INFO SECTION --- */}
                    <Grid item xs={12}>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: '#2d3748' }}
                        >
                            <Box sx={{ width: 6, height: 28, bgcolor: '#667eea', borderRadius: 2 }} />
                            TỔNG QUAN THÔNG TIN
                        </Typography>

                        <Grid container spacing={3}>
                            {/* Full width Address */}
                            <Grid item xs={12}>
                                <InfoCard
                                    icon={LocationIcon}
                                    label="Địa chỉ trụ sở"
                                    value={schoolData.address}
                                    color="#3f51b5"
                                />
                            </Grid>

                            {/* Grid Items */}
                            {[
                                { icon: PhoneIcon, label: 'Số điện thoại', value: schoolData.phone, color: '#4caf50' },
                                {
                                    icon: EmailIcon,
                                    label: 'Hòm thư điện tử',
                                    value: schoolData.email,
                                    color: '#ff9800',
                                },
                                {
                                    icon: WebsiteIcon,
                                    label: 'Website chính thức',
                                    value: schoolData.website,
                                    color: '#2196f3',
                                },
                                {
                                    icon: PersonIcon,
                                    label: 'Hiệu trưởng',
                                    value: schoolData.manager,
                                    color: '#e91e63',
                                },
                                {
                                    icon: CalendarIcon,
                                    label: 'Ngày thành lập',
                                    value: schoolData.establishmentDate
                                        ? dayjs(schoolData.establishmentDate).format('DD/MM/YYYY')
                                        : null,
                                    color: '#00bcd4',
                                },
                                {
                                    icon: IDIcon,
                                    label: 'Mã số trường',
                                    value: schoolData.schoolId,
                                    color: '#673ab7',
                                },
                            ].map((item, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <InfoCard {...item} />
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {/* --- FOOTER NOTE --- */}
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                borderRadius: 5,
                                bgcolor: '#f7fafc',
                                border: '1px dashed #cbd5e0',
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ opacity: 0.9, fontStyle: 'italic' }}
                            >
                                Thông tin được cập nhật từ Nhà trường.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </PageContainer>
        </MainLayout>
    );
}

export default School;

// client/src/pages/School/Users/UserInfo.jsx

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    TextField,
    Button,
    Typography,
    Avatar,
    Divider,
    Chip,
    CircularProgress,
    Grid,
    InputAdornment,
    useTheme,
    useMediaQuery,
    Fade,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    PhoneIphone as PhoneIcon,
    Badge as BadgeIcon,
    Wc as GenderIcon,
    Save as SaveIcon,
    VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { userApi } from '~/apis/userApi';
import { toast } from 'react-toastify';
import { ROLE_CONFIG, ROLE_DISPLAY } from '~/config/roleConfig';

function UserInfo() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user: contextUser } = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [tabValue, setTabValue] = useState(tabParam === 'password' ? 1 : 0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    const [profileData, setProfileData] = useState({
        username: '',
        fullName: '',
        gender: '',
        email: '',
        phone: '',
        role: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // ✅ Fetch user data from database
    useEffect(() => {
        const fetchUserData = async () => {
            if (!contextUser?.id) {
                setInitialLoading(false);
                return;
            }
            try {
                setInitialLoading(true);
                const response = await userApi.getUserDetails(contextUser.id);
                const dbUserData = response.data.data;

                console.log('✅ [UserInfo] Fetched user data:', dbUserData);

                setUserData(dbUserData);
                setProfileData({
                    username: dbUserData.username || '',
                    fullName: dbUserData.fullName || '',
                    gender: dbUserData.gender || '',
                    email: dbUserData.email || '',
                    phone: dbUserData.phone || '',
                    role: dbUserData.role || '',
                });
            } catch (error) {
                console.error('❌ [UserInfo] Error fetching user data:', error);
                toast.error('Không thể tải thông tin người dùng');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchUserData();
    }, [contextUser?.id]);

    useEffect(() => {
        setTabValue(tabParam === 'password' ? 1 : 0);
    }, [tabParam]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setSearchParams(newValue === 1 ? { tab: 'password' } : {});
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const response = await userApi.updateUser(contextUser.id, {
                fullName: profileData.fullName,
                gender: profileData.gender,
                email: profileData.email,
                phone: profileData.phone,
            });
            setUserData(response.data.data);
            toast.success('Cập nhật thông tin thành công!');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin!');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }
        try {
            setLoading(true);
            await userApi.changePassword(contextUser.id, passwordData);
            toast.success('Đổi mật khẩu thành công!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi đổi mật khẩu!');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <MainLayout user={contextUser}>
                <PageContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress thickness={5} size={50} sx={{ color: theme.palette.primary.main }} />
                    </Box>
                </PageContainer>
            </MainLayout>
        );
    }

    // ✅ Get roleConfig và Icon
    const roleConfig = ROLE_CONFIG[userData?.role] || {
        color: '#0071bc',
        bgColor: '#e3f2fd',
        icon: PersonIcon,
    };
    const RoleIcon = roleConfig.icon;

    return (
        <MainLayout user={contextUser}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Thông tin tài khoản' }]} />

                <Grid container spacing={3}>
                    {/* ✅ SIDEBAR CARD */}
                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                borderRadius: 6,
                                overflow: 'hidden',
                                height: '100%',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                                position: 'relative',
                            }}
                        >
                            {/* ✅ Header Gradient */}
                            <Box
                                sx={{
                                    height: 100,
                                    background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.bgColor} 100%)`,
                                }}
                            />

                            <Box sx={{ px: 3, pb: 4, mt: -7, textAlign: 'center' }}>
                                {/* ✅ Avatar */}
                                <Avatar
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        mx: 'auto',
                                        mb: 2,
                                        border: '5px solid white',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        bgcolor: roleConfig.bgColor,
                                        color: roleConfig.color,
                                    }}
                                >
                                    <RoleIcon sx={{ fontSize: 70 }} />
                                </Avatar>

                                {/* ✅ Tên người dùng */}
                                <Typography variant="h5" fontWeight={700} sx={{ color: '#1a202c' }}>
                                    {userData?.fullName || 'Chưa cập nhật'}
                                </Typography>

                                {/* ✅ Chip vai trò */}
                                <Chip
                                    icon={<VerifiedIcon style={{ color: 'inherit' }} />}
                                    label={ROLE_DISPLAY[userData?.role]}
                                    sx={{
                                        mt: 2,
                                        bgcolor: roleConfig.bgColor,
                                        color: roleConfig.color,
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        border: `1px solid ${roleConfig.color}`,
                                    }}
                                />

                                <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

                                {/* ✅ Thông tin tên đăng nhập */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1,
                                                bgcolor: roleConfig.bgColor,
                                                borderRadius: 2,
                                            }}
                                        >
                                            <BadgeIcon fontSize="small" sx={{ color: roleConfig.color }} />
                                        </Box>
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.disabled"
                                                sx={{ display: 'block' }}
                                            >
                                                Tên đăng nhập
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {userData?.username}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* ✅ MAIN CONTENT */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ borderRadius: 6, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant={isMobile ? 'fullWidth' : 'standard'}
                                sx={{
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    bgcolor: '#fafafa',
                                    px: 2,
                                    '& .MuiTab-root': {
                                        py: 2.5,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                    },
                                }}
                            >
                                <Tab label="Thông tin tài khoản" />
                                <Tab label="Đổi mật khẩu" />
                            </Tabs>

                            <Box sx={{ p: { xs: 3, md: 5 } }}>
                                {tabValue === 0 && (
                                    <Fade in timeout={500}>
                                        <Box>
                                            <Box sx={{ mb: 4 }}>
                                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                                    Thay đổi thông tin tài khoản
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Cập nhật thông tin cá nhân của bạn
                                                </Typography>
                                            </Box>

                                            <Grid container spacing={3}>
                                                {/* ✅ Họ và tên - EDITABLE */}
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Họ và tên"
                                                        value={profileData.fullName}
                                                        onChange={(e) =>
                                                            setProfileData({ ...profileData, fullName: e.target.value })
                                                        }
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <PersonIcon color="primary" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                                    />
                                                </Grid>

                                                {/* ✅ Giới tính - EDITABLE */}
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth>
                                                        <InputLabel>Giới tính</InputLabel>
                                                        <Select
                                                            value={profileData.gender}
                                                            onChange={(e) =>
                                                                setProfileData({
                                                                    ...profileData,
                                                                    gender: e.target.value,
                                                                })
                                                            }
                                                            label="Giới tính"
                                                            startAdornment={
                                                                <InputAdornment position="start">
                                                                    <GenderIcon color="primary" />
                                                                </InputAdornment>
                                                            }
                                                            sx={{ borderRadius: 3 }}
                                                        >
                                                            <MenuItem value="">Không xác định</MenuItem>
                                                            <MenuItem value="Nam">Nam</MenuItem>
                                                            <MenuItem value="Nữ">Nữ</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>

                                                <Grid item xs={12} sx={{ mt: 2 }}>
                                                    <Divider>
                                                        <Chip
                                                            label="Thông tin liên hệ"
                                                            size="small"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </Divider>
                                                </Grid>

                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Số điện thoại"
                                                        value={profileData.phone}
                                                        onChange={(e) =>
                                                            setProfileData({ ...profileData, phone: e.target.value })
                                                        }
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <PhoneIcon color="primary" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Email"
                                                        value={profileData.email}
                                                        onChange={(e) =>
                                                            setProfileData({ ...profileData, email: e.target.value })
                                                        }
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <EmailIcon color="primary" />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} sx={{ mt: 3 }}>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth={isMobile}
                                                        onClick={handleUpdateProfile}
                                                        disabled={loading}
                                                        startIcon={
                                                            loading ? <CircularProgress size={20} /> : <SaveIcon />
                                                        }
                                                        sx={{
                                                            borderRadius: 3,
                                                            px: 6,
                                                            py: 1.5,
                                                            fontWeight: 700,
                                                            textTransform: 'none',
                                                            background:
                                                                'linear-gradient(135deg, #0071bc 0%, #00a8ff 100%)',
                                                            boxShadow: '0 10px 20px rgba(0, 113, 188, 0.2)',
                                                        }}
                                                    >
                                                        Lưu cập nhật tài khoản
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Fade>
                                )}

                                {tabValue === 1 && (
                                    <Fade in timeout={500}>
                                        <Box sx={{ maxWidth: 500 }}>
                                            <Typography variant="h6" fontWeight={700} sx={{ mb: 4 }}>
                                                Thay đổi mật khẩu
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                <TextField
                                                    fullWidth
                                                    type="password"
                                                    label="Mật khẩu hiện tại"
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) =>
                                                        setPasswordData({
                                                            ...passwordData,
                                                            currentPassword: e.target.value,
                                                        })
                                                    }
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    type="password"
                                                    label="Mật khẩu mới"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) =>
                                                        setPasswordData({
                                                            ...passwordData,
                                                            newPassword: e.target.value,
                                                        })
                                                    }
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                                    helperText="Độ dài tối thiểu 6 ký tự bao gồm chữ và số"
                                                />
                                                <TextField
                                                    fullWidth
                                                    type="password"
                                                    label="Xác nhận mật khẩu mới"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) =>
                                                        setPasswordData({
                                                            ...passwordData,
                                                            confirmPassword: e.target.value,
                                                        })
                                                    }
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    color="warning"
                                                    fullWidth
                                                    onClick={handleChangePassword}
                                                    disabled={loading}
                                                    sx={{
                                                        borderRadius: 3,
                                                        py: 1.5,
                                                        fontWeight: 700,
                                                        textTransform: 'none',
                                                        bgcolor: '#ff9800',
                                                        boxShadow: '0 10px 20px rgba(255, 152, 0, 0.2)',
                                                    }}
                                                >
                                                    Xác nhận đổi mật khẩu
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Fade>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </PageContainer>
        </MainLayout>
    );
}

export default UserInfo;

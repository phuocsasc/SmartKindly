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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { userApi } from '~/apis/userApi';
import { toast } from 'react-toastify';
import { ROLE_CONFIG, ROLE_DISPLAY } from '~/config/roleConfig';

function UserInfo() {
    const { user: contextUser } = useUser(); // Chỉ lấy id từ context
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [tabValue, setTabValue] = useState(tabParam === 'password' ? 1 : 0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [userData, setUserData] = useState(null); // ✅ State riêng cho user data

    // Form data cho thông tin cá nhân
    const [profileData, setProfileData] = useState({
        username: '',
        fullName: '',
        gender: '',
        email: '',
        phone: '',
        role: '',
    });

    // Form data cho đổi mật khẩu
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // ✅ Fetch user data từ database khi component mount
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

                setUserData(dbUserData);

                // Set form data
                setProfileData({
                    username: dbUserData.username || '',
                    fullName: dbUserData.fullName || '',
                    gender: dbUserData.gender || '',
                    email: dbUserData.email || '',
                    phone: dbUserData.phone || '',
                    role: dbUserData.role || '',
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast.error('Không thể tải thông tin người dùng');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchUserData();
    }, [contextUser?.id]);

    useEffect(() => {
        if (tabParam === 'password') {
            setTabValue(1);
        }
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

            // ✅ Cập nhật lại userData sau khi update thành công
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
            await userApi.changePassword(contextUser.id, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword,
            });
            toast.success('Đổi mật khẩu thành công!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra!';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Hiển thị loading khi đang fetch data
    if (initialLoading) {
        return (
            <MainLayout user={contextUser}>
                <PageContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Đang tải thông tin...</Typography>
                    </Box>
                </PageContainer>
            </MainLayout>
        );
    }

    // ✅ Sử dụng userData từ database thay vì contextUser
    const roleConfig = ROLE_CONFIG[userData?.role] || {};
    const RoleIcon = roleConfig.icon || PersonIcon;

    return (
        <MainLayout user={contextUser}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Thông tin tài khoản' }]} />

                <Paper
                    sx={{
                        borderRadius: 2,
                        boxShadow: 2,
                        overflow: 'hidden',
                        /* ✅ Style chung cho input */
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,

                            // ✅ Khi hover viền sáng màu xanh nhạt
                            '&:hover fieldset': {
                                borderColor: '#0071bc',
                            },

                            // ✅ Khi focus viền đậm màu xanh biển
                            '&.Mui-focused fieldset': {
                                borderColor: '#0071bc',
                                borderWidth: 2,
                            },
                        },

                        // ✅ Đổi màu label khi focus
                        '& label.Mui-focused': {
                            color: '#0071bc',
                        },
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                            px: 2,
                            py: 1.5,
                            color: 'white',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: roleConfig.bgColor,
                                    border: '1px solid white',
                                }}
                            >
                                <RoleIcon sx={{ fontSize: 20, color: roleConfig.color }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h7" fontWeight={600}>
                                    {userData?.fullName || userData?.username}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.1 }}>
                                    {ROLE_DISPLAY[userData?.role]}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            sx={{
                                minHeight: 46,
                                '& .MuiTab-root': {
                                    minHeight: 46,
                                    py: 1.5,
                                    fontSize: '14px',
                                    textTransform: 'none',
                                    color: '#555', // màu mặc định
                                    transition: 'all 0.3s ease',
                                },
                                '& .MuiTab-root:hover': {
                                    color: '#0071bc', // hover
                                },
                                '& .Mui-selected': {
                                    color: '#0071bc', // text + icon khi active
                                    fontWeight: 600,
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#0071bc', // border-bottom của tab active
                                    height: 3,
                                    borderRadius: 2,
                                },
                            }}
                        >
                            <Tab icon={<PersonIcon />} label="Thông tin cá nhân" iconPosition="start" />
                            <Tab icon={<LockIcon />} label="Đổi mật khẩu" iconPosition="start" />
                        </Tabs>
                    </Box>

                    {/* Tab Panels */}
                    <Box sx={{ p: 2 }}>
                        {/* Thông tin cá nhân */}
                        {tabValue === 0 && (
                            <Box sx={{ maxWidth: 600 }}>
                                <Typography variant="h6" gutterBottom>
                                    Thông tin cá nhân
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Tên tài khoản"
                                        value={profileData.username}
                                        helperText="Tên tài khoản không thể chỉnh sửa"
                                        disabled
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            },
                                        }}
                                    />

                                    <TextField
                                        label="Họ và tên"
                                        value={profileData.fullName}
                                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            },
                                        }}
                                    />

                                    <FormControl
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            },
                                        }}
                                    >
                                        <InputLabel>Giới tính</InputLabel>
                                        <Select
                                            value={profileData.gender}
                                            onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                            label="Giới tính"
                                        >
                                            <MenuItem value="">Không xác định</MenuItem>
                                            <MenuItem value="Nam">Nam</MenuItem>
                                            <MenuItem value="Nữ">Nữ</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            },
                                        }}
                                    />

                                    <TextField
                                        label="Số điện thoại"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            },
                                        }}
                                    />

                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                        <Button
                                            onClick={handleUpdateProfile}
                                            disabled={loading}
                                            variant="contained"
                                            size="small"
                                            sx={{
                                                background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                                                '&:hover': {
                                                    boxShadow: 3,
                                                    background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                                                },
                                                textTransform: 'none',
                                            }}
                                        >
                                            Cập nhật thông tin
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        {/* Đổi mật khẩu */}
                        {tabValue === 1 && (
                            <Box sx={{ maxWidth: 600 }}>
                                <Typography variant="h6" gutterBottom>
                                    Đổi mật khẩu
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <TextField
                                        label="Mật khẩu hiện tại"
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                        }
                                        required
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            },
                                        }}
                                    />

                                    <TextField
                                        label="Mật khẩu mới"
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                                        }
                                        helperText="Mật khẩu phải có ít nhất 6 ký tự"
                                        required
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            },
                                        }}
                                    />

                                    <TextField
                                        label="Xác nhận mật khẩu mới"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                        }
                                        required
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            },
                                        }}
                                    />

                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleChangePassword}
                                            disabled={loading}
                                            color="warning"
                                            sx={{
                                                background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                                                '&:hover': {
                                                    boxShadow: 3,
                                                    background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                                                },
                                                textTransform: 'none',
                                            }}
                                            size="small"
                                        >
                                            Đổi mật khẩu
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default UserInfo;

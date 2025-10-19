import { Box, Button, TextField, Typography, Link, InputAdornment, IconButton } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { userApi } from '~/apis/userApi';
import { useUser } from '~/contexts/UserContext';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import logoSmartKindly from '/Logo_Smartkindly.png';
import { toast } from 'react-toastify';

function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();
    const navigate = useNavigate();
    const { updateUser } = useUser();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const submitLogIn = async (data) => {
        try {
            setLoading(true);

            const res = await userApi.login(data);

            const userInfo = {
                id: res.data.id,
                username: res.data.username,
                fullName: res.data.fullName,
                role: res.data.role,
            };

            // Lưu token và thông tin User vào LocalStorage
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // Cập nhật user vào context
            updateUser(userInfo);

            // Thông báo thành công
            toast.success('Đăng nhập thành công!');

            // Điều hướng tới trang Dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'url("/src/assets/background_login.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                padding: { xs: 2, sm: 3 },
            }}
        >
            {/* Container chính chứa Left + Right */}
            <Box
                sx={{
                    display: 'flex',
                    width: '100%',
                    maxWidth: 1050,
                    minHeight: 400,
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    background: 'white',
                }}
            >
                {/* Left Side - Background Image */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 500,
                        backgroundImage: 'url("/src/assets/bg-login.jpg")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        display: { xs: 'none', md: 'block' },
                    }}
                />

                {/* Right Side - Login Form */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: { xs: '100%', md: 450 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: { xs: 2, sm: 4 },
                        backgroundColor: 'white',
                    }}
                >
                    <Box sx={{ width: '100%', maxWidth: 450 }}>
                        {/* Logo */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                            <Box
                                component="img"
                                src={logoSmartKindly}
                                alt="SmartKindly Logo"
                                sx={{
                                    height: { xs: 60, sm: 80 },
                                    width: 'auto',
                                }}
                            />
                        </Box>

                        {/* Title */}
                        <Typography
                            variant="body2"
                            sx={{
                                textAlign: 'center',
                                fontWeight: 700,
                                color: '#1976d2',
                                mb: 4,
                                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                            }}
                        >
                            HỆ THỐNG QUẢN LÝ TRƯỜNG
                            <br /> MẦM NON CÔNG LẬP
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                textAlign: 'center',
                                fontWeight: 600,
                                color: '#333',
                                mb: 2,
                                fontSize: { xs: '1rem', sm: '1.25rem' },
                            }}
                        >
                            Đăng nhập
                        </Typography>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit(submitLogIn)}>
                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Tên tài khoản"
                                    variant="outlined"
                                    error={!!errors.username}
                                    helperText={errors.username?.message}
                                    {...register('username', {
                                        required: 'Vui lòng nhập tên tài khoản',
                                    })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2,
                                            backgroundColor: '#A3CCDA40',
                                            '& fieldset': { border: 'none' },
                                        },
                                    }}
                                />
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mật khẩu"
                                    variant="outlined"
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    {...register('password', {
                                        required: 'Vui lòng nhập mật khẩu',
                                    })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={handleClickShowPassword} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2,
                                            backgroundColor: '#A3CCDA40',
                                            '& fieldset': { border: 'none' },
                                        },
                                    }}
                                />
                            </Box>

                            {/* Forgot Password Link */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                                <Link
                                    href="#"
                                    underline="hover"
                                    sx={{
                                        color: '#1976d2',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    Quên mật khẩu
                                </Link>
                            </Box>

                            {/* Login Button */}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    py: 1,
                                    borderRadius: 2,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5568d3 0%, #6a4296 100%)',
                                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
                                    },
                                    '&:disabled': {
                                        background: '#ccc',
                                    },
                                }}
                            >
                                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </Button>
                        </form>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default Login;

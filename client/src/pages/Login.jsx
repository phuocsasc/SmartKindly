// client/src/pages/Login.jsx
import { Box, Button, Card as MuiCard, CardActions, TextField, Zoom, Alert, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PhuocDevIcon from '../assets/logo_TNP.png';
import { userApi } from '~/apis/userApi';
import { useUser } from '~/contexts/UserContext';

function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();
    const navigate = useNavigate();
    const { updateUser } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const submitLogIn = async (data) => {
        try {
            setLoading(true);
            setErrorMessage('');

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

            // Điều hướng tới trang Dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setErrorMessage(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'flex-start',
                background: 'url("src/assets/phuocdev_bg.jpg")',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'inset 0 0 0 2000px rgba(0, 0, 0, 0.1)',
            }}
        >
            <form onSubmit={handleSubmit(submitLogIn)}>
                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                    <MuiCard
                        sx={{
                            minWidth: 380,
                            maxWidth: 380,
                            marginTop: '6em',
                            p: '0.5em 0',
                            borderRadius: 2,
                        }}
                    >
                        <Box sx={{ width: '70px', bgcolor: 'white', margin: '0 auto' }}>
                            <img src={PhuocDevIcon} alt="phuocdevicon" width="100%" />
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <Box>
                                <Typography>Username: admin</Typography>
                                <Typography>Password: 123456</Typography>
                            </Box>
                        </Box>

                        {errorMessage && (
                            <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
                                {errorMessage}
                            </Alert>
                        )}

                        <Box sx={{ padding: '0 1em 1em 1em' }}>
                            <Box sx={{ marginTop: '1.2em' }}>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    label="Nhập tên tài khoản..."
                                    type="text"
                                    variant="outlined"
                                    error={!!errors.username}
                                    {...register('username', {
                                        required: 'Vui lòng nhập tên tài khoản',
                                    })}
                                />
                                {errors.username && (
                                    <Alert
                                        severity="error"
                                        sx={{
                                            mt: '0.7em',
                                            '.MuiAlert-message': { overflow: 'hidden' },
                                        }}
                                    >
                                        {errors.username.message}
                                    </Alert>
                                )}
                            </Box>

                            <Box sx={{ marginTop: '1em' }}>
                                <TextField
                                    fullWidth
                                    label="Nhập mật khẩu..."
                                    type="password"
                                    variant="outlined"
                                    error={!!errors.password}
                                    {...register('password', {
                                        required: 'Vui lòng nhập mật khẩu',
                                    })}
                                />
                                {errors.password && (
                                    <Alert
                                        severity="error"
                                        sx={{
                                            mt: '0.7em',
                                            '.MuiAlert-message': { overflow: 'hidden' },
                                        }}
                                    >
                                        {errors.password.message}
                                    </Alert>
                                )}
                            </Box>
                        </Box>

                        <CardActions sx={{ padding: '0.5em 1em 1em 1em' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                fullWidth
                                disabled={loading}
                            >
                                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </Button>
                        </CardActions>
                    </MuiCard>
                </Zoom>
            </form>
        </Box>
    );
}

export default Login;

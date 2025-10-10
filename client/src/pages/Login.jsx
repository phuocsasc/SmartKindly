import {
    Box,
    Button,
    Card as MuiCard,
    CardActions,
    TextField,
    Zoom,
    Alert,
    Typography,
} from '@mui/material';

import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import PhuocDevIcon from '../assets/logo_TNP.png';
import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();
    const navigate = useNavigate();

    const submitLogIn = async (data) => {
        const res = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, data);
        // console.log(res.data);
        const userInfo = {
            id: res.data.id,
            email: res.data.email,
            role: res.data.role,
        };

        // Lưu token và thông tin của User vào LocalStorage, dùng JS thuần.
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        // Điều hướng tới trang Dashboard khi login thành công
        navigate('/dashboard');
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
                                <Typography>Hint: phuoctran.22102004@gmail.com</Typography>
                                <Typography>Pass: phuocdev@123</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ padding: '0 1em 1em 1em' }}>
                            <Box sx={{ marginTop: '1.2em' }}>
                                <TextField
                                    // eslint-disable-next-line jsx-a11y/no-autofocus
                                    autoFocus
                                    fullWidth
                                    label="Nhập Email..."
                                    type="email"
                                    variant="outlined"
                                    error={!!errors.email}
                                    {...register('email', {
                                        required: 'Vui lòng nhập Email',
                                    })}
                                />
                                {errors.email && (
                                    <Alert
                                        severity="error"
                                        sx={{
                                            mt: '0.7em',
                                            '.MuiAlert-message': { overflow: 'hidden' },
                                        }}
                                    >
                                        {errors.email.message}
                                    </Alert>
                                )}
                            </Box>

                            <Box sx={{ marginTop: '1em' }}>
                                <TextField
                                    fullWidth
                                    label="Nhập Password..."
                                    type="password"
                                    variant="outlined"
                                    error={!!errors.password}
                                    {...register('password', {
                                        required: 'Vui lòng nhập Password',
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
                            >
                                Đăng nhập
                            </Button>
                        </CardActions>
                    </MuiCard>
                </Zoom>
            </form>
        </Box>
    );
}

export default Login;

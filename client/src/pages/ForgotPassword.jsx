import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, InputAdornment, IconButton, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import logoSmartKindly from '~/assets/Logo_chinh_tach_nen.png';
import { toast } from 'react-toastify';
import { userApi } from '~/apis/userApi';

function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Countdown timer for OTP
    const [countdown, setCountdown] = useState(0);
    const [canResend, setCanResend] = useState(false);

    // Countdown effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && step === 2) {
            setCanResend(true);
        }
    }, [countdown, step]);

    // ===== Step 1: Send OTP to Email =====
    const handleSendOTP = async () => {
        if (!email.trim()) {
            toast.error('Vui lòng nhập email!');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Email không hợp lệ!');
            return;
        }

        try {
            setLoading(true);
            await userApi.sendOtpToEmail({ email });
            toast.success('Mã OTP đã được gửi đến email của bạn!');
            setStep(2);
            setCountdown(60);
            setCanResend(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    // ===== Resend OTP =====
    const handleResendOTP = async () => {
        try {
            setLoading(true);
            await userApi.sendOtpToEmail({ email });
            toast.success('Mã OTP mới đã được gửi!');
            setCountdown(60);
            setCanResend(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    // ===== Step 2: Verify OTP =====
    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            toast.error('Vui lòng nhập mã OTP!');
            return;
        }

        if (otp.length !== 6) {
            toast.error('Mã OTP phải có 6 chữ số!');
            return;
        }

        try {
            setLoading(true);
            await userApi.verifyOtp({ email, otp });
            toast.success('Xác thực OTP thành công!');
            setStep(3);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Mã OTP không hợp lệ!');
        } finally {
            setLoading(false);
        }
    };

    // ===== Step 3: Reset Password =====
    const handleResetPassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) {
            toast.error('Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            setLoading(true);
            await userApi.resetPasswordWithOtp({
                email,
                otp,
                newPassword,
                confirmPassword,
            });
            toast.success('Đặt lại mật khẩu thành công!');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'url("/src/assets/anh_nen_dang_nhap.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                padding: { xs: 2, sm: 3 },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    width: '100%',
                    maxWidth: 960,
                    minHeight: 500,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    background: 'white',
                }}
            >
                {/* Left Side - Background Image */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 400,
                        backgroundImage: 'url("/src/assets/anh_dang_nhap.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        display: { xs: 'none', md: 'block' },
                        borderTopRightRadius: '50px',
                        borderBottomRightRadius: '50px',
                        overflow: 'hidden',
                    }}
                />

                {/* Right Side - Forgot Password Form */}
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
                        position: 'relative',
                    }}
                >
                    {/* Back Button */}
                    <IconButton
                        onClick={handleBackToLogin}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            color: '#666',
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    <Box sx={{ width: '100%', maxWidth: 450 }}>
                        {/* Logo */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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
                            variant="h5"
                            sx={{
                                textAlign: 'center',
                                fontWeight: 700,
                                color: '#1976d2',
                                mb: 1,
                            }}
                        >
                            Quên mật khẩu
                        </Typography>

                        {/* Step Indicator */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                            {[1, 2, 3].map((s) => (
                                <Box
                                    key={s}
                                    sx={{
                                        width: 40,
                                        height: 4,
                                        borderRadius: 2,
                                        bgcolor: step >= s ? '#1976d2' : '#e0e0e0',
                                        transition: 'all 0.3s',
                                    }}
                                />
                            ))}
                        </Box>

                        {/* ===== STEP 1: Enter Email ===== */}
                        {step === 1 && (
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        textAlign: 'center',
                                        color: '#666',
                                        mb: 3,
                                    }}
                                >
                                    Nhập email của bạn để nhận mã OTP
                                </Typography>

                                <TextField
                                    fullWidth
                                    placeholder="Email của bạn"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2,
                                            backgroundColor: '#A3CCDA40',
                                            '& fieldset': { border: 'none' },
                                        },
                                    }}
                                    sx={{ mb: 3 }}
                                />

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    sx={{
                                        py: 1.2,
                                        borderRadius: 2,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #0071BC 0%, #45B0E5 50%, #0071BC 100%)',
                                        boxShadow: '0 4px 12px rgba(0, 113, 188, 0.4)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            background:
                                                'linear-gradient(135deg, #0063A5 0%, #3CA3DA 50%, #0063A5 100%)',
                                            boxShadow: '0 6px 16px rgba(0, 113, 188, 0.5)',
                                            transform: 'translateY(-1px)',
                                        },
                                        '&:disabled': {
                                            background: '#ccc',
                                            boxShadow: 'none',
                                            cursor: 'not-allowed',
                                        },
                                    }}
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                </Button>
                            </Box>
                        )}

                        {/* ===== STEP 2: Enter OTP ===== */}
                        {step === 2 && (
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        textAlign: 'center',
                                        color: '#666',
                                        mb: 2,
                                    }}
                                >
                                    Mã OTP đã được gửi đến email
                                    <br />
                                    <strong>{email}</strong>
                                </Typography>

                                {/* Countdown Timer */}
                                <Box sx={{ mb: 2 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(countdown / 60) * 100}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: '#e0e0e0',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 4,
                                                background:
                                                    countdown > 20
                                                        ? 'linear-gradient(135deg, #0071BC 0%, #45B0E5 50%, #0071BC 100%)'
                                                        : 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
                                                transition: 'background 0.3s ease',
                                            },
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            textAlign: 'center',
                                            mt: 1,
                                            color: countdown > 20 ? '#0071BC' : '#f44336',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {countdown > 0 ? `Mã có hiệu lực trong ${countdown}s` : 'Mã OTP đã hết hạn'}
                                    </Typography>
                                </Box>

                                <TextField
                                    fullWidth
                                    placeholder="Nhập mã OTP "
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(value);
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyOTP()}
                                    inputProps={{
                                        maxLength: 6,
                                        style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
                                    }}
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: '#A3CCDA40',
                                            '& fieldset': { border: 'none' },
                                        },
                                        // ✅ Style placeholder ở đây
                                        '& input::placeholder': {
                                            // fontStyle: 'italic',
                                            color: '#6B7280',
                                            fontSize: '1.2rem',
                                            opacity: 0.6, // Quan trọng nếu placeholder bị mờ
                                            letterSpacing: '2px',
                                        },
                                    }}
                                />

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleVerifyOTP}
                                    disabled={loading || otp.length !== 6}
                                    sx={{
                                        py: 1.2,
                                        mb: 2,
                                        borderRadius: 2,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #0071BC 0%, #45B0E5 50%, #0071BC 100%)',
                                        boxShadow: '0 4px 12px rgba(0, 113, 188, 0.4)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            background:
                                                'linear-gradient(135deg, #0063A5 0%, #3CA3DA 50%, #0063A5 100%)',
                                            boxShadow: '0 6px 16px rgba(0, 113, 188, 0.5)',
                                            transform: 'translateY(-1px)',
                                        },
                                        '&:disabled': {
                                            background: '#ccc',
                                            boxShadow: 'none',
                                            cursor: 'not-allowed',
                                        },
                                    }}
                                >
                                    {loading ? 'Đang xác thực...' : 'Xác nhận'}
                                </Button>

                                {/* Resend OTP */}
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ color: '#666', display: 'inline' }}>
                                        Không nhận được mã?{' '}
                                    </Typography>
                                    <Button
                                        onClick={handleResendOTP}
                                        disabled={!canResend || loading}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            color: canResend ? '#1976d2' : '#999',
                                            p: 0,
                                            minWidth: 'auto',
                                            '&:hover': {
                                                background: 'transparent',
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        Gửi lại
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {/* ===== STEP 3: Reset Password ===== */}
                        {step === 3 && (
                            <Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        mb: 2,
                                    }}
                                >
                                    <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50' }} />
                                </Box>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        textAlign: 'center',
                                        color: '#666',
                                        mb: 3,
                                    }}
                                >
                                    Nhập mật khẩu mới cho tài khoản của bạn
                                </Typography>

                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mật khẩu mới"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
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
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Xác nhận mật khẩu mới"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 2,
                                            backgroundColor: '#A3CCDA40',
                                            '& fieldset': { border: 'none' },
                                        },
                                    }}
                                    sx={{ mb: 3 }}
                                />

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleResetPassword}
                                    disabled={loading}
                                    sx={{
                                        py: 1.2,
                                        borderRadius: 2,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #0071BC 0%, #45B0E5 50%, #0071BC 100%)',
                                        boxShadow: '0 4px 12px rgba(0, 113, 188, 0.4)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            background:
                                                'linear-gradient(135deg, #0063A5 0%, #3CA3DA 50%, #0063A5 100%)',
                                            boxShadow: '0 6px 16px rgba(0, 113, 188, 0.5)',
                                            transform: 'translateY(-1px)',
                                        },
                                        '&:disabled': {
                                            background: '#ccc',
                                            boxShadow: 'none',
                                            cursor: 'not-allowed',
                                        },
                                    }}
                                >
                                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* ✅ Footer bản quyền */}
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 2.5,
                            textAlign: 'center',
                            color: '#0071BC',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            opacity: 0.9,
                        }}
                    >
                        © 2025 <strong>SmartKindly</strong> - Thuộc nhóm sinh viên trường Đại học Văn Lang
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

export default ForgotPassword;

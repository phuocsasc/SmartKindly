import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import PlanetSvg from '~/assets/Logo_chinh_tach_nen.png';
import ParticlesBackground from '~/assets/anhnen404.png';
import { useUser } from '~/contexts/UserContext';
import { useNavigate } from 'react-router-dom';

function AccessDenied() {
    const navigate = useNavigate();
    const { user } = useUser(); // ✅ Lấy thông tin user

    const handleGoHome = () => {
        // ✅ Điều hướng dựa trên role
        if (user?.role === 'admin') {
            navigate('/admin/dashboard');
        } else if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };
    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                bgcolor: '#25344C',
                color: 'white',
            }}
        >
            <Box
                sx={{
                    '@keyframes moveBg': {
                        '0%': { backgroundPositionX: '0%' },
                        '100%': { backgroundPositionX: '100%' },
                    },
                    animation: 'moveBg 3s linear infinite alternate', // thời gian càng dài càng mượt
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${ParticlesBackground})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover', // ✅ full màn hình, không bị cắt
                    backgroundPosition: 'center center', // canh giữa
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="h1"
                    tabIndex={-1}
                    sx={{ fontSize: '100px', fontWeight: 800, outline: 'none', userSelect: 'none', color: '#b30f00ff' }}
                >
                    Access Denied
                </Typography>

                <Typography
                    tabIndex={-1}
                    sx={{
                        fontSize: '18px !important',
                        lineHeight: '25px',
                        fontWeight: 600,
                        maxWidth: '450px',
                        textAlign: 'center',
                        outline: 'none',
                        userSelect: 'none',
                        color: '#0071bd',
                    }}
                >
                    BẠN KHÔNG CÓ QUYỀN TRUY CẬP VÀO TRANG NÀY!
                </Typography>

                <Box
                    sx={{
                        width: '390px',
                        height: '390px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: -5,
                    }}
                >
                    <Box
                        component="img"
                        tabIndex={-1}
                        sx={{
                            outline: 'none',
                            userSelect: 'none',
                            pointerEvents: 'none',
                            width: '290px',
                            height: '290px',
                        }}
                        src={PlanetSvg}
                        alt="cover-phuocdev-mot-lap-trinh-vien"
                    />
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={handleGoHome}
                    disableRipple
                    sx={{
                        mt: -5,
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#0071bd',
                        color: 'white',
                        borderColor: 'white',
                        outline: 'none',
                        '&:focus': { outline: 'none' },
                        '&:hover': { color: '#fdba26', backgroundColor: '#0071bdff', borderColor: '#fdba26' },
                    }}
                >
                    Về trang chủ
                </Button>
            </Box>
        </Box>
    );
}

export default AccessDenied;

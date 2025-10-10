import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import PlanetSvg from '~/assets/planet.svg';
import AstronautSvg from '~/assets/astronaut.svg';
import ParticlesBackground from '~/assets/pngtree-starry-sky-white-blue-stars.jpg';
import { Link } from 'react-router-dom';

function NotFound() {
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
                    '@keyframes stars': {
                        '0%': { backgroundPosition: '-100% 100%' },
                        '100%': { backgroundPosition: '0 0' },
                    },
                    animation: 'stars 8s linear infinite alternate',
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${ParticlesBackground})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'repeat',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="h1"
                    tabIndex={-1}
                    sx={{ fontSize: '100px', fontWeight: 800, outline: 'none', userSelect: 'none' }}
                >
                    404
                </Typography>

                <Typography
                    tabIndex={-1}
                    sx={{
                        fontSize: '18px !important',
                        lineHeight: '25px',
                        fontWeight: 400,
                        maxWidth: '350px',
                        textAlign: 'center',
                        outline: 'none',
                        userSelect: 'none',
                    }}
                >
                    LOST IN&nbsp;
                    <Typography
                        component="span"
                        tabIndex={-1}
                        sx={{
                            position: 'relative',
                            outline: 'none',
                            userSelect: 'none',
                            '&:after': {
                                position: 'absolute',
                                content: '""',
                                borderBottom: '3px solid #fdba26',
                                left: 0,
                                top: '43%',
                                width: '100%',
                            },
                        }}
                    >
                        &nbsp;SPACE&nbsp;
                    </Typography>
                    &nbsp;
                    <Typography
                        component="span"
                        tabIndex={-1}
                        sx={{ color: '#fdba26', fontWeight: 500, outline: 'none', userSelect: 'none' }}
                    >
                        PhuocTranDev
                    </Typography>
                </Typography>

                <Typography tabIndex={-1} sx={{ outline: 'none', userSelect: 'none' }}>
                    ? Hmm, trang này không tồn tại nhen bồ tèo.
                </Typography>

                <Box sx={{ width: '390px', height: '390px', position: 'relative' }}>
                    <Box
                        component="img"
                        tabIndex={-1}
                        sx={{
                            width: '50px',
                            height: '50px',
                            position: 'absolute',
                            top: '20px',
                            right: '25px',
                            outline: 'none',
                            userSelect: 'none',
                            pointerEvents: 'none',
                            '@keyframes spinAround': {
                                from: { transform: 'rotate(0deg)' },
                                to: { transform: 'rotate(360deg)' },
                            },
                            animation: 'spinAround 5s linear 0s infinite',
                        }}
                        src={AstronautSvg}
                        alt="cover-phuocdev-mot-lap-trinh-vien"
                    />
                    <Box
                        component="img"
                        tabIndex={-1}
                        sx={{ outline: 'none', userSelect: 'none', pointerEvents: 'none' }}
                        src={PlanetSvg}
                        alt="cover-phuocdev-mot-lap-trinh-vien"
                    />
                </Box>

                <Link to="/" style={{ textDecoration: 'none' }} tabIndex={-1}>
                    <Button
                        variant="outlined"
                        startIcon={<HomeIcon />}
                        disableRipple
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'white',
                            borderColor: 'white',
                            outline: 'none',
                            '&:focus': { outline: 'none' },
                            '&:hover': { color: '#fdba26', borderColor: '#fdba26' },
                        }}
                    >
                        Go Home
                    </Button>
                </Link>
            </Box>
        </Box>
    );
}

export default NotFound;

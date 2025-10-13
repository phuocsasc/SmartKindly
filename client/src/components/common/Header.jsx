import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LabelImportantOutlinedIcon from '@mui/icons-material/LabelImportantOutlined';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';

function Header({ user = null, schoolName = 'Trường Mầm Non Kim Phụng', sidebarCollapsed = false }) {
    const navigate = useNavigate();

    const displayUsername = user?.username || 'Guest';
    const displayRole = user?.role || 'no role';

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 240px)',
                ml: sidebarCollapsed ? '80px' : '240px',
                backgroundColor: '#ffffff',
                color: '#333',
                boxShadow: '0 5px 30px rgba(0, 0, 0, 0.1)',
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
                {/* Bên trái - Tên trường học */}
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        fontWeight: 600,
                        color: '#1976d2',
                        fontSize: '18px',
                    }}
                >
                    {schoolName}
                </Typography>

                {/* Bên phải - Username và nút logout */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#333',
                            fontWeight: 500,
                        }}
                    >
                        <LabelImportantOutlinedIcon sx={{ mb: '-6px', mr: '4px' }} />
                        {displayRole} &nbsp;
                        <AccountCircleOutlinedIcon sx={{ mb: '-6px', mr: '4px' }} />
                        {displayUsername}
                    </Typography>

                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            fontSize: '14px',
                            px: 2,
                        }}
                    >
                        Đăng xuất
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;

import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useNavigate } from 'react-router-dom';
import { useUser } from '~/contexts/UserContext';
import { ROLE_CONFIG, ROLE_DISPLAY } from '~/config/roleConfig';
import { useState } from 'react';

function SchoolHeader({
    schoolName = 'Admin Hệ thống quản lý trường mầm non công lập',
    sidebarCollapsed,
    onToggleMobileSidebar,
}) {
    const navigate = useNavigate();
    const { user, clearUser } = useUser();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const displayUsername = user?.fullName || user?.username || 'Guest';
    const displayRole = ROLE_DISPLAY[user?.role] || '';
    const roleConfig = ROLE_CONFIG[user?.role] || { color: '#757575', bgColor: '#f5f5f5', icon: PersonIcon };
    const RoleIcon = roleConfig.icon;

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleViewProfile = () => {
        handleCloseMenu();
        navigate('/admin/user-info');
    };

    const handleChangePassword = () => {
        handleCloseMenu();
        navigate('/admin/user-info?tab=password');
    };

    const handleLogout = () => {
        clearUser();
        navigate('/login');
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                backgroundColor: '#ffffff',
                color: '#333',
                borderBottom: '1px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                transition: 'all 0.3s',
                width: { xs: '100%', sm: `calc(100% - ${sidebarCollapsed ? 80 : 240}px)` },
                ml: { xs: 0, sm: `${sidebarCollapsed ? 80 : 240}px` },
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton sx={{ display: { xs: 'inline-flex', sm: 'none' } }} onClick={onToggleMobileSidebar}>
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            color: '#1976d2',
                            fontSize: '18px',
                            display: { xs: 'none', md: 'block' },
                        }}
                    >
                        {schoolName}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Desktop Chip - Clickable */}
                    <Chip
                        icon={<RoleIcon sx={{ color: `${roleConfig.color} !important`, fontSize: 20 }} />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography component="span" sx={{ fontWeight: 400, fontSize: 14 }}>
                                    {displayRole} {' || '}
                                </Typography>
                                <Typography component="span" sx={{ fontWeight: 400, fontSize: 14 }}>
                                    {displayUsername}
                                </Typography>
                            </Box>
                        }
                        onClick={handleOpenMenu}
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            bgcolor: roleConfig.bgColor,
                            color: roleConfig.color,
                            fontWeight: 600,
                            maxWidth: 340,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.8,
                            },
                            '& .MuiChip-icon': {
                                marginLeft: '8px',
                            },
                        }}
                    />

                    {/* Mobile Chip - Clickable */}
                    <Chip
                        icon={<RoleIcon sx={{ color: `${roleConfig.color} !important`, fontSize: 18 }} />}
                        label={displayUsername}
                        onClick={handleOpenMenu}
                        sx={{
                            display: { xs: 'flex', sm: 'none' },
                            bgcolor: roleConfig.bgColor,
                            color: roleConfig.color,
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.8,
                            },
                            '& .MuiChip-icon': {
                                marginLeft: '8px',
                            },
                        }}
                    />

                    {/* Menu */}
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleCloseMenu}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{
                            sx: {
                                mt: 1.5,
                                minWidth: 220,
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            },
                        }}
                    >
                        <MenuItem onClick={handleViewProfile}>
                            <ListItemIcon>
                                <AccountCircleIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText>Thông tin cá nhân</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleChangePassword}>
                            <ListItemIcon>
                                <LockResetIcon fontSize="small" color="warning" />
                            </ListItemIcon>
                            <ListItemText>Đổi mật khẩu</ListItemText>
                        </MenuItem>
                    </Menu>

                    <IconButton onClick={handleLogout} color="error" title="Đăng xuất">
                        <LogoutIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default SchoolHeader;

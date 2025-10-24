import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Chip,
    Tooltip,
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
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import { useUser } from '~/contexts/UserContext';
import { ROLE_CONFIG, ROLE_DISPLAY } from '~/config/roleConfig';
import { useState } from 'react';

function SchoolHeader({ sidebarCollapsed, onToggleMobileSidebar }) {
    const navigate = useNavigate();
    const { user, clearUser } = useUser();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // ✅ Lấy tên trường từ user context
    const schoolName = user?.schoolName || 'Trường Mầm Non';

    const displayUsername = user?.fullName || user?.username || 'Guest';
    const displayRole = ROLE_DISPLAY[user?.role] || '';
    const roleConfig = ROLE_CONFIG[user?.role] || { color: '#757575', bgColor: '#f5f5f5', icon: PersonIcon };
    const RoleIcon = roleConfig.icon;

    // ✅ Kiểm tra xem có phải BGH Root không
    const isRoot = user?.role === 'ban_giam_hieu' && user?.isRoot === true;

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleViewProfile = () => {
        handleCloseMenu();
        navigate('/user-info');
    };

    const handleChangePassword = () => {
        handleCloseMenu();
        navigate('/user-info?tab=password');
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
                    {/* ✅ Hiển thị tên trường động */}
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
                    <Tooltip title={isRoot ? 'Ban giám hiệu Root - Quyền cao nhất trong trường' : ''} arrow>
                        <Box sx={{ position: 'relative', display: { xs: 'none', sm: 'inline-block' } }}>
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
                                    bgcolor: roleConfig.bgColor,
                                    color: roleConfig.color,
                                    fontWeight: 600,
                                    maxWidth: 340,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    // ✅ Thêm border vàng nếu là Root
                                    border: isRoot ? '2px solid #FFD700' : `1px solid ${roleConfig.color}`,
                                    boxShadow: isRoot ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        opacity: 0.8,
                                        boxShadow: isRoot ? '0 0 12px rgba(255, 215, 0, 0.6)' : 'none',
                                    },
                                    '& .MuiChip-icon': {
                                        marginLeft: '8px',
                                    },
                                }}
                            />

                            {/* ✅ Ngôi sao vàng cho Root */}
                            {isRoot && (
                                <StarIcon
                                    sx={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        fontSize: 16,
                                        color: '#FFD700',
                                        filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))',
                                        transform: 'rotate(-15deg)',
                                        pointerEvents: 'none', // ✅ Không cản click vào chip
                                    }}
                                />
                            )}
                        </Box>
                    </Tooltip>

                    {/* Mobile Chip - Clickable */}
                    <Tooltip title={isRoot ? 'Ban giám hiệu Root - Quyền cao nhất trong trường' : ''} arrow>
                        <Box sx={{ position: 'relative', display: { xs: 'inline-block', sm: 'none' } }}>
                            <Chip
                                icon={<RoleIcon sx={{ color: `${roleConfig.color} !important`, fontSize: 18 }} />}
                                label={displayUsername}
                                onClick={handleOpenMenu}
                                sx={{
                                    bgcolor: roleConfig.bgColor,
                                    color: roleConfig.color,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    // ✅ Thêm border vàng nếu là Root
                                    border: isRoot ? '2px solid #FFD700' : `1px solid ${roleConfig.color}`,
                                    boxShadow: isRoot ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        opacity: 0.8,
                                        boxShadow: isRoot ? '0 0 12px rgba(255, 215, 0, 0.6)' : 'none',
                                    },
                                    '& .MuiChip-icon': {
                                        marginLeft: '8px',
                                    },
                                }}
                            />

                            {/* ✅ Ngôi sao vàng cho Root (Mobile) */}
                            {isRoot && (
                                <StarIcon
                                    sx={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        fontSize: 16,
                                        color: '#FFD700',
                                        filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))',
                                        transform: 'rotate(-15deg)',
                                        pointerEvents: 'none',
                                    }}
                                />
                            )}
                        </Box>
                    </Tooltip>

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

import { AppBar, Toolbar, Typography, IconButton, Box, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { useNavigate } from 'react-router-dom';
import { useUser } from '~/contexts/UserContext';
import { ROLE_DISPLAY, ROLES } from '~/config/rbacConfig';

// Cấu hình màu sắc và icon cho từng vai trò
const ROLE_CONFIG = {
    [ROLES.BAN_GIAM_HIEU]: { color: '#d32f2f', bgColor: '#ffebee', icon: SchoolIcon },
    [ROLES.TO_TRUONG]: { color: '#f57c00', bgColor: '#fff3e0', icon: GroupsIcon },
    [ROLES.GIAO_VIEN]: { color: '#1976d2', bgColor: '#e3f2fd', icon: PersonIcon },
    [ROLES.KE_TOAN]: { color: '#388e3c', bgColor: '#e8f5e9', icon: AccountBalanceIcon },
    [ROLES.PHU_HUYNH]: { color: '#7b1fa2', bgColor: '#f3e5f5', icon: FamilyRestroomIcon },
};

function Header({ schoolName = 'Trường Mầm Non Kim Phụng', sidebarCollapsed, onToggleMobileSidebar }) {
    const navigate = useNavigate();
    const { user, clearUser } = useUser();

    const displayUsername = user?.fullName || user?.username || 'Guest';
    const displayRole = ROLE_DISPLAY[user?.role] || '';
    const roleConfig = ROLE_CONFIG[user?.role] || { color: '#757575', bgColor: '#f5f5f5', icon: PersonIcon };
    const RoleIcon = roleConfig.icon;

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
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                width: { xs: '100%', sm: `calc(100% - ${sidebarCollapsed ? 80 : 240}px)` },
                ml: { xs: 0, sm: `${sidebarCollapsed ? 80 : 240}px` },
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                {/* LEFT */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Menu button for mobile - ✅ Thay đổi onClick */}
                    <IconButton sx={{ display: { xs: 'inline-flex', sm: 'none' } }} onClick={onToggleMobileSidebar}>
                        <MenuIcon />
                    </IconButton>

                    {/* School name (hide on mobile) */}
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

                {/* RIGHT */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Desktop: show username + role with icon */}
                    <Chip
                        icon={<RoleIcon sx={{ color: `${roleConfig.color} !important`, fontSize: 20 }} />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography component="span" sx={{ fontWeight: 400, fontSize: 14 }}>
                                    {displayRole}
                                    {' || '}
                                </Typography>
                                <Typography component="span" sx={{ fontWeight: 400, fontSize: 14 }}>
                                    {displayUsername}
                                </Typography>
                            </Box>
                        }
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            bgcolor: roleConfig.bgColor,
                            color: roleConfig.color,
                            fontWeight: 600,
                            maxWidth: 340,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            '& .MuiChip-icon': {
                                marginLeft: '8px',
                            },
                        }}
                    />

                    {/* Mobile: only show username with icon */}
                    <Chip
                        icon={<RoleIcon sx={{ color: `${roleConfig.color} !important`, fontSize: 18 }} />}
                        label={displayUsername}
                        sx={{
                            display: { xs: 'flex', sm: 'none' },
                            bgcolor: roleConfig.bgColor,
                            color: roleConfig.color,
                            fontWeight: 600,
                            '& .MuiChip-icon': {
                                marginLeft: '8px',
                            },
                        }}
                    />

                    {/* Logout icon only */}
                    <IconButton onClick={handleLogout} color="error" title="Đăng xuất">
                        <LogoutIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;

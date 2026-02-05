//client/src/components/common/Sidebar/ParentSidebar.jsx
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    IconButton,
    Box,
    useMediaQuery,
} from '@mui/material';
import { Dashboard as DashboardIcon, ExpandMore } from '@mui/icons-material';
import KeyboardArrowRightOutlinedIcon from '@mui/icons-material/KeyboardArrowRightOutlined';
import ChildCareOutlinedIcon from '@mui/icons-material/ChildCareOutlined';
import KeyboardDoubleArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftOutlined';
import KeyboardDoubleArrowRightOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowRightOutlined';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import MarkAsUnreadOutlinedIcon from '@mui/icons-material/MarkAsUnreadOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import logo_sidebar from '/logo_thanh_menu_tach_nen.png';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
// import { PERMISSIONS } from '~/config/rbacConfig';

const menuItems = [
    { text: 'Tổng quan', icon: <DashboardIcon />, path: '/parent/dashboard' },

    {
        text: 'Nhà trường',
        icon: <LocationCityOutlinedIcon />,
        path: '/parent/school-info',
    },
    {
        text: 'Thông tin trẻ',
        icon: <ChildCareOutlinedIcon />,
        path: '/parent/child-info',
    },

    {
        text: 'Thời khóa biểu',
        icon: <CalendarMonthOutlinedIcon />,
        path: '/parent/schedule',
    },

    {
        text: 'Thực đơn hằng tuần',
        icon: <RestaurantMenuIcon />,
        path: '/parent/weekly-menu',
    },
    {
        text: 'Điểm danh',
        icon: <EventAvailableIcon />,
        path: '/parent/attendance',
    },
    {
        text: 'Đánh giá hằng ngày',
        icon: <EditCalendarIcon />,
        path: '/parent/daily-assessment',
    },
    {
        text: 'Phiếu bé ngoan',
        icon: <LocalFloristIcon />,
        path: '/parent/children-certificate',
    },
    {
        text: 'Cuối độ tuổi',
        icon: <EmojiPeopleIcon />,
        path: '/parent/age-completion',
    },
    {
        text: 'Phiếu dặn dò',
        icon: <MarkAsUnreadOutlinedIcon />,
        path: '/parent/requests',
    },
    {
        text: 'Trợ lý A.I',
        icon: <ChatOutlinedIcon />,
        path: '/parent/chatbot',
    },
];

function ParentSidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
    // ✅ Lấy user và permission checker
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});
    const drawerWidth = collapsed ? 80 : 240;

    const theme = useTheme();
    const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

    // ✅ Lọc menuItems dựa trên permission
    const filteredMenuItems = menuItems.filter((item) => {
        // Nếu menu có permission, check quyền
        if (item.permission) {
            return hasPermission(item.permission);
        }
        // Nếu không có permission field, luôn hiển thị
        return true;
    });

    useEffect(() => {
        const currentPath = location.pathname;
        const activeParent = menuItems.find((item) => item.children?.some((child) => child.path === currentPath));
        if (activeParent) {
            setOpenMenus((prev) => (prev[activeParent.text] ? prev : { [activeParent.text]: true }));
        }
    }, [location.pathname]);

    const handleToggleMenu = (text) => setOpenMenus((prev) => ({ ...prev, [text]: !prev[text] }));

    const isMenuActive = (item) => {
        if (item.path && location.pathname === item.path) return true;
        if (item.children) return item.children.some((child) => location.pathname === child.path);
        return false;
    };

    // ✅ Tạo 2 phiên bản drawer content: một cho desktop (có thể collapse), một cho mobile (luôn full)
    const createDrawerContent = (isCollapsed) => (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    p: '0 10px',
                    backgroundColor: '#ffffff', // ✅ Background riêng cho header
                    color: 'white',
                    borderBottom: '2px solid #0071BC', // ✅ Thêm border phân cách
                }}
            >
                {!isCollapsed && (
                    <Box
                        component="img"
                        src={logo_sidebar}
                        alt="SmartKindly Logo"
                        sx={{
                            height: '56px',
                            width: '160px',
                            objectFit: 'contain',
                        }}
                    />
                )}
                <IconButton
                    color="inherit"
                    sx={{ py: 2.2, color: '#44AFC1ff' }}
                    onClick={isSmUp ? onToggle : onCloseMobile}
                >
                    {isSmUp ? (
                        isCollapsed ? (
                            <KeyboardDoubleArrowRightOutlinedIcon sx={{ fontSize: 28 }} />
                        ) : (
                            <KeyboardDoubleArrowLeftOutlinedIcon sx={{ fontSize: 28 }} />
                        )
                    ) : (
                        <KeyboardDoubleArrowLeftOutlinedIcon sx={{ fontSize: 28 }} />
                    )}
                </IconButton>
            </Box>

            {/* <Divider /> */}

            <List
                sx={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    py: 0,
                    maxHeight: 'calc(100vh - 64px)',
                    color: '#0068AD',
                    fontWeight: 500,
                    // mt: 0.5,
                    width: '100%',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '0px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                }}
            >
                {/* ✅ Map qua filteredMenuItems thay vì menuItems */}
                {filteredMenuItems.map((item) => {
                    const hasChildren = !!item.children;
                    const isActive = isMenuActive(item);
                    return (
                        <Box key={item.text}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => {
                                        if (hasChildren) {
                                            handleToggleMenu(item.text);
                                        } else {
                                            if (!isSmUp) onCloseMobile?.();
                                        }
                                    }}
                                    component={hasChildren ? 'div' : Link}
                                    to={hasChildren ? undefined : item.path}
                                    selected={isActive}
                                    sx={{
                                        minHeight: 44,

                                        px: isCollapsed ? 1.5 : 2,
                                        backgroundColor: isActive ? '#0071BC' : 'transparent',
                                        '&.Mui-selected': {
                                            backgroundColor: '#0071BC !important',
                                        },

                                        borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
                                        '&:hover': { backgroundColor: '#0071BC60' },
                                        transition: 'all 0.2s',
                                        width: '100%',
                                        overflow: 'hidden',
                                        '& .MuiListItemIcon-root': {
                                            minWidth: 32,
                                            justifyContent: 'center',
                                            color: isActive ? '#fff' : '#0068AD',
                                        },
                                        '& .MuiListItemText-root': {
                                            opacity: isCollapsed ? 0 : 1,
                                            whiteSpace: 'nowrap',
                                            transition: 'opacity 0.3s',
                                            ml: isCollapsed ? 0 : 0.8,
                                            overflow: 'hidden',
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 24,
                                            mr: isCollapsed ? 0 : 0.2,
                                            ml: isCollapsed ? 0 : -1,
                                            justifyContent: 'center',
                                            color: isActive ? '#fff' : '#0068AD',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        sx={{
                                            opacity: isCollapsed ? 0 : 1,
                                            display: isCollapsed ? 'none' : 'block',
                                            '& .MuiListItemText-primary': {
                                                fontWeight: isActive ? 700 : 500,
                                                color: isActive ? '#fff' : '#004F7C',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                letterSpacing: '0.2px',
                                            },
                                        }}
                                    />
                                    {hasChildren &&
                                        !isCollapsed &&
                                        (openMenus[item.text] ? (
                                            <ExpandMore
                                                sx={{ color: isActive ? '#fff' : '#0068AD', transition: 'color 0.5s' }}
                                            />
                                        ) : (
                                            <KeyboardArrowRightOutlinedIcon
                                                sx={{ color: isActive ? '#fff' : '#0068AD', transition: 'color 0.5s' }}
                                            />
                                        ))}
                                </ListItemButton>
                            </ListItem>

                            {hasChildren && (
                                <Collapse in={openMenus[item.text] && !isCollapsed} timeout={300} unmountOnExit={false}>
                                    <List component="div" disablePadding>
                                        {item.children.map((child) => (
                                            <ListItemButton
                                                key={child.text}
                                                selected={location.pathname === child.path}
                                                component={Link}
                                                to={child.path}
                                                onClick={() => {
                                                    setOpenMenus((prev) =>
                                                        prev[item.text] ? prev : { [item.text]: true },
                                                    ); // Giữ menu cha mở
                                                    if (!isSmUp) onCloseMobile?.();
                                                }}
                                                sx={{
                                                    pl: isCollapsed ? 2 : 6,
                                                    py: 0.8,
                                                    backgroundColor:
                                                        location.pathname === child.path ? '#0071BC' : 'transparent',
                                                    '&.Mui-selected': {
                                                        backgroundColor: '#0071BC !important',
                                                    },
                                                    '&:hover': { backgroundColor: '#0071BC60' },
                                                    borderLeft:
                                                        location.pathname === child.path
                                                            ? '3px solid #fff'
                                                            : '3px solid transparent',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <ListItemText
                                                    primary={child.text}
                                                    primaryTypographyProps={{
                                                        fontSize: 15,
                                                        fontWeight: location.pathname === child.path ? 600 : 500,
                                                        color: location.pathname === child.path ? '#fff' : '#004F7C',
                                                    }}
                                                />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Collapse>
                            )}
                        </Box>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <>
            {/* Mobile: temporary drawer - ✅ LUÔN FULL (không collapse) */}
            <Drawer
                variant="temporary"
                open={!isSmUp && !!mobileOpen}
                onClose={onCloseMobile}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                        backgroundImage: 'url("/anh_thanh_menu.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        // borderRight: '1px solid #e0e0e0',
                    },
                }}
            >
                {createDrawerContent(false)} {/* ✅ Mobile luôn truyền false (không collapse) */}
            </Drawer>

            {/* Desktop/Tablet: permanent drawer - có thể collapse */}
            <Drawer
                variant="permanent"
                open
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        transition: 'width 0.3s ease',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        backgroundImage: 'url("/anh_thanh_menu.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        // opacity: 0.8,
                        borderRight: '1px solid #e0e0e0',
                    },
                }}
            >
                {createDrawerContent(collapsed)} {/* ✅ Desktop dùng state collapsed */}
            </Drawer>
        </>
    );
}

export default ParentSidebar;

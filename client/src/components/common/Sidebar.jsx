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
    Typography,
    Divider,
    useMediaQuery,
} from '@mui/material';
import { Dashboard as DashboardIcon, People as PeopleIcon, ExpandLess, ExpandMore } from '@mui/icons-material';
import ChildCareOutlinedIcon from '@mui/icons-material/ChildCareOutlined';
import KeyboardDoubleArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftOutlined';
import KeyboardDoubleArrowRightOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowRightOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SwitchAccountOutlinedIcon from '@mui/icons-material/SwitchAccountOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';

const menuItems = [
    { text: 'Trang chủ', icon: <DashboardIcon />, path: '/dashboard' },

    { text: 'Quản lý người dùng', icon: <SwitchAccountOutlinedIcon />, path: '/users' },

    {
        text: 'Khai báo dữ liệu',
        icon: <StorageOutlinedIcon />,
        children: [
            { text: 'Thông tin nhà trường', path: '/data/school-info' },
            { text: 'Năm học', path: '/data/school-year' },
            { text: 'Tổ bộ môn', path: '/data/department' },
            { text: 'Lớp học', path: '/data/classes' },
        ],
    },
    {
        text: 'Quản lý cán bộ',
        icon: <PeopleIcon />,
        children: [
            { text: 'Hồ sơ cán bộ', path: '/staff/profile' },
            { text: 'Phân công phụ trách', path: '/staff/assignment' },
            { text: 'Đánh giá xếp loại', path: '/staff/evaluation' },
            { text: 'Danh hiệu thi đua', path: '/staff/reward' },
        ],
    },
    {
        text: 'Quản lý trẻ',
        icon: <ChildCareOutlinedIcon />,
        children: [
            { text: 'Hồ sơ trẻ', path: '/children/profile' },
            { text: 'Điểm danh', path: '/children/attendance' },
            { text: 'Đánh giá trẻ', path: '/children/assessment' },
            { text: 'Phiếu bé ngoan', path: '/children/good-kid' },
            { text: 'Đánh giá hoàn thành chương trình', path: '/children/program-complete' },
        ],
    },
    {
        text: 'Kế hoạch giáo dục',
        icon: <HistoryEduOutlinedIcon />,
        children: [
            { text: 'Quản lý mục tiêu năm học nhà trường theo từng độ tuổi', path: '/edu-plan/year-target' },
            { text: 'Quản lý kế hoạch giáo dục theo chủ đề/tuần/tháng', path: '/edu-plan/theme-plan' },
            { text: 'Quản lý nội dung - hoạt động giáo dục', path: '/edu-plan/activities' },
            { text: 'Quản lý các chủ đề/sự kiện', path: '/edu-plan/events' },
            { text: 'Quản lý thời khóa biểu', path: '/edu-plan/schedule' },
        ],
    },
    {
        text: 'Dinh dưỡng',
        icon: <RestaurantOutlinedIcon />,
        children: [
            { text: 'Nhà cung cấp', path: '/nutrition/supplier' },
            { text: 'Món ăn', path: '/nutrition/meal' },
            { text: 'Thực phẩm', path: '/nutrition/food' },
            { text: 'Thực đơn', path: '/nutrition/menu' },
        ],
    },
    {
        text: 'Học phí',
        icon: <MonetizationOnOutlinedIcon />,
        children: [
            { text: 'Thiết lập khoản thu', path: '/fee/setup' },
            { text: 'Danh mục khoản thu', path: '/fee/list' },
            { text: 'Thu thanh toán', path: '/fee/payment' },
            { text: 'Quản lý ngày học/nghỉ', path: '/fee/day-off' },
            { text: 'Báo cáo thống kê thu chi', path: '/fee/report' },
        ],
    },
    {
        text: 'Y tế',
        icon: <MedicalServicesOutlinedIcon />,
        children: [
            { text: 'Bảo hiểm y tế', path: '/health/insurance' },
            { text: 'Sổ khám sức khỏe', path: '/health/medical-book' },
            { text: 'Tiêm chủng', path: '/health/vaccination' },
        ],
    },
];

function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});
    const drawerWidth = collapsed ? 80 : 240;

    const theme = useTheme();
    const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

    useEffect(() => {
        const currentPath = location.pathname;
        const activeParent = menuItems.find((item) => item.children?.some((child) => child.path === currentPath));
        if (activeParent) {
            setOpenMenus((prev) => (prev[activeParent.text] ? prev : { [activeParent.text]: true }));
        }
    }, [location.pathname]);

    const handleToggleMenu = (text) => setOpenMenus((prev) => ({ ...prev, [text]: !prev[text] }));

    const handleMenuClick = (path, hasChildren, text) => {
        if (hasChildren) handleToggleMenu(text);
        else {
            navigate(path);
            if (!isSmUp) onCloseMobile?.();
        }
    };

    const handleSubMenuClick = (path, parentText) => {
        setOpenMenus((prev) => (prev[parentText] ? prev : { [parentText]: true }));
        navigate(path);
        if (!isSmUp) onCloseMobile?.();
    };

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
                    p: 1.0,
                    backgroundColor: '#1976d2',
                    color: 'white',
                }}
            >
                {!isCollapsed && <Typography variant="h6">SmartKindly</Typography>}
                <IconButton color="inherit" onClick={isSmUp ? onToggle : onCloseMobile}>
                    {isSmUp ? (
                        isCollapsed ? (
                            <KeyboardDoubleArrowRightOutlinedIcon />
                        ) : (
                            <KeyboardDoubleArrowLeftOutlinedIcon />
                        )
                    ) : (
                        <KeyboardDoubleArrowLeftOutlinedIcon />
                    )}
                </IconButton>
            </Box>

            <Divider />

            <List
                sx={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    maxHeight: 'calc(100vh - 64px)',
                    mt: 0.5,
                    width: '100%',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#90caf9', borderRadius: '18px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#64b5f6' },
                }}
            >
                {menuItems.map((item) => {
                    const hasChildren = !!item.children;
                    const isActive = isMenuActive(item);
                    return (
                        <Box key={item.text}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => handleMenuClick(item.path, hasChildren, item.text)}
                                    selected={isActive}
                                    sx={{
                                        minHeight: 44,
                                        px: isCollapsed ? 1.5 : 2,
                                        backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                                        borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                                        '&:hover': { backgroundColor: '#e3f2fd' },
                                        transition: 'all 0.2s',
                                        width: '100%',
                                        overflow: 'hidden',
                                        '& .MuiListItemIcon-root': {
                                            minWidth: 32,
                                            justifyContent: 'center',
                                            color: isActive ? '#1976d2' : '#555',
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
                                            color: isActive ? '#1976d2' : '#555',
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
                                                fontWeight: isActive ? 600 : 400,
                                                color: isActive ? '#1976d2' : 'inherit',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            },
                                        }}
                                    />
                                    {hasChildren &&
                                        !isCollapsed &&
                                        (openMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
                                </ListItemButton>
                            </ListItem>

                            {hasChildren && (
                                <Collapse in={openMenus[item.text] && !isCollapsed} timeout={300} unmountOnExit={false}>
                                    <List component="div" disablePadding>
                                        {item.children.map((child) => (
                                            <ListItemButton
                                                key={child.text}
                                                selected={location.pathname === child.path}
                                                onClick={() => handleSubMenuClick(child.path, item.text)}
                                                sx={{
                                                    pl: isCollapsed ? 2 : 6,
                                                    py: 0.8,
                                                    backgroundColor:
                                                        location.pathname === child.path ? '#e8f0fe' : 'transparent',
                                                    '&:hover': { backgroundColor: '#f1f5ff' },
                                                    borderLeft:
                                                        location.pathname === child.path
                                                            ? '3px solid #1976d2'
                                                            : '3px solid transparent',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <ListItemText
                                                    primary={child.text}
                                                    primaryTypographyProps={{
                                                        fontSize: 14,
                                                        fontWeight: location.pathname === child.path ? 600 : 400,
                                                        color: location.pathname === child.path ? '#1976d2' : 'inherit',
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
                        backgroundColor: '#f5f5f5',
                        borderRight: '1px solid #e0e0e0',
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
                        backgroundColor: '#f5f5f5',
                        borderRight: '1px solid #e0e0e0',
                    },
                }}
            >
                {createDrawerContent(collapsed)} {/* ✅ Desktop dùng state collapsed */}
            </Drawer>
        </>
    );
}

export default Sidebar;

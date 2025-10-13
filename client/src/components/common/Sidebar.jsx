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
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    // ✅ MENU THÊM MỚI PHÍA DƯỚI
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

function Sidebar({ collapsed, onToggle }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});

    const drawerWidth = collapsed ? 80 : 240;

    const handleToggleMenu = (text) => {
        setOpenMenus((prev) => ({ ...prev, [text]: !prev[text] }));
    };

    const handleMenuClick = (path, hasChildren, text) => {
        if (hasChildren) {
            handleToggleMenu(text);
        } else {
            navigate(path);
        }
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    transition: 'width 0.3s ease',
                    overflowX: 'hidden',
                    backgroundColor: '#f5f5f5',
                    borderRight: '1px solid #e0e0e0',

                    /* ✅ Scrollbar Custom */
                    '&::-webkit-scrollbar': {
                        width: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#e3f2fd',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#90caf9',
                        borderRadius: '18px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: '#64b5f6',
                    },
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    p: 1.4,
                    backgroundColor: '#1976d2',
                    boxShadow: '0 5px 10px rgba(132, 204, 253, 0.87)',
                    color: 'white',
                }}
            >
                {!collapsed && <Typography variant="h6">SmartKindly</Typography>}
                <IconButton color="inherit" onClick={onToggle}>
                    {collapsed ? <KeyboardDoubleArrowRightOutlinedIcon /> : <KeyboardDoubleArrowLeftOutlinedIcon />}
                </IconButton>
            </Box>

            <Divider />
            <List>
                {menuItems.map((item) => {
                    const hasChildren = !!item.children;

                    return (
                        <Box key={item.text}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => handleMenuClick(item.path, hasChildren, item.text)}
                                    selected={location.pathname === item.path}
                                    sx={{
                                        minHeight: 44,
                                        px: collapsed ? 1.5 : 2,
                                        backgroundColor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
                                        borderLeft:
                                            location.pathname === item.path
                                                ? '4px solid #1976d2'
                                                : '4px solid transparent',
                                        '&:hover': {
                                            backgroundColor: '#e3f2fd',
                                        },
                                        transition: 'all 0.2s',
                                        '& .MuiListItemIcon-root': {
                                            minWidth: 32,
                                            justifyContent: 'center',
                                            color: location.pathname === item.path ? '#1976d2' : '#555',
                                        },
                                        '& .MuiListItemText-root': {
                                            opacity: collapsed ? 0 : 1,
                                            whiteSpace: 'nowrap',
                                            transition: 'opacity 0.3s',
                                            ml: collapsed ? 0 : 0.8,
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 24, // ✅ Giảm khoảng cách icon
                                            mr: collapsed ? 0 : 0.2, // ✅ Canh đều với text
                                            ml: collapsed ? 0 : -1,
                                            justifyContent: 'center',
                                            color: '#555',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} sx={{ opacity: collapsed ? 0 : 1 }} />
                                    {hasChildren &&
                                        !collapsed &&
                                        (openMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
                                </ListItemButton>
                            </ListItem>

                            {/* Sub menu */}

                            <AnimatePresence>
                                {openMenus[item.text] && !collapsed && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    >
                                        {/* submenu list here */}
                                        {hasChildren && (
                                            <Collapse
                                                in={openMenus[item.text] && !collapsed}
                                                timeout={300}
                                                sx={{
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                <List component="div" disablePadding>
                                                    {item.children.map((child) => (
                                                        <ListItemButton
                                                            key={child.text}
                                                            selected={location.pathname === child.path}
                                                            onClick={() => navigate(child.path)}
                                                            sx={{
                                                                pl: collapsed ? 2 : 6,
                                                                py: 0.8,
                                                                backgroundColor:
                                                                    location.pathname === child.path
                                                                        ? '#e8f0fe'
                                                                        : 'transparent',
                                                                '&:hover': { backgroundColor: '#f1f5ff' },
                                                                borderLeft:
                                                                    location.pathname === child.path
                                                                        ? '3px solid #1976d2'
                                                                        : '3px solid transparent',
                                                            }}
                                                        >
                                                            <ListItemText
                                                                primary={child.text}
                                                                primaryTypographyProps={{ fontSize: 14 }}
                                                            />
                                                        </ListItemButton>
                                                    ))}
                                                </List>
                                            </Collapse>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Box>
                    );
                })}
            </List>
        </Drawer>
    );
}

export default Sidebar;

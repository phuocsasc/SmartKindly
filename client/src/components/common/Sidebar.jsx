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
import { useState, useEffect } from 'react';

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

function Sidebar({ collapsed, onToggle }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});

    const drawerWidth = collapsed ? 80 : 240;

    // ✅ Logic mới: Quản lý menu mở/đóng thông minh hơn
    useEffect(() => {
        const currentPath = location.pathname;

        // Tìm parent menu chứa route đang active
        const activeParent = menuItems.find((item) => item.children?.some((child) => child.path === currentPath));

        // Nếu có parent đang active
        if (activeParent) {
            setOpenMenus((prev) => {
                // ⛔ Nếu parent đã mở rồi -> KHÔNG cập nhật -> tránh nhấp nháy
                if (prev[activeParent.text]) {
                    return prev;
                }

                // ✅ Nếu chưa mở -> mở đúng 1 parent thôi
                return { [activeParent.text]: true };
            });
        }
    }, [location.pathname]);

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

    // ✅ Sửa lại chỉ đóng các parent khác, không gây nhấp nháy
    const handleSubMenuClick = (path, parentText) => {
        setOpenMenus((prev) => {
            // Nếu click lại submenu cùng parent -> KHÔNG đổi state -> KHÔNG nhấp nháy
            if (prev[parentText]) return prev;

            // Nếu chuyển sang parent khác -> đóng parent cũ, mở parent mới
            return { [parentText]: true };
        });

        navigate(path);
    };

    // ✅ Kiểm tra xem menu item có active không (bao gồm cả children)
    const isMenuActive = (item) => {
        if (item.path && location.pathname === item.path) return true;
        if (item.children) {
            return item.children.some((child) => location.pathname === child.path);
        }
        return false;
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
                    overflowX: 'hidden', // ✅ Ẩn scroll ngang
                    overflowY: 'auto', // ✅ Chỉ cho phép scroll dọc
                    backgroundColor: '#f5f5f5',
                    borderRight: '1px solid #e0e0e0',
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
            <List
                sx={{
                    overflowY: 'auto',
                    overflowX: 'hidden', // ✅ Ẩn scroll ngang trong List
                    maxHeight: 'calc(100vh - 64px)',
                    mt: 0.5,
                    width: '100%', // ✅ Đảm bảo List không vượt quá width container
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
                                        px: collapsed ? 1.5 : 2,
                                        backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                                        borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                                        '&:hover': {
                                            backgroundColor: '#e3f2fd',
                                        },
                                        transition: 'all 0.2s',
                                        width: '100%', // ✅ Đảm bảo button không vượt quá container
                                        overflow: 'hidden', // ✅ Ẩn overflow cho button
                                        '& .MuiListItemIcon-root': {
                                            minWidth: 32,
                                            justifyContent: 'center',
                                            color: isActive ? '#1976d2' : '#555',
                                        },
                                        '& .MuiListItemText-root': {
                                            opacity: collapsed ? 0 : 1,
                                            whiteSpace: 'nowrap',
                                            transition: 'opacity 0.3s',
                                            ml: collapsed ? 0 : 0.8,
                                            overflow: 'hidden', // ✅ Ẩn overflow cho text
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 24,
                                            mr: collapsed ? 0 : 0.2,
                                            ml: collapsed ? 0 : -1,
                                            justifyContent: 'center',
                                            color: isActive ? '#1976d2' : '#555',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        sx={{
                                            opacity: collapsed ? 0 : 1,
                                            display: collapsed ? 'none' : 'block', // ✅ Ẩn hoàn toàn khi collapsed
                                            '& .MuiListItemText-primary': {
                                                fontWeight: isActive ? 600 : 400,
                                                color: isActive ? '#1976d2' : 'inherit',
                                                overflow: 'hidden', // ✅ Ẩn overflow cho text
                                                textOverflow: 'ellipsis', // ✅ Thêm ellipsis nếu text quá dài
                                            },
                                        }}
                                    />
                                    {hasChildren &&
                                        !collapsed &&
                                        (openMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
                                </ListItemButton>
                            </ListItem>

                            {/* ✅ Sử dụng Collapse thay vì framer-motion để tránh re-mount */}
                            {hasChildren && (
                                <Collapse
                                    in={openMenus[item.text] && !collapsed}
                                    timeout={300}
                                    unmountOnExit={false} // ✅ Quan trọng: không unmount component
                                >
                                    <List component="div" disablePadding>
                                        {item.children.map((child) => (
                                            <ListItemButton
                                                key={child.text}
                                                selected={location.pathname === child.path}
                                                onClick={() => handleSubMenuClick(child.path, item.text)} // ✅ Sử dụng handleSubMenuClick
                                                sx={{
                                                    pl: collapsed ? 2 : 6,
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
        </Drawer>
    );
}

export default Sidebar;

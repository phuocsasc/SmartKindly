import { useState } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    Box,
    Typography,
    Divider,
    Button,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotification } from '~/contexts/NotificationContext';
import dayjs from '~/config/dayjsConfig';

function NotificationBell() {
    const { notifications, unreadCount, loading, hasMore, markAsRead, markAllAsRead, loadMore } = useNotification();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
        // TODO: Navigate to detail page if needed
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    return (
        <>
            <IconButton
                onClick={handleOpen}
                size="large"
                sx={{
                    color: '#333', // ✅ FIX: Đổi màu từ white sang màu xám đậm để phù hợp với header trắng
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)', // ✅ FIX: Hover nhẹ hơn
                    },
                }}
            >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxHeight: 600,
                        mt: 1.5,
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box sx={{ p: 2, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            Thông báo
                        </Typography>
                        {unreadCount > 0 && (
                            <Button
                                size="small"
                                startIcon={<DoneAllIcon />}
                                onClick={handleMarkAllAsRead}
                                sx={{ textTransform: 'none' }}
                            >
                                Đánh dấu tất cả
                            </Button>
                        )}
                    </Box>
                    {unreadCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                            {unreadCount} thông báo chưa đọc
                        </Typography>
                    )}
                </Box>

                <Divider />

                {/* Notification List */}
                <List sx={{ py: 0, maxHeight: 450, overflow: 'auto' }}>
                    {loading && notifications.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                Chưa có thông báo nào
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {notifications.map((notification, index) => (
                                <ListItem
                                    key={notification._id}
                                    button
                                    onClick={() => handleNotificationClick(notification)}
                                    sx={{
                                        bgcolor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                                        borderLeft: notification.isRead ? 'none' : '3px solid #1976d2',
                                        '&:hover': {
                                            bgcolor: notification.isRead
                                                ? 'rgba(0, 0, 0, 0.04)'
                                                : 'rgba(25, 118, 210, 0.12)',
                                        },
                                        py: 1.5,
                                    }}
                                    divider={index < notifications.length - 1}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {notification.title}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography
                                                    variant="body2"
                                                    color="text.primary"
                                                    sx={{ mb: 0.5, display: 'block' }}
                                                >
                                                    {notification.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dayjs(notification.createdAt).fromNow()}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}

                            {/* Load More Button */}
                            {hasMore && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                                    <Button
                                        size="small"
                                        onClick={loadMore}
                                        disabled={loading}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {loading ? <CircularProgress size={20} /> : 'Xem thêm'}
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </List>
            </Menu>
        </>
    );
}

export default NotificationBell;

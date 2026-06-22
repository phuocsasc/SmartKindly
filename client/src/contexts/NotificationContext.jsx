import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socketClient } from '~/utils/socket';
import { notificationApi } from '~/apis/notificationApi';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children, user }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // ✅ Fetch notifications
    const fetchNotifications = useCallback(
        async (pageNum = 1, append = false) => {
            if (!user) return;

            try {
                setLoading(true);
                const res = await notificationApi.getAll({ page: pageNum, limit: 20 });
                const { notifications: newNotifications, pagination } = res.data.data;

                if (append) {
                    setNotifications((prev) => [...prev, ...newNotifications]);
                } else {
                    setNotifications(newNotifications);
                }

                setPage(pagination.page);
                setHasMore(pagination.page < pagination.totalPages);
            } catch (error) {
                console.error('❌ Error fetching notifications:', error);
                toast.error('Lỗi khi tải thông báo');
            } finally {
                setLoading(false);
            }
        },
        [user],
    );

    // ✅ Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;

        try {
            const res = await notificationApi.getUnreadCount();
            setUnreadCount(res.data.data.unreadCount);
        } catch (error) {
            console.error('❌ Error fetching unread count:', error);
        }
    }, [user]);

    // ✅ Mark as read
    const markAsRead = async (notificationId) => {
        try {
            await notificationApi.markAsRead(notificationId);

            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === notificationId
                        ? {
                              ...n,
                              isRead: true,
                              readAt: new Date().toISOString(),
                          }
                        : n,
                ),
            );

            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('❌ Error marking as read:', error);
            toast.error('Lỗi khi đánh dấu đã đọc');
        }
    };

    // ✅ Mark all as read
    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();

            setNotifications((prev) =>
                prev.map((n) => ({
                    ...n,
                    isRead: true,
                    readAt: new Date().toISOString(),
                })),
            );

            setUnreadCount(0);
            toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (error) {
            console.error('❌ Error marking all as read:', error);
            toast.error('Lỗi khi đánh dấu tất cả đã đọc');
        }
    };

    // ✅ Load more notifications
    const loadMore = () => {
        if (!loading && hasMore) {
            fetchNotifications(page + 1, true);
        }
    };

    // ✅ Initialize socket connection and listeners
    useEffect(() => {
        if (!user) return;

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            socketClient.disconnect();
            return;
        }

        // ✅ Connect socket
        socketClient.connect(accessToken);

        // ✅ Listen for new notifications
        const handleNewNotification = (notification) => {
            console.log('🔔 [Notification] Received:', notification);

            // ✅ Add to top of list
            setNotifications((prev) => [notification, ...prev]);

            // ✅ Increase unread count
            setUnreadCount((prev) => prev + 1);

            // ✅ Show toast
            toast.info(notification.title, {
                position: 'top-right',
                autoClose: 5000,
            });
        };

        socketClient.on('newNotification', handleNewNotification);

        // ✅ Fetch initial data
        fetchNotifications();
        fetchUnreadCount();

        // ✅ Cleanup
        return () => {
            socketClient.off('newNotification', handleNewNotification);
        };
    }, [user, fetchNotifications, fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        loading,
        hasMore,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        loadMore,
    };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

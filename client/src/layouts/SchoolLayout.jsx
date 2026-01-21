import { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import SchoolSidebar from '~/components/common/Sidebar/SchoolSidebar';
import SchoolHeader from '~/components/common/Header/SchoolHeader';

function SchoolLayout({ children, user = null }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSidebarToggle = () => setSidebarCollapsed((v) => !v);

    // ✅ Đổi thành toggle (bật/tắt) thay vì chỉ mở
    const handleToggleMobileSidebar = () => setMobileOpen((v) => !v);

    const handleCloseMobileSidebar = () => setMobileOpen(false);

    return (
        <Box sx={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
            <CssBaseline />

            <SchoolSidebar
                collapsed={sidebarCollapsed}
                onToggle={handleSidebarToggle}
                mobileOpen={mobileOpen}
                onCloseMobile={handleCloseMobileSidebar}
            />

            <SchoolHeader
                user={user}
                sidebarCollapsed={sidebarCollapsed}
                onToggleMobileSidebar={handleToggleMobileSidebar}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    mt: '64px',
                    display: 'flex', // Kích hoạt flexbox cho vùng main
                    flexDirection: 'column', // Xếp nội dung theo chiều dọc
                    height: 'calc(100vh - 64px)',
                    backgroundColor: '#fafafa',
                    overflowY: 'auto',
                    transition: 'margin-left 0.3s ease',
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#90caf9', borderRadius: '18px' },
                }}
            >
                {/* PHẦN NỘI DUNG CHÍNH */}
                <Box sx={{ flex: 1, p: { xs: 1, sm: 2 } }}>{children}</Box>
            </Box>
        </Box>
    );
}

export default SchoolLayout;

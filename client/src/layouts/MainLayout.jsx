import { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Header from '~/components/common/Header';
import Sidebar from '~/components/common/Sidebar';

function MainLayout({ children, user = null }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleSidebarToggle = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* Sidebar */}
            <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

            {/* Header */}
            <Header user={user} sidebarCollapsed={sidebarCollapsed} />

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 2,
                    mt: '64px', // Header height offset
                    transition: 'margin-left 0.3s ease',
                    minHeight: 'calc(100vh - 64px)',
                    backgroundColor: '#fafafa',
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

export default MainLayout;

import { Alert, Box, Typography, Divider, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { TAB_URLS } from '~/utils/constants';
import thumnailOnePice from '~/assets/one-pice-banner.jpg';
import coverOnepice from '~/assets/one-piece-manga-covers.jpg';
import { usePermission } from '~/hooks/usePermission';
import { permissions } from '~/config/rbacConfig';
import MainLayout from '~/layouts/MainLayout';
import { useUser } from '~/contexts/UserContext';

function Dashboard() {
    const location = useLocation();
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    const getDefaultActiveTab = () => {
        let activeTab = TAB_URLS.DASHBOARD;
        Object.values(TAB_URLS).forEach((tab) => {
            if (location.pathname.includes(tab)) activeTab = tab;
        });
        return activeTab;
    };

    const [tab, setTab] = useState(getDefaultActiveTab());
    const handleChange = (event, newTab) => {
        setTab(newTab);
    };

    return (
        <MainLayout user={user}>
            <Box sx={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box as={Link} to="" target="blank">
                    <Box
                        component="img"
                        sx={{ width: '100%', height: '280px', borderRadius: '6px', objectFit: 'cover' }}
                        src={thumnailOnePice}
                        alt="cover-thumnal-phuocdev"
                    ></Box>
                </Box>

                <Alert
                    severity="info"
                    sx={{ '.MuiAlert-message': { overflow: 'hidden' }, width: { md: 'max-content' } }}
                >
                    Đây là trang Dashboard sau khi user:&nbsp;
                    <Typography variant="span" sx={{ fontWeight: 'bold', '&:hover': { color: '#fdba26' } }}>
                        {user?.username}
                    </Typography>
                    &nbsp;
                </Alert>
                <Alert
                    severity="success"
                    variant="outlined"
                    sx={{ '.MuiAlert-message': { overflow: 'hidden' }, width: { md: 'max-content' } }}
                >
                    Role hiện tại của User đang đăng nhập là:&nbsp;
                    <Typography variant="span" sx={{ fontWeight: 'bold', '&:hover': { color: '#fdba26' } }}>
                        {user?.role}
                    </Typography>
                </Alert>

                {/* Khu vực phân quyền truy cập. sử dụng Mui Tabs cho đơn giản để test các trang khác nhau.  */}

                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={handleChange} aria-label="RBAC Permission Tabs">
                            {hasPermission(permissions.VIEW_DASHBOARD) && (
                                <Tab label="Dashboard" value={TAB_URLS.DASHBOARD} component={Link} to={'/dashboard'} />
                            )}
                            {hasPermission(permissions.VIEW_SUPPORT) && (
                                <Tab label="Support" value={TAB_URLS.SUPPORT} component={Link} to={'/support'} />
                            )}
                            {hasPermission(permissions.VIEW_MESSAGES) && (
                                <Tab label="Messages" value={TAB_URLS.MESSAGES} component={Link} to={'/messages'} />
                            )}
                            {hasPermission(permissions.VIEW_REVENUE) && (
                                <Tab label="Revenue" value={TAB_URLS.REVENUE} component={Link} to={'/revenue'} />
                            )}
                            {hasPermission(permissions.VIEW_ADMIN_TOOLS) && (
                                <Tab
                                    label="Admin-tools"
                                    value={TAB_URLS.ADMIN_TOOLS}
                                    component={Link}
                                    to={'/admin-tools'}
                                />
                            )}
                        </TabList>
                    </Box>
                    {hasPermission(permissions.VIEW_DASHBOARD) && (
                        <TabPanel value={TAB_URLS.DASHBOARD} sx={{ padding: '24px 0' }}>
                            <Alert severity="success" sx={{ width: 'max-content' }}>
                                Nội dung trang Dashboard chung cho tất cả các Roles!
                            </Alert>
                        </TabPanel>
                    )}
                    {hasPermission(permissions.VIEW_SUPPORT) && (
                        <TabPanel value={TAB_URLS.SUPPORT} sx={{ padding: '24px 0' }}>
                            <Alert severity="success" sx={{ width: 'max-content' }}>
                                Nội dung trang Support chung cho tất cả các Roles!
                            </Alert>
                        </TabPanel>
                    )}
                    {hasPermission(permissions.VIEW_MESSAGES) && (
                        <TabPanel value={TAB_URLS.MESSAGES} sx={{ padding: '24px 0' }}>
                            <Alert severity="info" sx={{ width: 'max-content' }}>
                                Nội dung trang Messages!
                            </Alert>
                        </TabPanel>
                    )}
                    {hasPermission(permissions.VIEW_REVENUE) && (
                        <TabPanel value={TAB_URLS.REVENUE} sx={{ padding: '24px 0' }}>
                            <Alert severity="warning" sx={{ width: 'max-content' }}>
                                Nội dung trang Revenue!
                            </Alert>
                        </TabPanel>
                    )}
                    {hasPermission(permissions.VIEW_ADMIN_TOOLS) && (
                        <TabPanel value={TAB_URLS.ADMIN_TOOLS} sx={{ padding: '24px 0' }}>
                            <Alert severity="error" sx={{ width: 'max-content' }}>
                                Nội dung trang Admin tools!
                            </Alert>
                        </TabPanel>
                    )}
                </TabContext>

                <Divider />

                <Box
                    component="img"
                    sx={{ width: '80%', mb: '30px' }}
                    src={coverOnepice}
                    alt="coverOnepice-phuoc-dev"
                ></Box>
            </Box>
        </MainLayout>
    );
}

export default Dashboard;

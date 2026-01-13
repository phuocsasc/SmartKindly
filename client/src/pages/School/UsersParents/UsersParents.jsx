import { Box, Typography, Paper } from '@mui/material';
import SwitchAccountOutlinedIcon from '@mui/icons-material/SwitchAccountOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
function UsersParents() {
    const { user } = useUser();
    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Người dùng', icon: SwitchAccountOutlinedIcon, href: '#' }, { text: 'Phụ huynh' }]}
                />
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Phụ huynh
                        </Typography>
                    </Box>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}
export default UsersParents;

import { Box, Typography, Paper } from '@mui/material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
function ParentRequest() {
    const { user } = useUser();
    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Dặn dò ' }]} />
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Dặn dò
                        </Typography>
                    </Box>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}
export default ParentRequest;

import {
    Box,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Divider,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SchoolIcon from '@mui/icons-material/School';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import { useUser } from '~/contexts/UserContext';

function StatCard({ title, value, deltaText, icon, color = 'primary' }) {
    return (
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #eee' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${color}.main`, color: 'white', width: 44, height: 44 }}>{icon}</Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="success.main" noWrap>
                        {deltaText}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* Header khu vực trang */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Tổng quan nhà trường
                        </Typography>
                    </Box>
                </Box>

                {/* Hàng KPI */}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Tổng số cán bộ"
                            value="128"
                            deltaText="+5 tuần này"
                            icon={<PeopleIcon />}
                            color="primary"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Tổng số học sinh"
                            value="1,024"
                            deltaText="+18 tháng này"
                            icon={<SchoolIcon />}
                            color="success"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Thu học phí"
                            value="₫ 312,5M"
                            deltaText="+3.2% so với tháng trước"
                            icon={<ReceiptLongIcon />}
                            color="warning"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Mức độ hoàn thành kê hoạch của năm nay"
                            value="76%"
                            deltaText="Tiến độ kế hoạch"
                            icon={<TrendingUpIcon />}
                            color="info"
                        />
                    </Grid>
                </Grid>

                {/* Khu biểu đồ + thông báo */}
                <Grid container spacing={2}>
                    {/* Biểu đồ/Overview (placeholder, có thể nhét Recharts sau) */}
                    <Grid item xs={12} md={8}>
                        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #eee' }}>
                            <CardHeader
                                title="Tổng quan tháng"
                                subheader="Số liệu tổng hợp theo tuần"
                                action={<Chip label="Tháng 10" size="small" />}
                            />
                            <Divider />
                            <CardContent>
                                <Box
                                    sx={{
                                        height: 260,
                                        borderRadius: 2,
                                        border: '1px dashed #d7d7d7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: '#fff',
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        (Chỗ này đặt biểu đồ sau – Recharts/Chart.js)
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Hoàn thành mục tiêu tháng
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={76}
                                        sx={{ height: 8, borderRadius: 10, mt: 0.5 }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Thông báo gần đây */}
                    <Grid item xs={12} md={4}>
                        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #eee' }}>
                            <CardHeader
                                avatar={<NotificationsNoneIcon color="action" />}
                                title="Thông báo gần đây"
                                subheader="Từ hệ thống & giáo viên"
                            />
                            <Divider />
                            <CardContent sx={{ pt: 1 }}>
                                <List dense>
                                    <ListItem disableGutters>
                                        <ListItemText
                                            primary="Cập nhật thực đơn tuần 3"
                                            secondary="2 giờ trước • Khối Lá"
                                            primaryTypographyProps={{ noWrap: true }}
                                        />
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <ListItemText
                                            primary="Điểm danh hoàn tất 98%"
                                            secondary="Hôm nay • Toàn trường"
                                            primaryTypographyProps={{ noWrap: true }}
                                        />
                                    </ListItem>
                                    <ListItem disableGutters>
                                        <ListItemText
                                            primary="Đợt thu học phí tháng 10"
                                            secondary="Hạn 25/10 • Phòng Kế toán"
                                            primaryTypographyProps={{ noWrap: true }}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Bảng/nội dung dưới (placeholder) */}
                <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #eee' }}>
                    <CardHeader title="Hoạt động gần đây" subheader="Sự kiện từ các phòng ban" />
                    <Divider />
                    <CardContent sx={{ py: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Chip label="Phòng Giáo vụ • 10:20" size="small" />
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    Phê duyệt thời khoá biểu tuần tới.
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Chip label="Phòng Y tế • 09:00" size="small" color="success" />
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    Hoàn tất kiểm tra tiêm chủng định kỳ.
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Chip label="Kế toán • 08:45" size="small" color="warning" />
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    Đối soát công nợ tháng 09.
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Chip label="Nhà trường • 07:30" size="small" color="info" />
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    Thông báo sân chơi cuối tuần.
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </PageContainer>
        </MainLayout>
    );
}

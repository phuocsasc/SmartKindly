// client/src/pages/Admin/Dashboard/TotalUsers.jsx

import { Paper, Typography, Box, Avatar, Divider, Stack, keyframes } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

// Animation
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Cấu hình màu sắc
const ROLE_COLORS = {
    ban_giam_hieu: { color: '#d32f2f', bg: '#ffebee', icon: SchoolIcon },
    to_truong: { color: '#f57c00', bg: '#fff3e0', icon: SupervisorAccountIcon }, // Đã sửa lại icon cho khớp import
    giao_vien: { color: '#1976d2', bg: '#e3f2fd', icon: PersonIcon },
    phu_huynh: { color: '#7b1fa2', bg: '#f3e5f5', icon: FamilyRestroomIcon },
};

const ROLE_LABELS = {
    ban_giam_hieu: 'BGH',
    to_truong: 'Tổ trưởng',
    giao_vien: 'Giáo viên',
    phu_huynh: 'Phụ huynh',
};

// Component con để render một thẻ thống kê
const StatCard = ({ roleKey, count, index }) => {
    const config = ROLE_COLORS[roleKey];
    if (!config) return null; // Fallback nếu role không khớp
    const Icon = config.icon;

    return (
        <Box
            sx={{
                flex: 1, // Để chia đều không gian
                p: 1.5,
                borderRadius: 2,
                bgcolor: config.bg,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                transition: 'all 0.3s ease',
                cursor: 'default',
                animation: `${fadeInUp} ${0.5 + index * 0.1}s ease both`,
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${config.color}30`,
                },
            }}
        >
            <Avatar sx={{ bgcolor: config.color, width: 36, height: 36 }}>
                <Icon fontSize="small" />
            </Avatar>
            <Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ display: 'block', mb: -0.5 }}
                >
                    {ROLE_LABELS[roleKey]}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: config.color }}>
                    {count}
                </Typography>
            </Box>
        </Box>
    );
};

function TotalUsers({ data }) {
    // Chuẩn bị dữ liệu cho Bar Chart
    // Đảm bảo thứ tự hiển thị trên biểu đồ giống thứ tự mong muốn: BGH -> Tổ trưởng -> GV -> PH
    const orderedRoles = ['ban_giam_hieu', 'to_truong', 'giao_vien', 'phu_huynh'];

    const chartData = orderedRoles.map((role) => {
        const item = data.byRole.find((r) => r.role === role) || { role, count: 0 };
        return {
            name: ROLE_LABELS[role],
            value: item.count,
            color: ROLE_COLORS[role].color,
            role: role,
        };
    });

    // Helper function để lấy count an toàn
    const getCount = (role) => data.byRole.find((r) => r.role === role)?.count || 0;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <Box
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        p: 1.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        minWidth: 120,
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: dataPoint.color, mb: 0.5 }}>
                        {label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Số lượng: <strong>{dataPoint.value}</strong>
                    </Typography>
                </Box>
            );
        }
        return null;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 4,
                bgcolor: 'white',
                boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative Blob */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(25, 118, 210, 0.15) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        }}
                    >
                        <PeopleIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#0D47A1' }}>
                            Người dùng
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Thống kê nhân sự
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#1976D2', lineHeight: 1 }}>
                        {data.total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        TỔNG SỐ
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* --- CHART AREA: BAR CHART --- */}
            <Box sx={{ flex: 1, width: '100%', minHeight: 0, zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />

                        <XAxis
                            dataKey="name"
                            axisLine={{ stroke: '#9E9E9E', strokeWidth: 1.5 }}
                            tickLine={false}
                            tick={{ fill: '#616161', fontSize: 11, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={{ stroke: '#9E9E9E', strokeWidth: 1.5 }}
                            tickLine={false}
                            tick={{ fill: '#9E9E9E', fontSize: 11, fontWeight: 600 }}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* Footer Statistics Cards (2 Rows) */}
            <Stack spacing={1.5} mt={2} sx={{ zIndex: 1 }}>
                {/* Dòng 1: BGH + Tổ trưởng */}
                <Stack direction="row" spacing={1.5}>
                    <StatCard roleKey="ban_giam_hieu" count={getCount('ban_giam_hieu')} index={0} />
                    <StatCard roleKey="to_truong" count={getCount('to_truong')} index={1} />
                </Stack>

                {/* Dòng 2: Giáo viên + Phụ huynh */}
                <Stack direction="row" spacing={1.5}>
                    <StatCard roleKey="giao_vien" count={getCount('giao_vien')} index={2} />
                    <StatCard roleKey="phu_huynh" count={getCount('phu_huynh')} index={3} />
                </Stack>
            </Stack>
        </Paper>
    );
}

export default TotalUsers;

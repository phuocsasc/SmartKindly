// client/src/pages/Admin/Dashboard/AdminActivityStats.jsx
// ✅ COPY EXACT từ client/src/pages/School/Dashboard/ActivityStats.jsx

import { Paper, Typography, Box, Avatar, Divider } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import ExtensionIcon from '@mui/icons-material/Extension';

function AdminActivityStats({ data }) {
    // ... (Copy toàn bộ code từ ActivityStats.jsx)
    const chartData = data.map((item) => ({
        ageGroup: item.ageGroup,
        count: item.count,
        fullMark: Math.max(...data.map((d) => d.count)) * 1.2,
    }));

    const totalActivities = data.reduce((acc, curr) => acc + curr.count, 0);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Box
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        p: 1.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 3,
                        boxShadow: '0 8px 24px rgba(236, 64, 122, 0.15)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: '#d81b60', fontWeight: 800 }}>
                        {label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Số lượng: <span style={{ color: '#ec407a', fontWeight: 800 }}>{payload[0].value}</span> hoạt
                        động
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
                boxShadow: '3',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236, 64, 122, 0.1) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #f48fb1 0%, #d81b60 100%)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(216, 27, 96, 0.3)',
                        }}
                    >
                        <ExtensionIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#880e4f' }}>
                            Hoạt động giáo dục
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Phân bổ theo nhóm tuổi
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#d81b60', lineHeight: 1 }}>
                        {totalActivities}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        TỔNG SỐ
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 1, borderStyle: 'dashed', opacity: 0.6 }} />

            <Box sx={{ flex: 1, width: '100%', minHeight: 0, zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="51%" cy="50%" outerRadius="70%" data={chartData}>
                        <defs>
                            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec407a" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ec407a" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>

                        <PolarGrid gridType="polygon" stroke="#bdbdbd" strokeWidth={1.5} strokeDasharray="4 4" />
                        <PolarAngleAxis dataKey="ageGroup" tick={{ fill: '#455a64', fontSize: 11, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />

                        <Radar
                            name="Hoạt động"
                            dataKey="count"
                            stroke="#ad1457"
                            strokeWidth={3}
                            fill="url(#activityFill)"
                            fillOpacity={1}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={false} />
                    </RadarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

export default AdminActivityStats;

// client/src/pages/School/Dashboard/YearTargetStats.jsx

import { Paper, Typography, Box, Avatar, Divider } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

// Icons
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

function YearTargetStats({ data }) {
    // 1. Chuẩn bị dữ liệu & Tính tổng
    const chartData = data.map((item) => ({
        ageGroup: item.ageGroup,
        count: item.count,
        fullMark: Math.max(...data.map((d) => d.count)) * 1.2,
    }));

    const totalTargets = data.reduce((acc, curr) => acc + curr.count, 0);

    // 2. Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Box
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        p: 1.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 3,
                        boxShadow: '0 8px 24px rgba(92, 107, 192, 0.15)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: '#3949ab', fontWeight: 800 }}>
                        {label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Số lượng: <span style={{ color: '#5c6bc0', fontWeight: 800 }}>{payload[0].value}</span> mục tiêu
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
            {/* --- Decorative Blobs --- */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(92, 107, 192, 0.1) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #7986cb 0%, #3f51b5 100%)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)',
                        }}
                    >
                        <TrackChangesIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#283593' }}>
                            Mục tiêu năm học
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Phân bổ theo nhóm tuổi
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#3949ab', lineHeight: 1 }}>
                        {totalTargets}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        TỔNG TIÊU CHÍ
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 1, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* --- CHART AREA --- */}
            <Box sx={{ flex: 1, width: '100%', minHeight: 0, zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {/* ✅ GIẢM outerRadius XUỐNG 65% ĐỂ THU NHỎ BIỂU ĐỒ */}
                    <RadarChart cx="54%" cy="50%" outerRadius="70%" data={chartData}>
                        <defs>
                            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#5c6bc0" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#5c6bc0" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>

                        {/* ✅ TĂNG ĐỘ ĐẬM CHO LƯỚI (PolarGrid) */}
                        <PolarGrid
                            gridType="polygon"
                            stroke="#bdbdbd" // Màu xám đậm hơn (Grey 400)
                            strokeWidth={1.5} // Tăng độ dày nét vẽ
                            strokeDasharray="4 4" // (Tùy chọn) Nét đứt để trông hiện đại hơn
                        />

                        <PolarAngleAxis dataKey="ageGroup" tick={{ fill: '#455a64', fontSize: 11, fontWeight: 700 }} />

                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />

                        <Radar
                            name="Mục tiêu"
                            dataKey="count"
                            stroke="#3949ab"
                            strokeWidth={3}
                            fill="url(#radarFill)"
                            fillOpacity={1}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={false} />
                    </RadarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

export default YearTargetStats;

// client/src/pages/School/Dashboard/AssessmentStats.jsx

import { Paper, Typography, Box, Avatar, Divider } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

// Định nghĩa màu sắc cố định
const STATUS_COLORS = {
    'Đã đánh giá': '#009688', // Teal
    'Chưa đánh giá': '#FF9800', // Orange
};

function AssessmentStats({ data, weekNumber, classInfo }) {
    // 1. Map data & Format Day
    const formatDay = (dateStr) => {
        const d = dayjs(dateStr);
        const dayName = d.format('dddd');
        const shortMap = {
            Monday: 'T2',
            'Thứ Hai': 'T2',
            Tuesday: 'T3',
            'Thứ Ba': 'T3',
            Wednesday: 'T4',
            'Thứ Tư': 'T4',
            Thursday: 'T5',
            'Thứ Năm': 'T5',
            Friday: 'T6',
            'Thứ Sáu': 'T6',
            Saturday: 'T7',
            'Thứ Bảy': 'T7',
            Sunday: 'CN',
            'Chủ Nhật': 'CN',
        };
        return shortMap[dayName] || dayName;
    };

    const chartData = data.map((item) => ({
        fullDate: dayjs(item.date).format('DD/MM/YYYY'),
        day: formatDay(item.date),
        'Đã đánh giá': item.assessed,
        'Chưa đánh giá': item.notAssessed,
    }));

    // 2. Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dateStr = payload[0].payload.fullDate;
            return (
                <Box
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.98)',
                        p: 1.5,
                        border: '2px solid #E0E0E0',
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(8px)',
                        minWidth: 160,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: '#00695C', fontWeight: 800, mb: 1 }}>
                        {label} <span style={{ fontWeight: 400, color: '#757575' }}>({dateStr})</span>
                    </Typography>
                    {payload.map((entry, index) => (
                        <Box
                            key={index}
                            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '2px',
                                        bgcolor: STATUS_COLORS[entry.name],
                                    }}
                                />
                                <Typography variant="caption" sx={{ color: '#424242', fontWeight: 700 }}>
                                    {entry.name}
                                </Typography>
                            </Box>
                            <Typography variant="caption" fontWeight={800} color="text.primary">
                                {entry.value}
                            </Typography>
                        </Box>
                    ))}
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
            {/* --- Decorative Blobs (Tông Teal/Green) --- */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(38, 166, 154, 0.1) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #26A69A 0%, #00897B 100%)', // Gradient Teal
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(0, 137, 123, 0.3)',
                        }}
                    >
                        <AssignmentTurnedInIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#00695C' }}>
                            Đánh giá trẻ hằng ngày ( Tuần {weekNumber} )
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Lớp {classInfo.name}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* --- CHART AREA --- */}
            <Box sx={{ flex: 1, width: '100%', minHeight: 0, zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                        barGap={4} // Khoảng cách giữa 2 cột trong ngày
                        barCategoryGap="20%"
                    >
                        <defs>
                            {/* Gradient Teal (Đã đánh giá) */}
                            <linearGradient id="gradAssessed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4DB6AC" stopOpacity={1} />
                                <stop offset="100%" stopColor="#009688" stopOpacity={1} />
                            </linearGradient>
                            {/* Gradient Orange (Chưa đánh giá) */}
                            <linearGradient id="gradNotAssessed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FFCC80" stopOpacity={1} />
                                <stop offset="100%" stopColor="#FF9800" stopOpacity={1} />
                            </linearGradient>
                        </defs>

                        {/* Lưới nền */}
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />

                        {/* Trục X đậm */}
                        <XAxis
                            dataKey="day"
                            axisLine={{ stroke: '#9E9E9E', strokeWidth: 2 }}
                            tickLine={false}
                            tick={{ fill: '#424242', fontSize: 12, fontWeight: 700 }}
                            dy={10}
                        />

                        {/* Trục Y đậm */}
                        <YAxis
                            axisLine={{ stroke: '#9E9E9E', strokeWidth: 2 }}
                            tickLine={false}
                            tick={{ fill: '#757575', fontSize: 11, fontWeight: 600 }}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />

                        <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="rect"
                            iconSize={10}
                            wrapperStyle={{
                                fontSize: '12px',
                                fontWeight: 600,
                                paddingBottom: '10px',
                                color: '#616161',
                            }}
                            // Định nghĩa Payload thủ công để khớp màu STATUS_COLORS
                            payload={[
                                { value: 'Đã đánh giá', type: 'rect', color: STATUS_COLORS['Đã đánh giá'] },
                                { value: 'Chưa đánh giá', type: 'rect', color: STATUS_COLORS['Chưa đánh giá'] },
                            ]}
                        />

                        {/* Cột 1: Đã đánh giá */}
                        <Bar dataKey="Đã đánh giá" fill="url(#gradAssessed)" radius={[4, 4, 0, 0]} maxBarSize={20} />

                        {/* Cột 2: Chưa đánh giá */}
                        <Bar
                            dataKey="Chưa đánh giá"
                            fill="url(#gradNotAssessed)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

export default AssessmentStats;

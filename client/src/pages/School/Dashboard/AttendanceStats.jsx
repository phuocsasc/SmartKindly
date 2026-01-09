// client/src/pages/School/Dashboard/AttendanceStats.jsx

import { Paper, Typography, Box, Avatar, Divider } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

// Định nghĩa màu sắc cố định để dùng cho Legend và Tooltip marker
const STATUS_COLORS = {
    'Có mặt': '#00C853', // Green
    'Vắng có phép': '#FFAB00', // Amber
    'Vắng không phép': '#FF1744', // Red
    'Chưa điểm danh': '#B0BEC5', // Grey
};

function AttendanceStats({ data, weekNumber, classInfo }) {
    // 1. Map data
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
        'Có mặt': item.present,
        'Vắng có phép': item.absentWithPermission,
        'Vắng không phép': item.absentWithoutPermission,
        'Chưa điểm danh': item.notMarked,
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
                        minWidth: 180,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: '#4527A0', fontWeight: 800, mb: 1 }}>
                        {label} <span style={{ fontWeight: 400, color: '#757575' }}>({dateStr})</span>
                    </Typography>
                    {payload.map((entry, index) => (
                        <Box
                            key={index}
                            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {/* ✅ Sử dụng STATUS_COLORS để lấy màu chuẩn cho marker */}
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
            {/* --- Decorative Blobs --- */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(171, 71, 188, 0.1) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #AB47BC 0%, #7B1FA2 100%)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(123, 31, 162, 0.3)',
                        }}
                    >
                        <FactCheckIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#6A1B9A' }}>
                            Điểm danh trẻ hằng ngày ( Tuần {weekNumber} )
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
                        barGap={2}
                        barCategoryGap="20%"
                    >
                        <defs>
                            <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00E676" stopOpacity={1} />
                                <stop offset="100%" stopColor="#00C853" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradPerm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FFEA00" stopOpacity={1} />
                                <stop offset="100%" stopColor="#FFD600" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradNoPerm" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF5252" stopOpacity={1} />
                                <stop offset="100%" stopColor="#D50000" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradNone" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ECEFF1" stopOpacity={1} />
                                <stop offset="100%" stopColor="#CFD8DC" stopOpacity={1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />

                        <XAxis
                            dataKey="day"
                            axisLine={{ stroke: '#9E9E9E', strokeWidth: 2 }}
                            tickLine={false}
                            tick={{ fill: '#424242', fontSize: 12, fontWeight: 700 }}
                            dy={10}
                        />

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
                            // ✅ Định nghĩa payload thủ công cho Legend để dùng màu STATUS_COLORS
                            payload={[
                                { value: 'Có mặt', type: 'rect', color: STATUS_COLORS['Có mặt'] },
                                { value: 'Vắng có phép', type: 'rect', color: STATUS_COLORS['Vắng có phép'] },
                                { value: 'Vắng không phép', type: 'rect', color: STATUS_COLORS['Vắng không phép'] },
                                { value: 'Chưa điểm danh', type: 'rect', color: STATUS_COLORS['Chưa điểm danh'] },
                            ]}
                        />

                        <Bar dataKey="Có mặt" fill="url(#gradPresent)" radius={[4, 4, 0, 0]} maxBarSize={15} />
                        <Bar dataKey="Vắng có phép" fill="url(#gradPerm)" radius={[4, 4, 0, 0]} maxBarSize={15} />
                        <Bar dataKey="Vắng không phép" fill="url(#gradNoPerm)" radius={[4, 4, 0, 0]} maxBarSize={15} />
                        <Bar dataKey="Chưa điểm danh" fill="url(#gradNone)" radius={[4, 4, 0, 0]} maxBarSize={15} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

export default AttendanceStats;

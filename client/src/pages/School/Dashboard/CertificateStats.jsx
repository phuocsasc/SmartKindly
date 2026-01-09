// client/src/pages/School/Dashboard/CertificateStats.jsx

import { Paper, Typography, Box, Stack, Avatar, Divider, keyframes } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Icons
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

// --- Animation Keyframes ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

function CertificateStats({ data, weekNumber, classInfo }) {
    // Màu sắc Gradient (Success & Error Theme)
    const COLORS = {
        assessed: '#66bb6a', // Green 400
        notAssessed: '#ef5350', // Red 400
        bgAssessed: '#e8f5e9',
        bgNotAssessed: '#ffebee',
    };

    // Chuẩn bị dữ liệu cho BarChart
    const chartData = [
        { name: 'Đã đánh giá', value: data.assessed, color: COLORS.assessed },
        { name: 'Chưa đánh giá', value: data.notAssessed, color: COLORS.notAssessed },
    ];

    const total = data.assessed + data.notAssessed;
    const assessedPercent = total > 0 ? ((data.assessed / total) * 100).toFixed(0) : 0;
    const notAssessedPercent = total > 0 ? ((data.notAssessed / total) * 100).toFixed(0) : 0;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <Box
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        p: 1.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 3,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: payload[0].payload.color, fontWeight: 700 }}>
                        {payload[0].payload.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Số lượng:{' '}
                        <span style={{ color: payload[0].payload.color, fontWeight: 800 }}>{payload[0].value}</span> bé
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
                justifyContent: 'space-between',
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
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 167, 38, 0.15) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                        }}
                    >
                        <EmojiEventsIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#e65100' }}>
                            Phiếu bé ngoan ( Tuần {weekNumber} )
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Lớp {classInfo.name}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* --- CHART AREA: BAR CHART --- */}
            <Box sx={{ flex: 1, width: '100%', minHeight: 0, zIndex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={40}>
                        <defs>
                            <linearGradient id="gradAssessed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#81c784" stopOpacity={1} />
                                <stop offset="100%" stopColor="#388e3c" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradNotAssessed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#e57373" stopOpacity={1} />
                                <stop offset="100%" stopColor="#d32f2f" stopOpacity={1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />

                        <XAxis
                            dataKey="name"
                            // ✅ Làm đậm trục hoành (XAxis)
                            axisLine={{ stroke: '#9E9E9E', strokeWidth: 2 }}
                            tickLine={false}
                            tick={{ fill: '#424242', fontSize: 11, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            // ✅ Làm đậm trục tung (YAxis)
                            axisLine={{ stroke: '#9E9E9E', strokeWidth: 2 }}
                            tickLine={false}
                            tick={{ fill: '#757575', fontSize: 11, fontWeight: 600 }}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.name === 'Đã đánh giá' ? 'url(#gradAssessed)' : 'url(#gradNotAssessed)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* --- FOOTER STATISTICS --- */}
            <Stack direction="row" spacing={2} mt={1} sx={{ zIndex: 1 }}>
                {/* Card Đã đánh giá */}
                <Box
                    sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: COLORS.bgAssessed,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.3s ease',
                        animation: `${fadeInUp} 0.5s ease both`,
                        '&:hover': { transform: 'translateY(-3px)' },
                    }}
                >
                    <Avatar sx={{ bgcolor: 'white', color: COLORS.assessed, width: 36, height: 36, boxShadow: 1 }}>
                        <CheckCircleOutlineIcon fontSize="small" />
                    </Avatar>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 700, opacity: 0.8 }}>
                            Đã đánh giá ({assessedPercent}%)
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1b5e20', lineHeight: 1.2 }}>
                            {data.assessed}
                        </Typography>
                    </Box>
                </Box>

                {/* Card Chưa đánh giá */}
                <Box
                    sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: COLORS.bgNotAssessed,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.3s ease',
                        animation: `${fadeInUp} 0.5s ease both`,
                        animationDelay: '0.1s',
                        '&:hover': { transform: 'translateY(-3px)' },
                    }}
                >
                    <Avatar sx={{ bgcolor: 'white', color: COLORS.notAssessed, width: 36, height: 36, boxShadow: 1 }}>
                        <HighlightOffIcon fontSize="small" />
                    </Avatar>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#c62828', fontWeight: 700, opacity: 0.8 }}>
                            Chưa đánh giá ({notAssessedPercent}%)
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#b71c1c', lineHeight: 1.2 }}>
                            {data.notAssessed}
                        </Typography>
                    </Box>
                </Box>
            </Stack>
        </Paper>
    );
}

export default CertificateStats;

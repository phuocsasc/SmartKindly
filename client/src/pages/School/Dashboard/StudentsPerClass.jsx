// client/src/pages/School/Dashboard/StudentsPerClass.jsx

import { Paper, Typography, Box, Avatar, Stack, Divider, keyframes } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Icons
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BoyOutlinedIcon from '@mui/icons-material/BoyOutlined';
import GirlOutlinedIcon from '@mui/icons-material/GirlOutlined';

// --- Animation Keyframes ---
const popIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

function StudentsPerClass({ data, classInfo }) {
    // Màu sắc chủ đạo (Deep Blue Theme)
    const COLORS = {
        male: '#42a5f5', // Blue 400
        female: '#ab47bc', // Purple 400 (để khác biệt xíu so với TotalChildren)
        maleGradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        femaleGradient: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    };

    const chartData = [
        { name: 'Nam', value: data.male, color: COLORS.male },
        { name: 'Nữ', value: data.female, color: COLORS.female },
    ];

    const malePercent = data.total > 0 ? ((data.male / data.total) * 100).toFixed(0) : 0;
    const femalePercent = data.total > 0 ? ((data.female / data.total) * 100).toFixed(0) : 0;

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
                        {payload[0].name}: {payload[0].value} bé
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
            {/* --- Decorative Blobs (Trang trí nền Xanh) --- */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(66, 165, 245, 0.15) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)', // Gradient Blue
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)',
                        }}
                    >
                        <PeopleAltIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#1565c0' }}>
                            Học sinh lớp ( {classInfo.name} )
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Phân bổ theo nhóm tuổi: ( {classInfo.ageGroup} )
                        </Typography>
                    </Box>
                </Box>

                {/* Số tổng */}
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#1976d2', lineHeight: 1 }}>
                        {data.total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        TỔNG SỐ
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 1, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* --- CHART AREA --- */}
            <Box sx={{ flex: 1, position: 'relative', minHeight: 180, width: '100%', my: 1, zIndex: 1 }}>
                {/* Số tổng nằm giữa biểu đồ */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        animation: `${popIn} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 900,
                            color: '#1e88e5',
                            lineHeight: 1,
                        }}
                    >
                        {data.total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>
                        HỌC SINH
                    </Typography>
                </Box>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={6}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.1))' }}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    </PieChart>
                </ResponsiveContainer>
            </Box>

            {/* --- FOOTER STATISTICS --- */}
            <Stack direction="row" spacing={2} mt={1} sx={{ zIndex: 1 }}>
                {/* Thẻ Nam */}
                <Box
                    sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 3,
                        background: COLORS.maleGradient,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.3s ease',
                        animation: `${fadeInUp} 0.5s ease both`,
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 5px 15px rgba(66, 165, 245, 0.2)',
                        },
                    }}
                >
                    <Avatar sx={{ bgcolor: 'white', color: COLORS.male, width: 36, height: 36, boxShadow: 1 }}>
                        <BoyOutlinedIcon fontSize="large" />
                    </Avatar>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#0d47a1', fontWeight: 700, opacity: 0.7 }}>
                            Nam ({malePercent}%)
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1565c0', lineHeight: 1.2 }}>
                            {data.male}
                        </Typography>
                    </Box>
                </Box>

                {/* Thẻ Nữ */}
                <Box
                    sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 3,
                        background: COLORS.femaleGradient,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.3s ease',
                        animation: `${fadeInUp} 0.5s ease both`,
                        animationDelay: '0.1s',
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 5px 15px rgba(171, 71, 188, 0.2)',
                        },
                    }}
                >
                    <Avatar sx={{ bgcolor: 'white', color: COLORS.female, width: 36, height: 36, boxShadow: 1 }}>
                        <GirlOutlinedIcon fontSize="large" />
                    </Avatar>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#4a148c', fontWeight: 700, opacity: 0.7 }}>
                            Nữ ({femalePercent}%)
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#7b1fa2', lineHeight: 1.2 }}>
                            {data.female}
                        </Typography>
                    </Box>
                </Box>
            </Stack>
        </Paper>
    );
}

export default StudentsPerClass;

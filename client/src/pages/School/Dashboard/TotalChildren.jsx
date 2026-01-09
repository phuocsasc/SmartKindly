// client/src/pages/School/Dashboard/TotalChildren.jsx

import { Paper, Typography, Box, Stack, Avatar, Divider } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Icons
import BoyIcon from '@mui/icons-material/Boy';
import GirlIcon from '@mui/icons-material/Girl';
import ChildCareIcon from '@mui/icons-material/ChildCare';

const TotalChildren = ({ data }) => {
    // Màu sắc tươi sáng, trẻ trung (Cyan & Pink)
    const COLORS = {
        male: '#00BCD4', // Cyan 500
        female: '#F06292', // Pink 300
        bgMale: '#E0F7FA', // Cyan 50
        bgFemale: '#FCE4EC', // Pink 50
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
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        p: 1.5,
                        border: '1px solid #eee',
                        borderRadius: 3,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* --- Decorative Elements (Giữ lại blob nhưng đổi màu nhẹ) --- */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0, 188, 212, 0.1) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box sx={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #26C6DA 0%, #00ACC1 100%)', // Gradient Cyan
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(0, 172, 193, 0.3)',
                        }}
                    >
                        <ChildCareIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#00838F' }}>
                            Tổng số trẻ
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Thống kê số trẻ toàn trường
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* --- CHART AREA: SEMI-CIRCLE GAUGE STYLE --- */}
            <Box sx={{ flex: 1, position: 'relative', minHeight: 160, width: '100%', zIndex: 1 }}>
                {/* Tổng số hiển thị to ở giữa đáy bán nguyệt */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '10%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        zIndex: 2,
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 900,
                            color: '#006064',
                            lineHeight: 1,
                            mt: 0.5,
                        }}
                    >
                        {data.total}
                    </Typography>
                </Box>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="100%" // Đẩy tâm xuống đáy để tạo hình bán nguyệt
                            startAngle={180} // Bắt đầu từ 180 độ (bên trái)
                            endAngle={0} // Kết thúc ở 0 độ (bên phải)
                            innerRadius="120%" // Bán kính trong lớn
                            outerRadius="160%" // Bán kính ngoài
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={10}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </Box>

            {/* --- FOOTER INFO CARDS --- */}
            <Stack direction="row" spacing={2} mt={3} sx={{ zIndex: 1 }}>
                {/* Card Nam */}
                <Box
                    sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: COLORS.bgMale,
                        border: '1px solid transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'white',
                            borderColor: COLORS.male,
                            boxShadow: `0 4px 12px ${COLORS.male}40`,
                        },
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: COLORS.male, fontSize: 14 }}>
                            <BoyIcon fontSize="large" />
                        </Avatar>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                            Nam
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color={COLORS.male}>
                            {data.male}
                        </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Chiếm {malePercent}%
                    </Typography>
                </Box>

                {/* Card Nữ */}
                <Box
                    sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: COLORS.bgFemale,
                        border: '1px solid transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'white',
                            borderColor: COLORS.female,
                            boxShadow: `0 4px 12px ${COLORS.female}40`,
                        },
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: COLORS.female, fontSize: 14 }}>
                            <GirlIcon fontSize="large" />
                        </Avatar>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                            Nữ
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color={COLORS.female}>
                            {data.female}
                        </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Chiếm {femalePercent}%
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
};

export default TotalChildren;

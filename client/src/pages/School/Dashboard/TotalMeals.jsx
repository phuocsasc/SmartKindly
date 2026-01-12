// client/src/pages/School/Dashboard/TotalMeals.jsx

import { Paper, Typography, Box, Avatar, Divider, LinearProgress, Stack } from '@mui/material';

// Icons
import RestaurantIcon from '@mui/icons-material/Restaurant';
import RamenDiningIcon from '@mui/icons-material/RamenDining'; // Hoặc icon món ăn khác

// Bộ màu Gradient cho món ăn (Warm Food Theme)
const COLORS = [
    { bg: '#FFF3E0', text: '#EF6C00', bar: '#FF9800' }, // Orange - Món kho
    { bg: '#E8F5E9', text: '#388E3C', bar: '#4CAF50' }, // Green - Món luộc
    { bg: '#E3F2FD', text: '#1976D2', bar: '#2196F3' }, // Blue - Món canh
    { bg: '#FCE4EC', text: '#C2185B', bar: '#E91E63' }, // Pink - Món mặn
    { bg: '#FFF8E1', text: '#F9A825', bar: '#FFC107' }, // Amber - Món xào
    { bg: '#F3E5F5', text: '#7B1FA2', bar: '#9C27B0' }, // Purple - Món xế
    { bg: '#E0F2F1', text: '#00796B', bar: '#009688' }, // Teal - Soup
    { bg: '#FFEBEE', text: '#C62828', bar: '#F44336' }, // Red - Lẩu
    { bg: '#FBE9E7', text: '#D84315', bar: '#FF5722' }, // Deep Orange - Món bánh
    { bg: '#E8EAF6', text: '#303F9F', bar: '#3F51B5' }, // Indigo - Tráng miệng
];

function TotalMeals({ data }) {
    const totalMeals = data.reduce((sum, item) => sum + item.count, 0);

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
            {/* --- Decorative Blobs --- */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239, 108, 0, 0.1) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -40,
                    left: -40,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 152, 0, 0.08) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #FF6F00 0%, #E65100 100%)', // Gradient Deep Orange
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
                        }}
                    >
                        <RestaurantIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#BF360C' }}>
                            Món ăn
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Thống kê theo loại món
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#E65100', lineHeight: 1 }}>
                        {totalMeals}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        TỔNG SỐ
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* --- BODY: LIST WITH PROGRESS BARS --- */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    pr: 2,
                    zIndex: 1,
                    // ✅ CUSTOM SCROLLBAR
                    '&::-webkit-scrollbar': { width: '5px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#bdbdbd',
                        borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#9e9e9e' },
                }}
            >
                <Stack spacing={2}>
                    {data.map((item, index) => {
                        const colorSet = COLORS[index % COLORS.length];
                        const percent = totalMeals > 0 ? (item.count / totalMeals) * 100 : 0;

                        return (
                            <Box key={index}>
                                {/* Info Row */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 0.5,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 1.5,
                                                bgcolor: colorSet.bg,
                                                color: colorSet.text,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)', // Bóng nhẹ cho icon
                                            }}
                                        >
                                            <RamenDiningIcon sx={{ fontSize: 14 }} />
                                        </Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                            {item.mealType}
                                        </Typography>
                                    </Box>

                                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: colorSet.text }}>
                                        {item.count}
                                    </Typography>
                                </Box>

                                {/* Progress Bar */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percent}
                                        sx={{
                                            flex: 1,
                                            height: 8, // Tăng độ dày một chút
                                            borderRadius: 5,
                                            bgcolor: '#F5F5F5', // Nền xám nhạt trung tính
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: colorSet.bar,
                                                borderRadius: 5,
                                            },
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={700}
                                        sx={{ minWidth: 35, textAlign: 'right' }}
                                    >
                                        {percent.toFixed(0)}%
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>
        </Paper>
    );
}

export default TotalMeals;

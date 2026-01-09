// client/src/pages/Admin/Dashboard/TotalFoods.jsx

import { Paper, Typography, Box, Avatar, Divider, LinearProgress, Stack } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AppleIcon from '@mui/icons-material/Apple';

const COLORS = [
    { bg: '#E8F5E9', text: '#388E3C', bar: '#4CAF50' },
    { bg: '#FFF3E0', text: '#EF6C00', bar: '#FF9800' },
    { bg: '#E3F2FD', text: '#1976D2', bar: '#2196F3' },
    { bg: '#FCE4EC', text: '#C2185B', bar: '#E91E63' },
    { bg: '#FFF8E1', text: '#F9A825', bar: '#FFC107' },
    { bg: '#F3E5F5', text: '#7B1FA2', bar: '#9C27B0' },
    { bg: '#E0F2F1', text: '#00796B', bar: '#009688' },
    { bg: '#FFEBEE', text: '#C62828', bar: '#F44336' },
];

function TotalFoods({ data }) {
    const totalFoods = data.byType.reduce((sum, item) => sum + item.count, 0);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 4,
                bgcolor: 'white',
                boxShadow: 3,
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
                    background: 'radial-gradient(circle, rgba(255, 152, 0, 0.15) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #FFA726 0%, #EF6C00 100%)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(239, 108, 0, 0.3)',
                        }}
                    >
                        <RestaurantIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#E65100' }}>
                            Thực phẩm
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Phân loại theo loại
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#EF6C00', lineHeight: 1 }}>
                        {totalFoods}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        TỔNG SỐ
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* Body: List with Progress Bars */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, zIndex: 1 }}>
                <Stack spacing={2}>
                    {data.byType.map((item, index) => {
                        const colorSet = COLORS[index % COLORS.length];
                        const percent = totalFoods > 0 ? (item.count / totalFoods) * 100 : 0;

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
                                            }}
                                        >
                                            <AppleIcon sx={{ fontSize: 14 }} />
                                        </Box>

                                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                            {item.foodType}
                                        </Typography>
                                    </Box>

                                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: colorSet.text }}>
                                        {item.count}
                                    </Typography>
                                </Box>

                                {/* Progress Bar */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percent}
                                        sx={{
                                            flex: 1,
                                            height: 6,
                                            borderRadius: 5,
                                            bgcolor: '#f5f5f5',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: colorSet.bar,
                                                borderRadius: 5,
                                            },
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
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

export default TotalFoods;

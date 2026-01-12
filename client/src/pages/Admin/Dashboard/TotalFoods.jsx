// client/src/pages/Admin/Dashboard/TotalFoods.jsx

import { Paper, Typography, Box, Avatar, Divider, LinearProgress, Stack, Tooltip } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SpaIcon from '@mui/icons-material/Spa'; // 🌱 Thực vật
import PetsIcon from '@mui/icons-material/Pets'; // 🐾 Động vật
import KitchenIcon from '@mui/icons-material/Kitchen'; // 🥫 Thực phẩm khô
import FoodBankIcon from '@mui/icons-material/FoodBank'; // Thực phẩm tươi
import FastfoodIcon from '@mui/icons-material/Fastfood'; // Thực phẩm ăn liền

const CATEGORY_COLORS = {
    'Động vật': { bg: '#FCE4EC', text: '#C2185B', bar: '#E91E63', icon: PetsIcon },
    'Thực vật': { bg: '#E8F5E9', text: '#388E3C', bar: '#4CAF50', icon: SpaIcon },
    'Thực phẩm Khô': { bg: '#FFF3E0', text: '#EF6C00', bar: '#FF9800', icon: KitchenIcon },
    'Thực phẩm tươi': { bg: '#E3F2FD', text: '#1976D2', bar: '#2196F3', icon: FoodBankIcon },
    'Thực phẩm ăn liền': { bg: '#FFF8E1', text: '#F9A825', bar: '#FFC107', icon: FastfoodIcon },
};

function TotalFoods({ data }) {
    const totalFoods = data.totalFoods || 0; // Số lượng thực phẩm thực tế
    const totalOccurrences = data.totalCategoryOccurrences || 0; // Tổng số lần xuất hiện categories

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
                    background: 'radial-gradient(circle, rgba(255, 152, 0, 0.1) 0%, rgba(255,255,255,0) 70%)',
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
                        <Tooltip
                            title="Một thực phẩm có thể thuộc nhiều loại (VD: 'Thịt gà' là cả 'Động vật' và 'Thực phẩm tươi')"
                            arrow
                            placement="top"
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                                sx={{ cursor: 'help' }}
                            >
                                Phân loại theo nhãn ({totalOccurrences} nhãn)
                            </Typography>
                        </Tooltip>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#EF6C00', lineHeight: 1 }}>
                        {totalFoods}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        THỰC PHẨM
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* Body: List with Progress Bars */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    pr: 2,
                    zIndex: 1,
                    // Custom Scrollbar
                    '&::-webkit-scrollbar': { width: '5px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#bdbdbd',
                        borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#9e9e9e' },
                }}
            >
                <Stack spacing={2.5}>
                    {data.byCategory &&
                        data.byCategory.map((item, index) => {
                            const colorConfig = CATEGORY_COLORS[item.category] || {
                                bg: '#F5F5F5',
                                text: '#757575',
                                bar: '#9E9E9E',
                                icon: RestaurantIcon,
                            };
                            const IconComponent = colorConfig.icon;

                            return (
                                <Box key={index}>
                                    {/* Info Row */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 0.8,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box
                                                sx={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 2,
                                                    bgcolor: colorConfig.bg,
                                                    color: colorConfig.text,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: `0 2px 6px ${colorConfig.bg}`,
                                                }}
                                            >
                                                <IconComponent sx={{ fontSize: 16 }} />
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                    {item.category}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.count} lượt gán nhãn
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="h6" fontWeight={800} sx={{ color: colorConfig.text }}>
                                                {item.percentage}%
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.count}/{totalOccurrences}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Progress Bar */}
                                    <LinearProgress
                                        variant="determinate"
                                        value={item.percentage}
                                        sx={{
                                            height: 8,
                                            borderRadius: 5,
                                            bgcolor: '#F5F5F5',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: colorConfig.bar,
                                                borderRadius: 5,
                                                boxShadow: `0 2px 4px ${colorConfig.bar}40`,
                                            },
                                        }}
                                    />
                                </Box>
                            );
                        })}
                </Stack>
            </Box>

            {/* Footer Note */}
            <Box
                sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px dashed #e0e0e0',
                    zIndex: 1,
                }}
            >
                <Typography variant="caption">
                    Mỗi thực phẩm có thể được gán nhiều nhãn, do đó tổng % có thể &gt; 100%
                </Typography>
            </Box>
        </Paper>
    );
}

export default TotalFoods;

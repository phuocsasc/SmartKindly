// client/src/pages/School/Nutrition/Food/FoodDialog.jsx

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    IconButton,
    Divider,
    Avatar,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { schoolFoodApi } from '~/apis/schoolFoodApi';
import { toast } from 'react-toastify';

const UNITS = [
    'Kg',
    'Hộp',
    'Miếng',
    'Cốc',
    'Quả',
    'Trứng',
    'Chén',
    'Gói',
    'Chai',
    'Hũ',
    'Cái',
    'Ổ',
    'Bát',
    'Tô',
    'Lon',
    'Túi',
    'Bịch',
    'Bao',
    'Trái',
    'Củ',
    'Cây',
    'Bắp',
    'Tép',
    'Lát',
    'Khoanh',
    'Khúc',
    'Bó',
    'Mớ',
    'Chùm',
    'Nải',
    'Lá',
    'Con',
    'Viên',
    'Hạt',
];

function FoodDialog({ open, food, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        unit: 'Kg',
        gramConversion: '',
        wastePercentage: 0,
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (food) {
            setFormData({
                unit: food.unit || 'Kg',
                gramConversion: food.gramConversion || '',
                wastePercentage: food.wastePercentage ?? 0,
            });
        }
    }, [food, open]);

    const handleSubmit = async () => {
        // Validation
        if (!formData.unit) {
            toast.error('Vui lòng chọn đơn vị tính!');
            return;
        }
        if (!formData.gramConversion || formData.gramConversion < 1 || formData.gramConversion > 1000) {
            toast.error('Quy đổi sang gam phải từ 1 đến 1000!');
            return;
        }
        if (formData.wastePercentage < 0 || formData.wastePercentage > 99) {
            toast.error('Hệ số thái bỏ phải từ 0 đến 99!');
            return;
        }

        try {
            setLoading(true);
            await schoolFoodApi.update(food.id, formData);
            toast.success('Cập nhật thực phẩm thành công!');
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' },
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: '#fff',
                    py: 1,
                    position: 'relative',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 30, height: 30 }}>
                        <EditIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h7" fontWeight={400}>
                        Chỉnh sửa thông tin thực phẩm - {food?.name}
                    </Typography>
                </Box>

                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                >
                    <CloseIcon fontSize="small" sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    py: 2.5,
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    mt: 1,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': { borderColor: '#0071bc' },
                        '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                    },
                    '& label.Mui-focused': { color: '#0071bc' },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Thông tin cơ bản (READ-ONLY) */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: 'text.secondary',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: 'text.secondary', borderRadius: 1 }} />
                            Thông tin cơ bản (chỉ xem)
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Tên thực phẩm"
                                value={food?.name || ''}
                                disabled
                                fullWidth
                                size="small"
                                InputProps={{ readOnly: true }}
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Loại thực phẩm
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {food?.categories?.map((cat, idx) => (
                                            <Chip key={idx} label={cat} size="small" color="default" />
                                        ))}
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Protein (Đạm)"
                                    value={food?.protein || 0}
                                    disabled
                                    size="small"
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="Lipid (Béo)"
                                    value={food?.lipid || 0}
                                    disabled
                                    size="small"
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    label="Glucid (Đường)"
                                    value={food?.glucid || 0}
                                    disabled
                                    size="small"
                                    sx={{ flex: 1 }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Thông tin có thể chỉnh sửa (BGH) */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: 'secondary.main',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: 'secondary.main', borderRadius: 1 }} />
                            Thông tin có thể chỉnh sửa
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl required fullWidth size="small">
                                    <InputLabel>Đơn vị tính</InputLabel>
                                    <Select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        label="Đơn vị tính"
                                    >
                                        {UNITS.map((unit) => (
                                            <MenuItem key={unit} value={unit}>
                                                {unit}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Quy đổi sang gam"
                                    type="number"
                                    value={formData.gramConversion}
                                    onChange={(e) =>
                                        setFormData({ ...formData, gramConversion: Number(e.target.value) })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 1, max: 1000 }}
                                    helperText="Từ 1 đến 1000 gam"
                                />
                            </Box>

                            <TextField
                                label="Hệ số thái bỏ (%)"
                                type="number"
                                value={formData.wastePercentage}
                                onChange={(e) => setFormData({ ...formData, wastePercentage: Number(e.target.value) })}
                                required
                                fullWidth
                                size="small"
                                inputProps={{ min: 0, max: 99, step: 0.1 }}
                                helperText="Từ 0 đến 99%"
                            />
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{ borderRadius: 1.5, px: 2.5, textTransform: 'none', fontWeight: 600 }}
                >
                    Hủy bỏ
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 2,
                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang xử lý...' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default FoodDialog;

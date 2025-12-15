// client/src/pages/Admin/DataBank/Food/AdminFoodDialog.jsx

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
    OutlinedInput,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { foodApi } from '~/apis/foodApi';
import { toast } from 'react-toastify';

const UNITS = ['Kg', 'Hộp', 'Miếng', 'Lit', 'Quả', 'Trứng', 'Gram', 'Gói', 'Chai', 'Hũ', 'Cái', 'Ổ'];
const FOOD_CATEGORIES = ['Động vật', 'Thực vật', 'Thực phẩm Khô', 'Thực phẩm tươi', 'Thực phẩm ăn liền'];

function AdminFoodDialog({ open, mode, food, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        unitPrice: 0, // ✅ THÊM
        unit: 'Kg',
        gramConversion: '',
        categories: [],
        wastePercentage: 0,
        protein: 0,
        lipid: 0,
        glucid: 0,
    });

    const [loading, setLoading] = useState(false);
    const isCreateMode = mode === 'create';

    useEffect(() => {
        if (mode === 'edit' && food) {
            setFormData({
                name: food.name || '',
                unitPrice: food.unitPrice ?? 0, // ✅ THÊM
                unit: food.unit || 'Kg',
                gramConversion: food.gramConversion || '',
                categories: food.categories || [],
                wastePercentage: food.wastePercentage ?? 0,
                protein: food.protein ?? 0,
                lipid: food.lipid ?? 0,
                glucid: food.glucid ?? 0,
            });
        } else {
            setFormData({
                name: '',
                unitPrice: 0, // ✅ THÊM
                unit: 'Kg',
                gramConversion: '',
                categories: [],
                wastePercentage: 0,
                protein: 0,
                lipid: 0,
                glucid: 0,
            });
        }
    }, [mode, food, open]);

    const handleSubmit = async () => {
        // Validation
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên thực phẩm!');
            return;
        }
        // ✅ VALIDATE ĐƠN GIÁ
        if (formData.unitPrice < 0) {
            toast.error('Đơn giá phải lớn hơn hoặc bằng 0!');
            return;
        }
        if (!formData.unit) {
            toast.error('Vui lòng chọn đơn vị tính!');
            return;
        }
        if (!formData.gramConversion || formData.gramConversion < 1 || formData.gramConversion > 1000) {
            toast.error('Quy đổi sang gam phải từ 1 đến 1000!');
            return;
        }
        if (formData.categories.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 loại thực phẩm!');
            return;
        }
        if (formData.wastePercentage < 0 || formData.wastePercentage > 99) {
            toast.error('Hệ số thái bỏ phải từ 0 đến 99!');
            return;
        }
        if (formData.protein < 0) {
            toast.error('Protein phải lớn hơn hoặc bằng 0!');
            return;
        }
        if (formData.lipid < 0) {
            toast.error('Lipid phải lớn hơn hoặc bằng 0!');
            return;
        }
        if (formData.glucid < 0) {
            toast.error('Glucid phải lớn hơn hoặc bằng 0!');
            return;
        }

        try {
            setLoading(true);
            if (mode === 'create') {
                await foodApi.create(formData);
                toast.success('Tạo thực phẩm thành công!');
            } else {
                await foodApi.update(food.id, formData);
                toast.success('Cập nhật thực phẩm thành công!');
            }
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
                    <Avatar
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            width: 30,
                            height: 30,
                        }}
                    >
                        {isCreateMode ? <AddCircleOutlineIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="h7" fontWeight={400}>
                        {isCreateMode ? 'Thêm thực phẩm mới' : 'Chỉnh sửa thực phẩm'}
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
                    {/* Section: Thông tin cơ bản */}
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
                            Thông tin cơ bản
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Tên thực phẩm"
                                placeholder="VD: Thịt gà, Cà rốt, Gạo..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                fullWidth
                                size="small"
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Đơn giá (VNĐ)"
                                    type="number"
                                    value={formData.unitPrice}
                                    onChange={(e) =>
                                        setFormData({ ...formData, unitPrice: parseInt(e.target.value) || 0 })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 1 }}
                                    helperText="Nhập số nguyên ≥ 0"
                                />

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

                            <FormControl required fullWidth size="small">
                                <InputLabel>Loại thực phẩm</InputLabel>
                                <Select
                                    multiple
                                    value={formData.categories}
                                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                                    input={<OutlinedInput label="Loại thực phẩm" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={value} size="small" color="success" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {FOOD_CATEGORIES.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Section: Thông tin dinh dưỡng */}
                    <Box>
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
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: 'primary.main',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: 'primary.main', borderRadius: 1 }} />
                            Thông tin dinh dưỡng (trên 1 gam thực phẩm)
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Protein (Đạm)"
                                    type="number"
                                    value={formData.protein}
                                    onChange={(e) => setFormData({ ...formData, protein: Number(e.target.value) })}
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 0.001 }}
                                    helperText="VD: 0.005, 9.026..."
                                />

                                <TextField
                                    label="Lipid (Béo)"
                                    type="number"
                                    value={formData.lipid}
                                    onChange={(e) => setFormData({ ...formData, lipid: Number(e.target.value) })}
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 0.001 }}
                                    helperText="VD: 0.005, 9.026..."
                                />

                                <TextField
                                    label="Glucid (Đường)"
                                    type="number"
                                    value={formData.glucid}
                                    onChange={(e) => setFormData({ ...formData, glucid: Number(e.target.value) })}
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 0.001 }}
                                    helperText="VD: 0.005, 9.026..."
                                />
                            </Box>
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
                    {loading ? 'Đang xử lý...' : isCreateMode ? 'Tạo thực phẩm' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminFoodDialog;

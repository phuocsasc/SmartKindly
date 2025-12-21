// client/src/pages/Admin/DataBank/NutritionalStandards/AdminNutritionalStandardsDialog.jsx

import { useState, useEffect } from 'react';
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
    Avatar,
    Divider,
    Paper,
    Grid,
    Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import { nutritionalStandardApi } from '~/apis';
import { toast } from 'react-toastify';

const AGE_GROUPS = ['Nhóm nhà trẻ (12 - 36 tháng tuổi)', 'Nhóm mẫu giáo (3 - 6 tuổi)'];

function AdminNutritionalStandardsDialog({ open, mode, standard, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        ageGroup: '',
        plgStructure: {
            proteinMin: 13,
            proteinMax: 20,
            lipidMin: 30,
            lipidMax: 40,
            glucidMin: 47,
            glucidMax: 50,
        },
        protein: 0,
        lipid: 0,
        glucid: 0,
        recommendedCaloriesMin: 0,
        recommendedCaloriesMax: 0,
    });

    const isCreateMode = mode === 'create';

    // Load data for edit mode
    useEffect(() => {
        if (mode === 'edit' && standard) {
            setFormData({
                ageGroup: standard.ageGroup || '',
                plgStructure: standard.plgStructure || {
                    proteinMin: 13,
                    proteinMax: 20,
                    lipidMin: 30,
                    lipidMax: 40,
                    glucidMin: 47,
                    glucidMax: 50,
                },
                protein: standard.protein || 0,
                lipid: standard.lipid || 0,
                glucid: standard.glucid || 0,
                recommendedCaloriesMin: standard.recommendedCaloriesMin || 0,
                recommendedCaloriesMax: standard.recommendedCaloriesMax || 0,
            });
        } else {
            setFormData({
                ageGroup: '',
                plgStructure: {
                    proteinMin: 13,
                    proteinMax: 20,
                    lipidMin: 30,
                    lipidMax: 40,
                    glucidMin: 47,
                    glucidMax: 50,
                },
                protein: 0,
                lipid: 0,
                glucid: 0,
                recommendedCaloriesMin: 0,
                recommendedCaloriesMax: 0,
            });
        }
    }, [mode, standard, open]);

    // Calculate total calories
    const calculateTotalCalories = () => {
        const totalProtein = formData.protein;
        const totalLipid = formData.lipid;
        const totalGlucid = formData.glucid;
        return Math.round(totalProtein * 4 + totalLipid * 9 + totalGlucid * 4);
    };

    // Update PLG structure
    const handlePLGChange = (field, value) => {
        setFormData({
            ...formData,
            plgStructure: {
                ...formData.plgStructure,
                [field]: parseInt(value) || 0,
            },
        });
    };

    // Submit
    const handleSubmit = async () => {
        // Validation
        if (!formData.ageGroup) {
            toast.error('Vui lòng chọn nhóm trẻ!');
            return;
        }

        // Validate PLG structure
        const plg = formData.plgStructure;

        // Validate Min <= Max
        if (plg.proteinMin > plg.proteinMax) {
            toast.error('Protein: Giá trị "Từ" không được lớn hơn "Đến"!');
            return;
        }
        if (plg.lipidMin > plg.lipidMax) {
            toast.error('Lipid: Giá trị "Từ" không được lớn hơn "Đến"!');
            return;
        }
        if (plg.glucidMin > plg.glucidMax) {
            toast.error('Glucid: Giá trị "Từ" không được lớn hơn "Đến"!');
            return;
        }

        // Validate values > 0
        if (
            plg.proteinMin <= 0 ||
            plg.proteinMax <= 0 ||
            plg.lipidMin <= 0 ||
            plg.lipidMax <= 0 ||
            plg.glucidMin <= 0 ||
            plg.glucidMax <= 0
        ) {
            toast.error('Tất cả giá trị PLG phải lớn hơn 0!');
            return;
        }

        if (formData.protein <= 0) {
            toast.error('Protein Đạm phải lớn hơn 0!');
            return;
        }
        if (formData.lipid <= 0) {
            toast.error('Lipid Béo phải lớn hơn 0!');
            return;
        }
        if (formData.glucid <= 0) {
            toast.error('Glucid Đường phải lớn hơn 0!');
            return;
        }
        if (formData.recommendedCaloriesMin <= 0 || formData.recommendedCaloriesMax <= 0) {
            toast.error('Năng lượng khuyến nghị phải lớn hơn 0!');
            return;
        }
        if (formData.recommendedCaloriesMin > formData.recommendedCaloriesMax) {
            toast.error('Năng lượng khuyến nghị "Từ" không được lớn hơn "Đến"!');
            return;
        }

        try {
            setLoading(true);

            if (isCreateMode) {
                await nutritionalStandardApi.create(formData);
                toast.success('Tạo định mức dinh dưỡng thành công!');
            } else {
                await nutritionalStandardApi.update(standard.id, formData);
                toast.success('Cập nhật định mức dinh dưỡng thành công!');
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
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        {isCreateMode ? <AddCircleOutlineIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        {isCreateMode ? 'Thêm định mức dinh dưỡng mới' : `Chỉnh sửa - ${standard?.ageGroup}`}
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
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Nhóm trẻ */}
                    <FormControl required fullWidth size="small" sx={{ mt: 2 }}>
                        <InputLabel>Tên nhóm trẻ</InputLabel>
                        <Select
                            value={formData.ageGroup}
                            onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                            label="Tên nhóm trẻ"
                            disabled={!isCreateMode}
                        >
                            <MenuItem value="">-- Chọn nhóm trẻ --</MenuItem>
                            {AGE_GROUPS.map((group) => (
                                <MenuItem key={group} value={group}>
                                    {group}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Divider />

                    {/* Cơ cấu PLG chuẩn duy nhất */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                            Cơ cấu PLG chuẩn duy nhất (%)
                        </Typography>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            Nhập khoảng tỷ lệ % cho mỗi chất dinh dưỡng (Từ % - Đến %). Tất cả giá trị phải là số nguyên
                            từ 1 đến 100.
                        </Alert>

                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb' }}>
                            {/* Protein */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#5d2e7dff' }}>
                                    Protein (Đạm) %
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Từ (%)"
                                            type="number"
                                            value={formData.plgStructure.proteinMin}
                                            onChange={(e) => handlePLGChange('proteinMin', e.target.value)}
                                            size="small"
                                            fullWidth
                                            required
                                            inputProps={{ min: 1, max: 100, step: 1 }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Đến (%)"
                                            type="number"
                                            value={formData.plgStructure.proteinMax}
                                            onChange={(e) => handlePLGChange('proteinMax', e.target.value)}
                                            size="small"
                                            fullWidth
                                            required
                                            inputProps={{ min: 1, max: 100, step: 1 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Lipid */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#f57c00' }}>
                                    Lipid (Béo) %
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Từ (%)"
                                            type="number"
                                            value={formData.plgStructure.lipidMin}
                                            onChange={(e) => handlePLGChange('lipidMin', e.target.value)}
                                            size="small"
                                            fullWidth
                                            required
                                            inputProps={{ min: 1, max: 100, step: 1 }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Đến (%)"
                                            type="number"
                                            value={formData.plgStructure.lipidMax}
                                            onChange={(e) => handlePLGChange('lipidMax', e.target.value)}
                                            size="small"
                                            fullWidth
                                            required
                                            inputProps={{ min: 1, max: 100, step: 1 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Glucid */}
                            <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#1976d2' }}>
                                    Glucid (Đường) %
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Từ (%)"
                                            type="number"
                                            value={formData.plgStructure.glucidMin}
                                            onChange={(e) => handlePLGChange('glucidMin', e.target.value)}
                                            size="small"
                                            fullWidth
                                            required
                                            inputProps={{ min: 1, max: 100, step: 1 }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Đến (%)"
                                            type="number"
                                            value={formData.plgStructure.glucidMax}
                                            onChange={(e) => handlePLGChange('glucidMax', e.target.value)}
                                            size="small"
                                            fullWidth
                                            required
                                            inputProps={{ min: 1, max: 100, step: 1 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Box>

                    <Divider />

                    {/* Định mức 1 ngày */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Định mức 1 ngày của mỗi chất
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField
                                    label="Protein Đạm (g)"
                                    type="number"
                                    value={formData.protein}
                                    onChange={(e) =>
                                        setFormData({ ...formData, protein: parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0.001, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    label="Lipid Béo (g)"
                                    type="number"
                                    value={formData.lipid}
                                    onChange={(e) =>
                                        setFormData({ ...formData, lipid: parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0.001, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    label="Glucid Đường (g)"
                                    type="number"
                                    value={formData.glucid}
                                    onChange={(e) =>
                                        setFormData({ ...formData, glucid: parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0.001, step: 0.1 }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Calo cả ngày (tự tính) */}
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: '#e3f2fd',
                            borderRadius: 2,
                            border: '1px solid #90caf9',
                        }}
                    >
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            Calo cả ngày (tự tính):
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700 }}>
                            {calculateTotalCalories()} kcal
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Công thức: [Protein × 4] + [Lipid × 9] + [Glucid × 4]
                        </Typography>
                    </Box>

                    {/* Năng lượng khuyến nghị */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Năng lượng khuyến nghị ăn tại trường (kcal)
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Từ (kcal)"
                                    type="number"
                                    value={formData.recommendedCaloriesMin}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            recommendedCaloriesMin: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 1 }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Đến (kcal)"
                                    type="number"
                                    value={formData.recommendedCaloriesMax}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            recommendedCaloriesMax: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 1 }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </DialogContent>

            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Đang xử lý...' : isCreateMode ? 'Tạo định mức' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminNutritionalStandardsDialog;

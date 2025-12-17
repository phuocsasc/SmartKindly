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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { nutritionalStandardApi } from '~/apis';
import { toast } from 'react-toastify';

const AGE_GROUPS = ['Nhóm nhà trẻ (12 - 36 tháng tuổi)', 'Nhóm mẫu giáo (3 - 6 tuổi)'];

function AdminNutritionalStandardsDialog({ open, mode, standard, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        ageGroup: '',
        plgStructures: [{ protein: 13, lipid: 37, glucid: 50 }],
        proteinAnimal: 0,
        proteinPlant: 0,
        lipidAnimal: 0,
        lipidPlant: 0,
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
                plgStructures: standard.plgStructures || [{ protein: 13, lipid: 37, glucid: 50 }],
                proteinAnimal: standard.proteinAnimal || 0,
                proteinPlant: standard.proteinPlant || 0,
                lipidAnimal: standard.lipidAnimal || 0,
                lipidPlant: standard.lipidPlant || 0,
                glucid: standard.glucid || 0,
                recommendedCaloriesMin: standard.recommendedCaloriesMin || 0,
                recommendedCaloriesMax: standard.recommendedCaloriesMax || 0,
            });
        } else {
            setFormData({
                ageGroup: '',
                plgStructures: [{ protein: 13, lipid: 37, glucid: 50 }],
                proteinAnimal: 0,
                proteinPlant: 0,
                lipidAnimal: 0,
                lipidPlant: 0,
                glucid: 0,
                recommendedCaloriesMin: 0,
                recommendedCaloriesMax: 0,
            });
        }
    }, [mode, standard, open]);

    // Calculate total calories
    const calculateTotalCalories = () => {
        const totalProtein = formData.proteinAnimal + formData.proteinPlant;
        const totalLipid = formData.lipidAnimal + formData.lipidPlant;
        return Math.round(totalProtein * 4 + totalLipid * 9 + formData.glucid * 4);
    };

    // Add PLG structure
    const handleAddPLG = () => {
        setFormData({
            ...formData,
            plgStructures: [...formData.plgStructures, { protein: 0, lipid: 0, glucid: 0 }],
        });
    };

    // Remove PLG structure
    const handleRemovePLG = (index) => {
        if (formData.plgStructures.length === 1) {
            toast.warning('Phải có ít nhất 1 cơ cấu PLG!');
            return;
        }
        const updated = [...formData.plgStructures];
        updated.splice(index, 1);
        setFormData({ ...formData, plgStructures: updated });
    };

    // Update PLG structure
    const handlePLGChange = (index, field, value) => {
        const updated = [...formData.plgStructures];
        updated[index][field] = parseFloat(value) || 0;
        setFormData({ ...formData, plgStructures: updated });
    };

    // Validate PLG total
    const validatePLGTotal = (plg) => {
        const total = plg.protein + plg.lipid + plg.glucid;
        return Math.abs(total - 100) < 0.01; // Allow small floating point error
    };

    // Submit
    const handleSubmit = async () => {
        // Validation
        if (!formData.ageGroup) {
            toast.error('Vui lòng chọn nhóm trẻ!');
            return;
        }

        // Validate PLG structures
        for (let i = 0; i < formData.plgStructures.length; i++) {
            const plg = formData.plgStructures[i];
            if (plg.protein <= 0 || plg.lipid <= 0 || plg.glucid <= 0) {
                toast.error(`Cơ cấu PLG #${i + 1}: Tất cả giá trị phải lớn hơn 0!`);
                return;
            }
            if (!validatePLGTotal(plg)) {
                const total = plg.protein + plg.lipid + plg.glucid;
                toast.error(
                    `Cơ cấu PLG #${i + 1}: Tổng phải bằng 100% (hiện tại: ${total.toFixed(2)}%). P: ${plg.protein}%, L: ${plg.lipid}%, G: ${plg.glucid}%`,
                );
                return;
            }
        }

        if (formData.proteinAnimal <= 0) {
            toast.error('Protein Đạm động vật phải lớn hơn 0!');
            return;
        }
        if (formData.proteinPlant <= 0) {
            toast.error('Protein Đạm thực vật phải lớn hơn 0!');
            return;
        }
        if (formData.lipidAnimal <= 0) {
            toast.error('Lipid Béo động vật phải lớn hơn 0!');
            return;
        }
        if (formData.lipidPlant <= 0) {
            toast.error('Lipid Béo thực vật phải lớn hơn 0!');
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
            {/* Header */}
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

            {/* Content */}
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

                    {/* Cơ cấu PLG */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Cơ cấu PLG chuẩn (tổng = 100%)
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleAddPLG}
                                sx={{ textTransform: 'none' }}
                            >
                                Thêm cơ cấu PLG
                            </Button>
                        </Box>

                        {formData.plgStructures.map((plg, index) => {
                            const total = plg.protein + plg.lipid + plg.glucid;
                            const isValid = validatePLGTotal(plg);

                            return (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        mb: 1.5,
                                        bgcolor: isValid ? '#f1f8e9' : '#fff3e0',
                                        border: `1px solid ${isValid ? '#aed581' : '#ffb74d'}`,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 1,
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={600}>
                                            Cơ cấu PLG #{index + 1}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: isValid ? '#2e7d32' : '#f57c00',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Tổng: {total.toFixed(1)}% {isValid ? '✓' : '✗'}
                                            </Typography>
                                            {formData.plgStructures.length > 1 && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemovePLG(index)}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <TextField
                                                label="Protein (Đạm) %"
                                                type="number"
                                                value={plg.protein}
                                                onChange={(e) => handlePLGChange(index, 'protein', e.target.value)}
                                                size="small"
                                                fullWidth
                                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField
                                                label="Lipid (Béo) %"
                                                type="number"
                                                value={plg.lipid}
                                                onChange={(e) => handlePLGChange(index, 'lipid', e.target.value)}
                                                size="small"
                                                fullWidth
                                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField
                                                label="Glucid (Đường) %"
                                                type="number"
                                                value={plg.glucid}
                                                onChange={(e) => handlePLGChange(index, 'glucid', e.target.value)}
                                                size="small"
                                                fullWidth
                                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            );
                        })}
                    </Box>

                    <Divider />

                    {/* Protein */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Protein (Đạm)
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Đạm động vật (g)"
                                    type="number"
                                    value={formData.proteinAnimal}
                                    onChange={(e) =>
                                        setFormData({ ...formData, proteinAnimal: parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0.001, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Đạm thực vật (g)"
                                    type="number"
                                    value={formData.proteinPlant}
                                    onChange={(e) =>
                                        setFormData({ ...formData, proteinPlant: parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0.001, step: 0.1 }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Lipid */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Lipid (Béo)
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Béo động vật (g)"
                                    type="number"
                                    value={formData.lipidAnimal}
                                    onChange={(e) =>
                                        setFormData({ ...formData, lipidAnimal: parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0.001, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Béo thực vật (g)"
                                    type="number"
                                    value={formData.lipidPlant}
                                    onChange={(e) =>
                                        setFormData({ ...formData, lipidPlant: parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0.001, step: 0.1 }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Glucid */}
                    <TextField
                        label="Glucid Đường (g)"
                        type="number"
                        value={formData.glucid}
                        onChange={(e) => setFormData({ ...formData, glucid: parseFloat(e.target.value) || 0 })}
                        required
                        fullWidth
                        size="small"
                        inputProps={{ min: 0.001, step: 0.1 }}
                    />

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
                            = [(P động vật + P thực vật) × 4] + [(L động vật + L thực vật) × 9] + (G × 4)
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
                                            recommendedCaloriesMin: parseFloat(e.target.value) || 0,
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
                                            recommendedCaloriesMax: parseFloat(e.target.value) || 0,
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

            {/* Actions */}
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
                    {loading ? 'Đang xử lý...' : isCreateMode ? 'Tạo định mức' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminNutritionalStandardsDialog;

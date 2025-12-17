// client/src/pages/School/Nutrition/Standard/NutritionalStandardsDialog.jsx

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Avatar,
    Divider,
    Paper,
    Grid,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { schoolNutritionalStandardApi } from '~/apis';
import { toast } from 'react-toastify';

function NutritionalStandardsDialog({ open, standard, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [selectedPLGIndex, setSelectedPLGIndex] = useState(-1);

    useEffect(() => {
        if (standard) {
            // Find selected PLG structure
            const selectedIndex = standard.plgStructures.findIndex((plg) => plg.isSelected);
            setSelectedPLGIndex(selectedIndex);
        }
    }, [standard, open]);

    const handleSubmit = async () => {
        if (selectedPLGIndex === -1) {
            toast.error('Vui lòng chọn 1 cơ cấu PLG chuẩn!');
            return;
        }

        try {
            setLoading(true);

            // Prepare data: set isSelected = true for selected PLG
            const updatedPLGStructures = standard.plgStructures.map((plg, index) => ({
                ...plg,
                isSelected: index === selectedPLGIndex,
            }));

            await schoolNutritionalStandardApi.update(standard.id, {
                plgStructures: updatedPLGStructures,
            });

            toast.success('Cập nhật cơ cấu PLG thành công!');
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    if (!standard) return null;

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
                        <EditIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Chọn cơ cấu PLG chuẩn - {standard.ageGroup}
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
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Tên nhóm trẻ:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 500 }}>
                            {standard.ageGroup}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Chọn cơ cấu PLG */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Cơ cấu PLG chuẩn (chọn 1):
                        </Typography>

                        <FormControl component="fieldset" fullWidth>
                            <RadioGroup
                                value={selectedPLGIndex}
                                onChange={(e) => setSelectedPLGIndex(Number(e.target.value))}
                            >
                                {standard.plgStructures.map((plg, index) => (
                                    <Paper
                                        key={index}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mb: 1.5,
                                            bgcolor: index === selectedPLGIndex ? '#e3f2fd' : '#f5f5f5',
                                            border: `2px solid ${index === selectedPLGIndex ? '#1976d2' : '#e0e0e0'}`,
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: '#e3f2fd',
                                                borderColor: '#1976d2',
                                            },
                                        }}
                                        onClick={() => setSelectedPLGIndex(index)}
                                    >
                                        <FormControlLabel
                                            value={index}
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ ml: 1 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        Cơ cấu PLG #{index + 1}
                                                    </Typography>
                                                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                                        <Grid item xs={4}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Protein (Đạm): <strong>{plg.protein}%</strong>
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Lipid (Béo): <strong>{plg.lipid}%</strong>
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={4}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Glucid (Đường): <strong>{plg.glucid}%</strong>
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            }
                                            sx={{ width: '100%', m: 0 }}
                                        />
                                    </Paper>
                                ))}
                            </RadioGroup>
                        </FormControl>
                    </Box>

                    <Divider />

                    {/* Thông tin chi tiết (Read-only) */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                            Thông tin dinh dưỡng:
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Protein Đạm động vật (g):
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                                    {standard.proteinAnimal}g
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Protein Đạm thực vật (g):
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#388e3c', fontWeight: 600 }}>
                                    {standard.proteinPlant}g
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Lipid Béo động vật (g):
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 600 }}>
                                    {standard.lipidAnimal}g
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Lipid Béo thực vật (g):
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#689f38', fontWeight: 600 }}>
                                    {standard.lipidPlant}g
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                    Glucid Đường (g):
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                    {standard.glucid}g
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Calo */}
                    <Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Calo cả ngày (kCal):
                                </Typography>
                                <Typography variant="h5" sx={{ color: '#7b1fa2', fontWeight: 700 }}>
                                    {standard.totalCalories} kcal
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Năng lượng khuyến nghị ăn tại trường (kCal):
                                </Typography>
                                <Typography variant="h5" sx={{ color: '#0288d1', fontWeight: 700 }}>
                                    {standard.recommendedCaloriesMin} - {standard.recommendedCaloriesMax} kcal
                                </Typography>
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
                    {loading ? 'Đang xử lý...' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default NutritionalStandardsDialog;

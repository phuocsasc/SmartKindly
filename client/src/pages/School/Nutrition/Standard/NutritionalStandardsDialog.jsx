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
    Radio,
    FormControl,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CircularProgress from '@mui/material/CircularProgress';
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
                    {/* Chọn PLG structure */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, mt: 1 }}>
                            Chọn 1 cơ cấu PLG chuẩn để áp dụng cân đối về chất:
                        </Typography>

                        <FormControl component="fieldset" fullWidth>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column', // 🔽 hiển thị dọc
                                    gap: 1,
                                }}
                            >
                                {standard.plgStructures.map((plg, index) => (
                                    <Box
                                        key={index}
                                        onClick={() => setSelectedPLGIndex(index)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            px: 1,
                                            py: 0.75,
                                            borderRadius: 1,
                                            cursor: 'pointer',
                                            bgcolor: selectedPLGIndex === index ? '#f3f9ff' : 'transparent',
                                            '&:hover': {
                                                bgcolor: '#f5f5f5',
                                            },
                                        }}
                                    >
                                        <Radio checked={selectedPLGIndex === index} value={index} />

                                        <Typography fontWeight={500}>
                                            Protein: {plg.protein}% &nbsp;|&nbsp; Lipid: {plg.lipid}% &nbsp;|&nbsp;
                                            Glucid: {plg.glucid}%
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </FormControl>
                    </Box>

                    <Divider />

                    {/* Thông tin chi tiết (Read-only) */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                            Thông tin dinh dưỡng:
                        </Typography>

                        {/* Định mức 1 ngày */}
                        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Typography fontWeight={600} sx={{ mb: 1 }}>
                                Định mức 1 ngày của mỗi chất:
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <Typography variant="h6" sx={{ color: '#5d2e7dff', fontWeight: 600 }}>
                                    Protein (g): <strong>{standard.protein}</strong>
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 600 }}>
                                    Lipid (g): <strong>{standard.lipid}</strong>
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                    Glucid (g): <strong>{standard.glucid}</strong>
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            <Typography fontWeight={600}>
                                Calo cả ngày (kCal):
                                {/* <span style={{ color: '#000000ff', fontSize: 20 }}>{standard.totalCalories} kcal</span> */}
                            </Typography>

                            <Typography variant="h6" sx={{ color: '#000305ff', fontWeight: 700 }}>
                                {standard.totalCalories} kcal
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Công thức: [Protein (g) × 4] + [Lipid (g) × 9] + [Glucid (g) × 4]
                            </Typography>
                        </Paper>

                        {/* Năng lượng khuyến nghị */}
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                                Năng lượng khuyến nghị ăn tại trường (kCal):
                            </Typography>

                            <Typography variant="h6" sx={{ color: '#51994bff', fontWeight: 700 }}>
                                Từ {standard.recommendedCaloriesMin} – {standard.recommendedCaloriesMax} kcal
                            </Typography>
                        </Paper>
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
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default NutritionalStandardsDialog;

// client/src/pages/School/Nutrition/ServiceCharge/ServiceChargeDialog.jsx

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    IconButton,
    Avatar,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { schoolServiceChargeApi } from '~/apis';
import { toast } from 'react-toastify';

function ServiceChargeDialog({ open, mode, charge, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        serviceName: '',
        amount: 0,
        description: '',
    });

    const isCreateMode = mode === 'create';

    useEffect(() => {
        if (mode === 'edit' && charge) {
            setFormData({
                serviceName: charge.serviceName || '',
                amount: charge.amount || 0,
                description: charge.description || '',
            });
        } else {
            setFormData({
                serviceName: '',
                amount: 0,
                description: '',
            });
        }
    }, [mode, charge, open]);

    const handleSubmit = async () => {
        // Validation
        if (!formData.serviceName.trim()) {
            toast.error('Vui lòng nhập tên dịch vụ!');
            return;
        }

        if (formData.amount <= 0) {
            toast.error('Tiền dịch vụ phải lớn hơn 0!');
            return;
        }

        try {
            setLoading(true);

            if (isCreateMode) {
                await schoolServiceChargeApi.create(formData);
                toast.success('Tạo tiền dịch vụ thành công!');
            } else {
                await schoolServiceChargeApi.update(charge._id, formData);
                toast.success('Cập nhật tiền dịch vụ thành công!');
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
            maxWidth="sm"
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
                        {isCreateMode ? 'Thêm tiền dịch vụ mới' : `Chỉnh sửa - ${charge?.serviceName}`}
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
                    {/* Tên dịch vụ */}
                    <TextField
                        label="Tên dịch vụ"
                        placeholder="VD: Ăn sáng, Tiền sữa, Tiền ăn trưa..."
                        value={formData.serviceName}
                        onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                        required
                        fullWidth
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, mt: 2 }}
                    />

                    {/* Tiền dịch vụ */}
                    <TextField
                        label="Tiền dịch vụ (VNĐ)"
                        type="number"
                        placeholder="VD: 50000"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        required
                        fullWidth
                        size="small"
                        inputProps={{ min: 0, step: 1000 }}
                        helperText="Nhập số tiền lớn hơn 0"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    />

                    <Divider />

                    {/* Mô tả */}
                    <TextField
                        label="Mô tả"
                        placeholder="Nhập mô tả chi tiết về dịch vụ (không bắt buộc)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                        size="small"
                        inputProps={{ maxLength: 1000 }}
                        helperText={`${formData.description.length}/1000 ký tự`}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    />
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
                    {loading ? 'Đang xử lý...' : isCreateMode ? 'Tạo dịch vụ' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ServiceChargeDialog;

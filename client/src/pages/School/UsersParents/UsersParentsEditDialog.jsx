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
    Grid,
    InputAdornment,
    Switch,
    Paper,
    Zoom,
} from '@mui/material';
import {
    Close as CloseIcon,
    Edit as EditIcon,
    Email as EmailIcon,
    PhoneIphone as PhoneIcon,
    School as SchoolIcon,
    ToggleOn as StatusIcon,
} from '@mui/icons-material';
import PermContactCalendarOutlinedIcon from '@mui/icons-material/PermContactCalendarOutlined';
import { parentApi } from '~/apis';
import { toast } from 'react-toastify';

function UsersParentsEditDialog({ open, parentData, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        status: true,
    });

    useEffect(() => {
        if (parentData) {
            setFormData({
                email: parentData.email || '',
                phone: parentData.phone || '',
                status: parentData.status ?? true,
            });
        }
    }, [parentData]);

    const handleSubmit = async () => {
        // Validation
        if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
            toast.error('Email không hợp lệ!');
            return;
        }

        if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
            toast.error('Số điện thoại phải có 10-11 chữ số!');
            return;
        }

        try {
            setLoading(true);
            await parentApi.update(parentData.id, formData);
            toast.success('Cập nhật thông tin tài khoản thành công!');
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi cập nhật!');
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
            TransitionComponent={Zoom}
            PaperProps={{
                sx: {
                    borderRadius: 5,
                    backgroundImage: 'none',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                },
            }}
        >
            {/* Header với Gradient hiện đại */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    color: '#fff',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{ bgcolor: 'primary.main', width: 45, height: 45, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                    >
                        <EditIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Chỉnh sửa tài khoản phụ huynh
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, bgcolor: '#f8fafc', mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Phần 1: Thông tin học sinh - Thiết kế dạng Card Read-only */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <SchoolIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                                THÔNG TIN HỌC SINH
                            </Typography>
                        </Box>
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 3, bgcolor: '#fff', borderStyle: 'dashed' }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box>
                                        <Typography variant="caption" color="text.disabled" display="block">
                                            Tên tài khoản
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {parentData?.username || '---'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box>
                                        <Typography variant="caption" color="text.disabled" display="block">
                                            Mã học sinh
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} sx={{ color: 'primary.main' }}>
                                            {parentData?.studentCode || '---'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.disabled" display="block">
                                                Họ tên học sinh
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {parentData?.studentFullName || '---'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box>
                                        <Typography variant="caption" color="text.disabled" display="block">
                                            Giới tính
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {parentData?.studentGender || '---'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>

                    {/* Phần 2: Thông tin liên hệ - Form nhập liệu hiện đại */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <PermContactCalendarOutlinedIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                                THÔNG TIN LIÊN HỆ
                            </Typography>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Số điện thoại"
                                    size="small"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon sx={{ color: 'primary.main', p: 0.5 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Địa chỉ Email"
                                    size="small"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: 'primary.main', p: 0.5 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Phần 3: Trạng thái tài khoản */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            bgcolor: formData.status ? 'success.lighter' : 'error.lighter',
                            border: '1px solid',
                            borderColor: formData.status ? 'success.light' : 'error.light',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <StatusIcon color={formData.status ? 'success' : 'error'} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Trạng thái hoạt động
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formData.status
                                        ? 'Tài khoản đang được phép truy cập'
                                        : 'Tài khoản đang bị tạm khóa'}
                                </Typography>
                            </Box>
                        </Box>
                        <Switch
                            checked={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                            color="success"
                        />
                    </Paper>
                </Box>
            </DialogContent>

            {/* Actions với nút bấm Glassmorphism */}
            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', gap: 2 }}>
                <Button onClick={onClose} variant="text" sx={{ color: 'text.secondary', fontWeight: 700, px: 3 }}>
                    Hủy bỏ
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.2,
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: '0 8px 20px rgba(0, 113, 188, 0.3)',
                        background: 'linear-gradient(135deg, #0071bc 0%, #005a96 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #005a96 0%, #0071bc 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UsersParentsEditDialog;

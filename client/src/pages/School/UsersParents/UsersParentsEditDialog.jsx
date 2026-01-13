// client/src/pages/School/UsersParents/UsersParentsEditDialog.jsx

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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
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
            toast.success('Cập nhật thông tin phụ huynh thành công!');
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật thông tin!');
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
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                },
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
                        Chỉnh sửa thông tin phụ huynh
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
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ pt: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Thông tin học sinh (READ-ONLY) */}
                    <Box>
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
                            Thông tin học sinh (Không thể thay đổi)
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Tên tài khoản"
                                    value={parentData?.username || ''}
                                    disabled
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Họ tên học sinh"
                                    value={parentData?.studentFullName || ''}
                                    disabled
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Mã học sinh"
                                    value={parentData?.studentCode || ''}
                                    disabled
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Giới tính"
                                    value={parentData?.studentGender || ''}
                                    disabled
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Thông tin có thể chỉnh sửa */}
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
                            Thông tin liên hệ
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Số điện thoại"
                                placeholder="VD: 0901234567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                fullWidth
                                size="small"
                                variant="outlined"
                            />

                            <TextField
                                label="Email"
                                type="email"
                                placeholder="VD: [email protected]"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                fullWidth
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Trạng thái */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: 'success.main',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: 'success.main', borderRadius: 1 }} />
                            Trạng thái
                        </Typography>

                        <FormControl fullWidth size="small">
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                label="Trạng thái"
                                renderValue={(selected) => (
                                    <Chip
                                        label={selected ? 'Kích hoạt' : 'Vô hiệu hóa'}
                                        color={selected ? 'success' : 'error'}
                                        size="small"
                                    />
                                )}
                            >
                                <MenuItem value={true}>
                                    <Chip label="Kích hoạt" color="success" size="small" />
                                </MenuItem>
                                <MenuItem value={false}>
                                    <Chip label="Vô hiệu hóa" color="error" size="small" />
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
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
                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        '&:hover': { boxShadow: 3 },
                    }}
                >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UsersParentsEditDialog;

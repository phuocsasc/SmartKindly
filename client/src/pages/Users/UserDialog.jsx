// client/src/pages/Users/UserDialog.jsx
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
} from '@mui/material';
import { userApi } from '~/apis/userApi';
import { toast } from 'react-toastify';
import { ROLES, ROLE_DISPLAY } from '~/config/rbacConfig';

function UserDialog({ open, mode, user, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        gender: '',
        email: '',
        phone: '',
        role: ROLES.GIAO_VIEN,
        status: true,
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && user) {
            setFormData({
                username: user.username || '',
                fullName: user.fullName || '',
                gender: user.gender || '',
                email: user.email || '',
                phone: user.phone || '',
                role: user.role || ROLES.GIAO_VIEN,
                status: user.status ?? true,
            });
        } else {
            setFormData({
                username: '',
                fullName: '',
                gender: '',
                email: '',
                phone: '',
                role: ROLES.GIAO_VIEN,
                status: true,
            });
        }
    }, [mode, user, open]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (mode === 'create') {
                await userApi.createUser(formData);
                toast.success('Tạo người dùng thành công!');
            } else {
                await userApi.updateUser(user.id, formData);
                toast.success('Cập nhật người dùng thành công!');
            }
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{mode === 'create' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Tên tài khoản"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        disabled={mode === 'edit'}
                    />
                    <TextField
                        label="Họ tên"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <FormControl>
                        <InputLabel>Giới tính</InputLabel>
                        <Select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <MenuItem value="">Không xác định</MenuItem>
                            <MenuItem value="Nam">Nam</MenuItem>
                            <MenuItem value="Nữ">Nữ</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <TextField
                        label="Số điện thoại"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <FormControl required>
                        <InputLabel>Vai trò</InputLabel>
                        <Select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            {Object.entries(ROLE_DISPLAY).map(([code, label]) => (
                                <MenuItem key={code} value={code}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <MenuItem value={true}>Kích hoạt</MenuItem>
                            <MenuItem value={false}>Vô hiệu hóa</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Đang xử lý...' : mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserDialog;

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
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import { adminUserApi } from '~/apis/adminUserApi';
import { toast } from 'react-toastify';
import { ROLE_DISPLAY } from '~/config/rbacConfig';
import { ROLE_CONFIG } from '~/config/roleConfig';

function AdminUserDialog({ open, mode, user, schools, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        schoolId: '',
        fullName: '',
        gender: '',
        email: '',
        phone: '',
        role: 'giao_vien',
        isRoot: false,
        status: true,
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && user) {
            setFormData({
                schoolId: user.schoolId || '',
                fullName: user.fullName || '',
                gender: user.gender || '',
                email: user.email || '',
                phone: user.phone || '',
                role: user.role || 'giao_vien',
                isRoot: user.isRoot || false,
                status: user.status ?? true,
            });
        } else {
            setFormData({
                schoolId: '',
                fullName: '',
                gender: '',
                email: '',
                phone: '',
                role: 'giao_vien',
                isRoot: false,
                status: true,
            });
        }
    }, [mode, user, schools, open]);

    const handleSubmit = async () => {
        // Validation
        if (!formData.schoolId) {
            toast.error('Vui lòng chọn trường học!');
            return;
        }
        if (!formData.fullName.trim()) {
            toast.error('Vui lòng nhập họ tên!');
            return;
        }
        if (!formData.role) {
            toast.error('Vui lòng chọn vai trò!');
            return;
        }

        try {
            setLoading(true);

            // ✅ FIX: Loại bỏ schoolId khi update
            const dataToSubmit = { ...formData };
            if (mode === 'edit') {
                delete dataToSubmit.schoolId; // ✅ Không gửi schoolId khi update
            }

            // ✅ FIX: Tự động set isRoot = false nếu role không phải ban_giam_hieu
            if (dataToSubmit.role !== 'ban_giam_hieu') {
                dataToSubmit.isRoot = false;
            }

            if (mode === 'create') {
                await adminUserApi.create(dataToSubmit);
                toast.success('Tạo người dùng thành công!');
            } else {
                await adminUserApi.update(user._id, dataToSubmit);
                toast.success('Cập nhật người dùng thành công!');
            }
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    const isCreateMode = mode === 'create';
    const roleConfig = ROLE_CONFIG[formData.role] || {};
    const RoleIcon = roleConfig.icon || PersonIcon;

    // Lọc role (không hiển thị admin)
    const availableRoles = Object.entries(ROLE_DISPLAY).filter(([code]) => code !== 'admin');

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
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
                        {isCreateMode ? <PersonAddIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="h7" fontWeight={400}>
                        {isCreateMode ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
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
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Section: Thông tin trường học */}
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
                            <Box
                                sx={{
                                    width: 3,
                                    height: 14,
                                    bgcolor: 'secondary.main',
                                    borderRadius: 1,
                                }}
                            />
                            Thông tin trường học
                        </Typography>

                        <FormControl
                            required
                            fullWidth
                            size="small"
                            disabled={!isCreateMode}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                },
                            }}
                        >
                            <InputLabel>Tên trường</InputLabel>
                            <Select
                                value={formData.schoolId}
                                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                                label="Tên trường"
                            >
                                <MenuItem value="">-- Chọn trường --</MenuItem>
                                {schools.map((school) => (
                                    <MenuItem key={school._id} value={school.schoolId}>
                                        {school.name} ({school.abbreviation})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {!isCreateMode && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                Không thể thay đổi trường học sau khi tạo
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    {/* Section: Thông tin cá nhân */}
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
                            <Box
                                sx={{
                                    width: 3,
                                    height: 14,
                                    bgcolor: 'primary.main',
                                    borderRadius: 1,
                                }}
                            />
                            Thông tin cá nhân
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Họ và tên"
                                placeholder="VD: Nguyễn Văn A"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                                fullWidth
                                size="small"
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    },
                                }}
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl
                                    fullWidth
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                        },
                                    }}
                                >
                                    <InputLabel>Giới tính</InputLabel>
                                    <Select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        label="Giới tính"
                                    >
                                        <MenuItem value="">Không xác định</MenuItem>
                                        <MenuItem value="Nam">Nam</MenuItem>
                                        <MenuItem value="Nữ">Nữ</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Số điện thoại"
                                    placeholder="VD: 0901234567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                        },
                                    }}
                                />
                            </Box>

                            <TextField
                                label="Email"
                                type="email"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                fullWidth
                                size="small"
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Section: Phân quyền */}
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
                            <Box
                                sx={{
                                    width: 3,
                                    height: 14,
                                    bgcolor: 'success.main',
                                    borderRadius: 1,
                                }}
                            />
                            Phân quyền & Trạng thái
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl
                                required
                                fullWidth
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    },
                                }}
                            >
                                <InputLabel>Vai trò</InputLabel>
                                <Select
                                    value={formData.role}
                                    onChange={(e) => {
                                        const newRole = e.target.value;
                                        setFormData({
                                            ...formData,
                                            role: newRole,
                                            // ✅ Tự động reset isRoot khi đổi role
                                            isRoot: newRole === 'ban_giam_hieu' ? formData.isRoot : false,
                                        });
                                    }}
                                    label="Vai trò"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <RoleIcon sx={{ fontSize: 18, color: roleConfig.color }} />
                                            <Typography variant="body2">{ROLE_DISPLAY[selected]}</Typography>
                                        </Box>
                                    )}
                                >
                                    {availableRoles.map(([code, label]) => {
                                        const config = ROLE_CONFIG[code] || {};
                                        const Icon = config.icon || PersonIcon;
                                        return (
                                            <MenuItem key={code} value={code}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            bgcolor: config.bgColor,
                                                        }}
                                                    >
                                                        <Icon sx={{ fontSize: 16, color: config.color }} />
                                                    </Avatar>
                                                    <Typography variant="body2">{label}</Typography>
                                                </Box>
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>

                            {/* Checkbox isRoot chỉ hiển thị khi role là ban_giam_hieu */}
                            {formData.role === 'ban_giam_hieu' && (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.isRoot}
                                            onChange={(e) => setFormData({ ...formData, isRoot: e.target.checked })}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                Đặt làm Ban giám hiệu Root
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Root có quyền cao nhất trong trường, không thể bị xóa bởi BGH khác
                                            </Typography>
                                        </Box>
                                    }
                                />
                            )}

                            <FormControl
                                fullWidth
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    },
                                }}
                            >
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

                    {/* Thông tin auto-generate */}
                    {isCreateMode && (
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: '#f5f5f5',
                                borderRadius: 2,
                                border: '1px dashed #ccc',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                <strong>Lưu ý:</strong> Sau khi tạo, hệ thống sẽ tự động sinh:
                                <br />• <strong>User ID:</strong> 8 chữ số ngẫu nhiên
                                <br />• <strong>Tên tài khoản:</strong> Viết tắt trường + họ tên (VD: HKP.nguyenvana)
                                <br />• <strong>Mật khẩu mặc định:</strong> 123456
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
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
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a4296 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang xử lý...' : isCreateMode ? 'Tạo người dùng' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminUserDialog;

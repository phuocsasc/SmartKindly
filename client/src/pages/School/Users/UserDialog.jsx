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
    Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import { userApi } from '~/apis/userApi';
import { toast } from 'react-toastify';
import { ROLES, ROLE_DISPLAY, ROLE_CONFIG } from '~/config/roleConfig';
import { useUser } from '~/contexts/UserContext';

function UserDialog({ open, mode, user, onClose, onSuccess }) {
    const { user: currentUser } = useUser();
    const [formData, setFormData] = useState({
        fullName: '',
        gender: '',
        email: '',
        phone: '',
        role: ROLES.GIAO_VIEN,
        status: true,
    });

    const [loading, setLoading] = useState(false);

    // ✅ Kiểm tra xem user hiện tại có phải BGH root không
    const isCurrentUserRoot = currentUser?.role === ROLES.BAN_GIAM_HIEU && currentUser?.isRoot === true;

    useEffect(() => {
        if (mode === 'edit' && user) {
            setFormData({
                fullName: user.fullName || '',
                gender: user.gender || '',
                email: user.email || '',
                phone: user.phone || '',
                role: user.role || ROLES.GIAO_VIEN,
                status: user.status ?? true,
            });
        } else {
            setFormData({
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
        // Validation
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

    const isCreateMode = mode === 'create';
    const roleConfig = ROLE_CONFIG[formData.role] || {};
    const RoleIcon = roleConfig.icon || PersonIcon;

    // ✅ Lọc role: Nếu không phải BGH root thì không hiển thị vai trò BGH
    const availableRoles = Object.entries(ROLE_DISPLAY).filter(([code]) => {
        if (code === ROLES.ADMIN) return false; // Luôn ẩn admin
        if (code === ROLES.BAN_GIAM_HIEU && !isCurrentUserRoot) return false; // Chỉ BGH root mới thấy
        return true;
    });

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
            {/* Header with gradient background */}
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
                        {isCreateMode ? <PersonAddIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="h7" fontWeight={400}>
                        {isCreateMode ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
                    </Typography>
                </Box>

                {/* Close button */}
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
                    <CloseIcon fontSize="small" sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    py: 2.5,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,

                        // ✅ Khi hover viền sáng màu xanh nhạt
                        '&:hover fieldset': {
                            borderColor: '#0071bc',
                        },

                        // ✅ Khi focus viền đậm màu xanh biển
                        '&.Mui-focused fieldset': {
                            borderColor: '#0071bc',
                            borderWidth: 2,
                        },
                    },

                    // ✅ Đổi màu label khi focus
                    '& label.Mui-focused': {
                        color: '#0071bc',
                    },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Thông báo tên tài khoản tự động */}
                    {isCreateMode && (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2">
                                <strong>Tên tài khoản</strong> sẽ được tự động tạo theo định dạng:{' '}
                                <strong>viettat.hoten</strong>
                                <br />
                                <strong>Mật khẩu mặc định:</strong> 123456
                            </Typography>
                        </Alert>
                    )}

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
                            {/* ✅ Họ tên - BẮT BUỘC */}
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
                                helperText="Tên tài khoản sẽ được tự động tạo từ họ tên"
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
                                    placeholder="Nhập số điện thoại..."
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

                        <Box sx={{ display: 'flex', gap: 2 }}>
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
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    label="Vai trò"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <RoleIcon sx={{ fontSize: 18, color: roleConfig.color }} />
                                            <Typography variant="body2">{ROLE_DISPLAY[selected]}</Typography>
                                        </Box>
                                    )}
                                >
                                    {/* ✅ Chỉ hiển thị các role ngoại trừ ADMIN */}
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
                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang xử lý...' : isCreateMode ? 'Tạo người dùng' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserDialog;

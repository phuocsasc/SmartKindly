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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import { userApi } from '~/apis/userApi';
import { toast } from 'react-toastify';
import { ROLES, ROLE_DISPLAY, ROLE_CONFIG } from '~/config/roleConfig';

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
        // Validation
        if (!formData.username.trim()) {
            toast.error('Vui lòng nhập tên tài khoản!');
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
            {/* Header with gradient background */}
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
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Section: Thông tin tài khoản */}
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
                            Thông tin tài khoản
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Tên tài khoản"
                                placeholder="Nhập tên tài khoản..."
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                disabled={!isCreateMode}
                                fullWidth
                                size="small"
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    },
                                }}
                                helperText={
                                    isCreateMode
                                        ? 'Tên tài khoản không thể thay đổi sau khi tạo'
                                        : 'Tên tài khoản không thể chỉnh sửa'
                                }
                            />

                            <TextField
                                label="Họ và tên"
                                placeholder="Nhập họ và tên đầy đủ..."
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                                    {Object.entries(ROLE_DISPLAY).map(([code, label]) => {
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

export default UserDialog;

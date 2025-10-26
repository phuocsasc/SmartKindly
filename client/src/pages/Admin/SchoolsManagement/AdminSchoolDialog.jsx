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
    Avatar,
    MenuItem,
    Typography,
    IconButton,
    Divider,
    CircularProgress,
    Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import { schoolApi } from '~/apis/schoolApi';
import { toast } from 'react-toastify';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from '~/config/dayjsConfig';

function AdminSchoolDialog({ open, mode, school, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        abbreviation: '',
        address: '',
        taxCode: '',
        manager: '',
        phone: '',
        email: '',
        website: '',
        establishmentDate: null,
        status: true,
    });

    const [loading, setLoading] = useState(false);
    const isEditMode = mode === 'edit';

    // ✅ Kiểm tra thay đổi status
    const isStatusChanging = isEditMode && school?.status !== formData.status;
    const isStatusChangingToInactive = isEditMode && school?.status === true && formData.status === false;
    const isStatusChangingToActive = isEditMode && school?.status === false && formData.status === true;

    useEffect(() => {
        if (mode === 'edit' && school) {
            setFormData({
                name: school.name || '',
                abbreviation: school.abbreviation || '',
                address: school.address || '',
                taxCode: school.taxCode || '',
                manager: school.manager || '',
                phone: school.phone || '',
                email: school.email || '',
                website: school.website || '',
                establishmentDate: school.establishmentDate ? dayjs(school.establishmentDate) : null,
                status: school.status ?? true,
            });
        } else {
            setFormData({
                name: '',
                abbreviation: '',
                address: '',
                taxCode: '',
                manager: '',
                phone: '',
                email: '',
                website: '',
                establishmentDate: null,
                status: true,
            });
        }
    }, [mode, school, open]);

    const handleSubmit = async () => {
        // Validation
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên trường học!');
            return;
        }
        if (!formData.abbreviation.trim()) {
            toast.error('Vui lòng nhập tên viết tắt!');
            return;
        }
        if (!formData.address.trim()) {
            toast.error('Vui lòng nhập địa chỉ!');
            return;
        }
        if (!formData.manager.trim()) {
            toast.error('Vui lòng nhập tên hiệu trưởng!');
            return;
        }
        if (!formData.phone.trim()) {
            toast.error('Vui lòng nhập số điện thoại!');
            return;
        }
        if (!formData.establishmentDate) {
            toast.error('Vui lòng chọn ngày thành lập!');
            return;
        }

        try {
            setLoading(true);

            const dataToSubmit = {
                ...formData,
                establishmentDate: formData.establishmentDate.format('YYYY-MM-DD'),
            };

            if (mode === 'create') {
                await schoolApi.create(dataToSubmit);
                toast.success('Tạo trường học thành công!');
            } else {
                const response = await schoolApi.update(school._id, dataToSubmit);

                // ✅ Hiển thị thông báo từ backend
                const message = response.data.message || 'Cập nhật trường học thành công!';
                toast.success(message, {
                    autoClose: isStatusChanging ? 7000 : 3000,
                });
            }

            onSuccess();
            onClose();
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
                sx: { borderRadius: 2 },
            }}
        >
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
                        {mode === 'create' ? <SchoolIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="h7" fontWeight={400}>
                        {mode === 'create' ? 'Thêm trường học mới' : 'Chỉnh sửa thông tin trường học'}
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
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
                    maxHeight: '70vh', // 👈 cần có để xuất hiện scroll
                    overflowY: 'auto',
                    mt: -2,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                    /* ✅ Style chung cho input */
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
                    {/* Section: Thông tin cơ bản */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mt: 2,
                                mb: 1.5,
                                color: 'secondary.main',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: 'secondary.main', borderRadius: 1 }} />
                            Thông tin cơ bản
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Tên trường học"
                                placeholder="VD: Trường Mầm Non Hoa Hồng"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                fullWidth
                                size="small"
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Tên viết tắt"
                                    placeholder="VD: HH"
                                    value={formData.abbreviation}
                                    onChange={(e) =>
                                        setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })
                                    }
                                    required
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    helperText="Sử dụng làm tiền tố cho tài khoản"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                                <TextField
                                    label="Mã số thuế"
                                    placeholder="VD: 0123456789"
                                    value={formData.taxCode}
                                    onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <TextField
                                label="Địa chỉ"
                                placeholder="VD: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                                fullWidth
                                size="small"
                                variant="outlined"
                                multiline
                                rows={2}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Section: Thông tin liên hệ */}
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
                            Thông tin liên hệ
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Tên hiệu trưởng"
                                placeholder="VD: Nguyễn Văn A"
                                value={formData.manager}
                                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                required
                                fullWidth
                                size="small"
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Số điện thoại"
                                    placeholder="VD: 0912345678"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                                <TextField
                                    label="Email"
                                    placeholder="VD: contact@school.edu.vn"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <TextField
                                label="Website"
                                placeholder="VD: https://school.edu.vn"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                fullWidth
                                size="small"
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />
                        </Box>
                    </Box>

                    <Divider />
                    {/* ✅ Hiển thị cảnh báo khi status chuyển sang "Không hoạt động" */}
                    {isStatusChangingToInactive && (
                        <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />} sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight={600}>
                                ⚠️ Cảnh báo: Vô hiệu hóa trường học
                            </Typography>
                            <Typography variant="body2">
                                Khi chuyển trường sang trạng thái <strong>"Không hoạt động"</strong>, tất cả{' '}
                                <strong>tài khoản</strong> của cán bộ, giáo viên, phụ huynh trong trường này sẽ tự động
                                bị <strong>vô hiệu hóa</strong>.
                            </Typography>
                        </Alert>
                    )}

                    {/* ✅ Hiển thị thông báo khi status chuyển sang "Hoạt động" */}
                    {isStatusChangingToActive && (
                        <Alert severity="info" icon={<InfoIcon fontSize="inherit" />} sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight={600}>
                                ℹ️ Thông báo: Kích hoạt lại trường học
                            </Typography>
                            <Typography variant="body2">
                                Khi chuyển trường sang trạng thái <strong>"Hoạt động"</strong>, tất cả{' '}
                                <strong>tài khoản</strong> của cán bộ, giáo viên, phụ huynh trong trường này sẽ tự động
                                được <strong>kích hoạt lại</strong>.
                            </Typography>
                        </Alert>
                    )}
                    {/* Section: Thông tin khác */}
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
                            Thông tin khác
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <DatePicker
                                label="Ngày thành lập"
                                value={formData.establishmentDate}
                                onChange={(newValue) => setFormData({ ...formData, establishmentDate: newValue })}
                                format="DD/MM/YYYY"
                                slotProps={{
                                    textField: {
                                        required: true,
                                        fullWidth: true,
                                        size: 'small',
                                        variant: 'outlined',
                                        sx: { '& .MuiOutlinedInput-root': { borderRadius: 1.5 } },
                                    },
                                    actionBar: {
                                        actions: ['clear', 'today'],
                                    },
                                }}
                            />

                            <FormControl
                                fullWidth
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            >
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    label="Trạng thái"
                                >
                                    <MenuItem value={true}>Hoạt động</MenuItem>
                                    <MenuItem value={false}>Không hoạt động</MenuItem>
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
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: isStatusChangingToInactive
                            ? 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)'
                            : isStatusChangingToActive
                              ? 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)'
                              : 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        minWidth: 120,
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={20} sx={{ color: '#fff' }} />
                    ) : mode === 'create' ? (
                        'Tạo mới'
                    ) : (
                        'Cập nhật'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminSchoolDialog;

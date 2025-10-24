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
    Chip,
    Avatar,
    OutlinedInput,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import { departmentApi } from '~/apis/departmentApi';
import { toast } from 'react-toastify';

const DEPARTMENT_NAMES = [
    'Cán bộ quản lý',
    'Tổ cấp dưỡng',
    'Tổ Văn Phòng',
    'Khối Nhà Trẻ',
    'Khối Mầm',
    'Khối Chồi',
    'Khối Lá',
];

function DepartmentDialog({ open, mode, department, academicYearId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        managers: [],
        note: '',
    });

    const [loading, setLoading] = useState(false);
    const [availableManagers, setAvailableManagers] = useState([]);
    const [loadingManagers, setLoadingManagers] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && department) {
            setFormData({
                name: department.name || '',
                managers: department.managers?.map((m) => m._id) || [],
                note: department.note || '',
            });
        } else {
            setFormData({
                name: '',
                managers: [],
                note: '',
            });
        }
    }, [mode, department, open]);

    // Fetch available managers when department name changes
    useEffect(() => {
        if (formData.name && open) {
            fetchAvailableManagers(formData.name);
        } else {
            setAvailableManagers([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.name, open]);

    const fetchAvailableManagers = async (departmentName) => {
        try {
            setLoadingManagers(true);
            const res = await departmentApi.getAvailableManagers(departmentName);
            setAvailableManagers(res.data.data);
        } catch (error) {
            console.error('Error fetching managers:', error);
            toast.error('Lỗi khi tải danh sách cán bộ!');
        } finally {
            setLoadingManagers(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.name) {
            toast.error('Vui lòng chọn tên tổ bộ môn!');
            return;
        }

        if (formData.managers.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 cán bộ quản lý!');
            return;
        }

        if (formData.note && formData.note.trim().length < 3) {
            toast.error('Ghi chú phải có ít nhất 3 ký tự!');
            return;
        }

        try {
            setLoading(true);

            const dataToSubmit = {
                academicYearId,
                name: formData.name,
                managers: formData.managers,
                note: formData.note.trim() || '',
            };

            if (mode === 'create') {
                await departmentApi.create(dataToSubmit);
                toast.success('Tạo tổ bộ môn thành công!');
            } else {
                const updateData = {
                    name: formData.name,
                    managers: formData.managers,
                    note: formData.note.trim() || '',
                };
                await departmentApi.update(department._id, updateData);
                toast.success('Cập nhật tổ bộ môn thành công!');
            }

            onSuccess();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    const isCreateMode = mode === 'create';

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
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    py: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {isCreateMode ? <AddCircleOutlineIcon /> : <EditIcon />}
                    <Typography variant="h6" fontWeight={600}>
                        {isCreateMode ? 'Thêm tổ bộ môn mới' : 'Chỉnh sửa tổ bộ môn'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Tên tổ bộ môn */}
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
                            Thông tin tổ bộ môn
                        </Typography>

                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
                            <InputLabel>Tên tổ bộ môn *</InputLabel>
                            <Select
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value, managers: [] });
                                }}
                                label="Tên tổ bộ môn *"
                            >
                                <MenuItem value="">-- Chọn tổ bộ môn --</MenuItem>
                                {DEPARTMENT_NAMES.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        <Chip
                                            label={name}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                bgcolor: '#e3f2fd',
                                                color: '#1976d2',
                                            }}
                                        />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Cán bộ quản lý */}
                    {formData.name && (
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
                                Cán bộ quản lý
                            </Typography>

                            {loadingManagers ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : availableManagers.length === 0 ? (
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: '#fff3e0',
                                        borderRadius: 1,
                                        border: '1px dashed #ff9800',
                                    }}
                                >
                                    <Typography variant="body2" color="warning.main">
                                        ⚠️ Không có cán bộ phù hợp với tổ bộ môn này
                                    </Typography>
                                </Box>
                            ) : (
                                <FormControl
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                >
                                    <InputLabel>Chọn cán bộ quản lý *</InputLabel>
                                    <Select
                                        multiple
                                        value={formData.managers}
                                        onChange={(e) => setFormData({ ...formData, managers: e.target.value })}
                                        input={<OutlinedInput label="Chọn cán bộ quản lý *" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((managerId) => {
                                                    const manager = availableManagers.find((m) => m._id === managerId);
                                                    return (
                                                        <Chip
                                                            key={managerId}
                                                            label={manager?.fullName}
                                                            size="small"
                                                            avatar={
                                                                <Avatar sx={{ width: 24, height: 24 }}>
                                                                    <GroupsIcon sx={{ fontSize: 14 }} />
                                                                </Avatar>
                                                            }
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {availableManagers.map((manager) => (
                                            <MenuItem key={manager._id} value={manager._id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#e3f2fd' }}>
                                                        <GroupsIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {manager.fullName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {manager.username} • {manager.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    )}

                    {/* Ghi chú */}
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
                            Ghi chú
                        </Typography>

                        <TextField
                            placeholder="Nhập ghi chú (tối thiểu 3 ký tự, tối đa 200 ký tự)"
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            multiline
                            rows={3}
                            fullWidth
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            helperText={`${formData.note.length}/200 ký tự`}
                            inputProps={{ maxLength: 200 }}
                        />
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
                    {loading ? (
                        <CircularProgress size={20} sx={{ color: '#fff' }} />
                    ) : isCreateMode ? (
                        'Tạo mới'
                    ) : (
                        'Cập nhật'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DepartmentDialog;

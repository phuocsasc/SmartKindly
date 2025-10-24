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
    Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { academicYearApi } from '~/apis/academicYearApi';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function AcademicYearDialog({ open, mode, academicYear, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        fromYear: '',
        toYear: '',
        semester1StartDate: null,
        semester1EndDate: null,
        semester2StartDate: null,
        semester2EndDate: null,
        status: 'active', // ✅ Mặc định "active"
    });

    const [loading, setLoading] = useState(false);

    // ✅ Kiểm tra năm học đã kết thúc
    const isInactive = mode === 'edit' && academicYear?.status === 'inactive';

    // ✅ Kiểm tra năm học đã cấu hình
    const isConfigured = mode === 'edit' && academicYear?.isConfig === true;

    // ✅ Chỉ cho phép sửa status nếu đã cấu hình
    const canOnlyEditStatus = mode === 'edit' && isConfigured && academicYear?.status === 'active';

    useEffect(() => {
        if (mode === 'edit' && academicYear) {
            const sem1 = academicYear.semesters?.find((s) => s.name === 'Học kì I') || {};
            const sem2 = academicYear.semesters?.find((s) => s.name === 'Học kì II') || {};

            setFormData({
                fromYear: academicYear.fromYear || '',
                toYear: academicYear.toYear || '',
                semester1StartDate: sem1.startDate ? dayjs(sem1.startDate) : null,
                semester1EndDate: sem1.endDate ? dayjs(sem1.endDate) : null,
                semester2StartDate: sem2.startDate ? dayjs(sem2.startDate) : null,
                semester2EndDate: sem2.endDate ? dayjs(sem2.endDate) : null,
                status: academicYear.status || 'active',
            });
        } else {
            // Auto calculate toYear when fromYear changes
            const currentYear = new Date().getFullYear();
            setFormData({
                fromYear: currentYear,
                toYear: currentYear + 1,
                semester1StartDate: dayjs(`${currentYear}-09-01`),
                semester1EndDate: dayjs(`${currentYear + 1}-01-15`),
                semester2StartDate: dayjs(`${currentYear + 1}-01-16`),
                semester2EndDate: dayjs(`${currentYear + 1}-06-30`),
                status: 'active',
            });
        }
    }, [mode, academicYear, open]);

    // Auto update toYear when fromYear changes
    const handleFromYearChange = (value) => {
        const year = parseInt(value);
        if (!isNaN(year)) {
            setFormData({
                ...formData,
                fromYear: year,
                toYear: year + 1,
                semester1StartDate: dayjs(`${year}-09-01`),
                semester1EndDate: dayjs(`${year + 1}-01-15`),
                semester2StartDate: dayjs(`${year + 1}-01-16`),
                semester2EndDate: dayjs(`${year + 1}-06-30`),
            });
        }
    };

    const handleSubmit = async () => {
        // ✅ Không cho submit nếu năm học đã inactive
        if (isInactive) {
            toast.error('Không thể chỉnh sửa năm học đã kết thúc!');
            return;
        }
        try {
            setLoading(true);

            // Validate
            if (!formData.fromYear || !formData.toYear) {
                toast.error('Vui lòng nhập đầy đủ thông tin năm học!');
                return;
            }

            if (formData.toYear !== formData.fromYear + 1) {
                toast.error('Năm kết thúc phải lớn hơn năm bắt đầu đúng 1 năm!');
                return;
            }

            if (
                !formData.semester1StartDate ||
                !formData.semester1EndDate ||
                !formData.semester2StartDate ||
                !formData.semester2EndDate
            ) {
                toast.error('Vui lòng chọn đầy đủ ngày học kỳ!');
                return;
            }

            // Validate ngày học kỳ I
            if (formData.semester1EndDate.isBefore(formData.semester1StartDate)) {
                toast.error('Ngày kết thúc HK I phải sau ngày bắt đầu!');
                return;
            }

            // Validate ngày học kỳ II
            if (formData.semester2EndDate.isBefore(formData.semester2StartDate)) {
                toast.error('Ngày kết thúc HK II phải sau ngày bắt đầu!');
                return;
            }

            // Validate HK II phải sau HK I
            if (formData.semester2StartDate.isBefore(formData.semester1EndDate)) {
                toast.error('Học kỳ II phải bắt đầu sau khi học kỳ I kết thúc!');
                return;
            }

            // Prepare data
            let dataToSubmit;

            if (canOnlyEditStatus) {
                // ✅ Chỉ gửi status nếu năm học đã cấu hình
                dataToSubmit = {
                    status: formData.status,
                };
            } else {
                // ✅ Gửi đầy đủ data nếu chưa cấu hình
                dataToSubmit = {
                    fromYear: parseInt(formData.fromYear),
                    toYear: parseInt(formData.toYear),
                    semesters: [
                        {
                            name: 'Học kì I',
                            startDate: formData.semester1StartDate.format('YYYY-MM-DD'),
                            endDate: formData.semester1EndDate.format('YYYY-MM-DD'),
                        },
                        {
                            name: 'Học kì II',
                            startDate: formData.semester2StartDate.format('YYYY-MM-DD'),
                            endDate: formData.semester2EndDate.format('YYYY-MM-DD'),
                        },
                    ],
                    status: formData.status,
                };
            }
            console.log('📤 [AcademicYearDialog] Data to submit:', dataToSubmit);

            if (mode === 'create') {
                await academicYearApi.create(dataToSubmit);
                toast.success('Tạo năm học thành công!');
            } else {
                await academicYearApi.update(academicYear._id, dataToSubmit);
                toast.success('Cập nhật năm học thành công!');
            }

            onSuccess();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {isInactive
                    ? 'Xem thông tin năm học'
                    : mode === 'create'
                      ? 'Thêm năm học mới'
                      : canOnlyEditStatus
                        ? 'Kết thúc năm học'
                        : 'Chỉnh sửa năm học'}
            </DialogTitle>
            <DialogContent>
                {/* ✅ Thông báo nếu năm học đã kết thúc */}
                {isInactive && (
                    <Box
                        sx={{
                            mb: 2,
                            p: 1.5,
                            bgcolor: '#e0e0e0',
                            borderRadius: 1,
                            border: '1px solid #9e9e9e',
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            ℹ️ Năm học đã kết thúc, không thể chỉnh sửa. Dữ liệu chỉ dùng để tham khảo.
                        </Typography>
                    </Box>
                )}
                {/* ✅ Thông báo nếu chỉ được sửa status */}
                {canOnlyEditStatus && (
                    <Box
                        sx={{
                            mb: 2,
                            p: 1.5,
                            bgcolor: '#fff3e0',
                            borderRadius: 1,
                            border: '1px solid #ff9800',
                        }}
                    >
                        <Typography variant="body2" color="warning.main">
                            ⚠️ Năm học đã cấu hình dữ liệu, chỉ có thể chuyển sang trạng thái "Đã xong".
                        </Typography>
                    </Box>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Năm học - Disabled nếu đã inactive hoặc chỉ sửa status */}
                    {!canOnlyEditStatus && (
                        <>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Năm bắt đầu"
                                    type="number"
                                    value={formData.fromYear}
                                    onChange={(e) => handleFromYearChange(e.target.value)}
                                    required
                                    disabled={mode === 'edit' || isInactive}
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                        },
                                    }}
                                />
                                <TextField
                                    label="Năm kết thúc"
                                    type="number"
                                    value={formData.toYear}
                                    disabled
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

                            <Divider>
                                <Typography variant="body2" color="text.secondary">
                                    Học kỳ I
                                </Typography>
                            </Divider>

                            {/* Học kỳ I - Disabled nếu đã inactive */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DatePicker
                                    label="Ngày bắt đầu HK I"
                                    value={formData.semester1StartDate}
                                    onChange={(newValue) => setFormData({ ...formData, semester1StartDate: newValue })}
                                    format="DD/MM/YYYY"
                                    disabled={isInactive}
                                    slotProps={{
                                        textField: {
                                            required: true,
                                            fullWidth: true,
                                            size: 'small',
                                            variant: 'outlined',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1.5,
                                                },
                                            },
                                        },
                                        actionBar: {
                                            actions: ['clear', 'today'],
                                        },
                                    }}
                                />
                                <DatePicker
                                    label="Ngày kết thúc HK I"
                                    value={formData.semester1EndDate}
                                    onChange={(newValue) => setFormData({ ...formData, semester1EndDate: newValue })}
                                    format="DD/MM/YYYY"
                                    minDate={formData.semester1StartDate}
                                    disabled={isInactive}
                                    slotProps={{
                                        textField: {
                                            required: true,
                                            fullWidth: true,
                                            size: 'small',
                                            variant: 'outlined',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1.5,
                                                },
                                            },
                                        },
                                        actionBar: {
                                            actions: ['clear', 'today'],
                                        },
                                    }}
                                />
                            </Box>

                            <Divider>
                                <Typography variant="body2" color="text.secondary">
                                    Học kỳ II
                                </Typography>
                            </Divider>

                            {/* Học kỳ II - Disabled nếu đã inactive */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DatePicker
                                    label="Ngày bắt đầu HK II"
                                    value={formData.semester2StartDate}
                                    onChange={(newValue) => setFormData({ ...formData, semester2StartDate: newValue })}
                                    format="DD/MM/YYYY"
                                    minDate={formData.semester1EndDate}
                                    disabled={isInactive}
                                    slotProps={{
                                        textField: {
                                            required: true,
                                            fullWidth: true,
                                            size: 'small',
                                            variant: 'outlined',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1.5,
                                                },
                                            },
                                        },
                                        actionBar: {
                                            actions: ['clear', 'today'],
                                        },
                                    }}
                                />
                                <DatePicker
                                    label="Ngày kết thúc HK II"
                                    value={formData.semester2EndDate}
                                    onChange={(newValue) => setFormData({ ...formData, semester2EndDate: newValue })}
                                    format="DD/MM/YYYY"
                                    minDate={formData.semester2StartDate}
                                    disabled={isInactive}
                                    slotProps={{
                                        textField: {
                                            required: true,
                                            fullWidth: true,
                                            size: 'small',
                                            variant: 'outlined',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1.5,
                                                },
                                            },
                                        },
                                        actionBar: {
                                            actions: ['clear', 'today'],
                                        },
                                    }}
                                />
                            </Box>

                            <Divider />
                        </>
                    )}

                    {/* Status */}
                    {/* ✅ Status - Chỉ hiển thị khi mode = 'edit' */}
                    {mode === 'edit' && (
                        <FormControl fullWidth>
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                label="Trạng thái"
                                size="small"
                                variant="outlined"
                                disabled={isInactive}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                    },
                                }}
                            >
                                {/* ✅ Nếu đã cấu hình, chỉ hiển thị option "Đã xong" */}
                                {canOnlyEditStatus ? (
                                    <MenuItem value="inactive">Đã xong</MenuItem>
                                ) : (
                                    <>
                                        <MenuItem value="active">Đang hoạt động</MenuItem>
                                        <MenuItem value="inactive">Đã xong</MenuItem>
                                    </>
                                )}
                            </Select>
                        </FormControl>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
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
                    {isInactive ? 'Đóng' : 'Hủy'}
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
                        // background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a4296 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang xử lý...' : mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AcademicYearDialog;

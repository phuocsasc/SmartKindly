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
        status: 'inactive',
    });

    const [loading, setLoading] = useState(false);

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
                status: academicYear.status || 'inactive',
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
                status: 'inactive',
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
            const dataToSubmit = {
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
            <DialogTitle>{mode === 'create' ? 'Thêm năm học mới' : 'Chỉnh sửa năm học'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Năm học */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Năm bắt đầu"
                            type="number"
                            value={formData.fromYear}
                            onChange={(e) => handleFromYearChange(e.target.value)}
                            required
                            disabled={mode === 'edit'}
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
                            InputProps={{ readOnly: true }}
                            required
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

                    {/* Học kỳ I */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <DatePicker
                            label="Ngày bắt đầu HK I"
                            value={formData.semester1StartDate}
                            onChange={(newValue) => setFormData({ ...formData, semester1StartDate: newValue })}
                            format="DD/MM/YYYY"
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

                    {/* Học kỳ II */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <DatePicker
                            label="Ngày bắt đầu HK II"
                            value={formData.semester2StartDate}
                            onChange={(newValue) => setFormData({ ...formData, semester2StartDate: newValue })}
                            format="DD/MM/YYYY"
                            minDate={formData.semester1EndDate}
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

                    {/* Status */}
                    <FormControl fullWidth>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            label="Trạng thái"
                            size="small"
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                },
                            }}
                        >
                            <MenuItem value="inactive">Không hoạt động</MenuItem>
                            <MenuItem value="active">Đang hoạt động</MenuItem>
                        </Select>
                    </FormControl>
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
                    {loading ? 'Đang xử lý...' : mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AcademicYearDialog;

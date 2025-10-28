import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    IconButton,
    Chip,
    Avatar,
    CircularProgress,
    Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { classApi } from '~/apis/classApi';
import { academicYearApi } from '~/apis/academicYearApi';
import { toast } from 'react-toastify';

function ClassesCopyDialog({ open, currentYearId, onClose, onSuccess }) {
    const [selectedFromYear, setSelectedFromYear] = useState('');
    const [configuredYears, setConfiguredYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);

    // Fetch các năm học đã cấu hình
    useEffect(() => {
        if (open) {
            fetchConfiguredYears();
        }
    }, [open]);

    // Fetch classes khi chọn năm
    useEffect(() => {
        if (selectedFromYear) {
            fetchClasses(selectedFromYear);
        } else {
            setClasses([]);
        }
    }, [selectedFromYear]);

    const fetchConfiguredYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            // Lọc các năm đã cấu hình và không phải năm hiện tại
            const years = res.data.data.academicYears.filter(
                (year) => year.isConfig === true && year._id !== currentYearId,
            );
            setConfiguredYears(years);

            // Tự động chọn năm gần nhất
            if (years.length > 0) {
                setSelectedFromYear(years[0]._id);
            }
        } catch (error) {
            console.error('Error fetching years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    const fetchClasses = async (yearId) => {
        try {
            setLoadingClasses(true);
            const res = await classApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: yearId,
            });

            const cls = res.data.data.classes.map((item, index) => ({
                ...item,
                id: item._id,
                stt: index + 1,
                teacherName: item.homeRoomTeacher?.fullName || 'Chưa có',
                sessionsDisplay: [
                    item.sessions?.morning && 'Sáng',
                    item.sessions?.afternoon && 'Chiều',
                    item.sessions?.evening && 'Tối',
                ]
                    .filter(Boolean)
                    .join(', '),
            }));

            setClasses(cls);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
        } finally {
            setLoadingClasses(false);
        }
    };

    const handleCopy = async () => {
        if (!selectedFromYear) {
            toast.error('Vui lòng chọn năm học cần copy!');
            return;
        }

        if (classes.length === 0) {
            toast.error('Năm học được chọn không có lớp học nào!');
            return;
        }

        try {
            setLoading(true);

            await classApi.copyFromYear({
                fromAcademicYearId: selectedFromYear,
                toAcademicYearId: currentYearId,
            });

            toast.success(`Đã copy ${classes.length} lớp học thành công!`);
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error copying classes:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi copy lớp học!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedFromYear('');
        setClasses([]);
        onClose();
    };

    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'name',
            headerName: 'Tên lớp',
            flex: 1.2,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontWeight: 600,
                        color: '#1976d2',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'grade',
            headerName: 'Khối',
            flex: 0.8,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 500,
                    }}
                />
            ),
        },
        {
            field: 'ageGroup',
            headerName: 'Nhóm lớp',
            flex: 1,
            minWidth: 100,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        color: '#000',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'teacherName',
            headerName: 'Giáo viên chủ nhiệm',
            flex: 1.5,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 500,
                        color: '#000',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'sessionsDisplay',
            headerName: 'Buổi học',
            flex: 1,
            minWidth: 100,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {params.value.split(', ').map((session, index) => (
                        <Chip
                            key={index}
                            label={session}
                            size="small"
                            sx={{
                                bgcolor: '#e8f5e9',
                                color: '#2e7d32',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                            }}
                        />
                    ))}
                </Box>
            ),
        },
        {
            field: 'description',
            headerName: 'Ghi chú',
            flex: 1.5,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value || '---'}
                </Typography>
            ),
        },
    ];

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                        <ContentCopyIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Copy lớp học từ năm học cũ
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
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
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    py: 2.5,
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    mt: -2,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#f3e5f5' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#9c27b0', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#7b1fa2' },
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                    '& label.Mui-focused': { color: '#667eea' },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Thông báo */}
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2">
                            <strong>Lưu ý:</strong> Chức năng này sẽ copy toàn bộ lớp học (bao gồm giáo viên chủ nhiệm,
                            khối, nhóm lớp, buổi học và ghi chú) từ năm học đã chọn sang năm học hiện tại đang hoạt
                            động.
                        </Typography>
                    </Alert>

                    {/* Chọn năm học */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mt: 2,
                                mb: 1.5,
                                color: '#667eea',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: '#667eea', borderRadius: 1 }} />
                            Chọn năm học nguồn
                        </Typography>

                        {configuredYears.length === 0 ? (
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                Không có năm học nào đã cấu hình dữ liệu để copy!
                            </Alert>
                        ) : (
                            <FormControl fullWidth size="small">
                                <InputLabel>Chọn năm học *</InputLabel>
                                <Select
                                    value={selectedFromYear}
                                    onChange={(e) => setSelectedFromYear(e.target.value)}
                                    label="Chọn năm học *"
                                    sx={{ borderRadius: 1.5 }}
                                >
                                    {configuredYears.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {year.fromYear}-{year.toYear}
                                                </Typography>
                                                <Chip
                                                    label={year.status === 'active' ? 'Đang hoạt động' : 'Đã xong'}
                                                    size="small"
                                                    color={year.status === 'active' ? 'success' : 'default'}
                                                />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>

                    {/* Danh sách lớp học */}
                    {selectedFromYear && (
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 1.5,
                                    color: '#764ba2',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 3, height: 14, bgcolor: '#764ba2', borderRadius: 1 }} />
                                Danh sách lớp học ({loadingClasses ? '...' : `${classes.length} lớp học`})
                            </Typography>

                            <Box sx={{ height: 400, width: '100%' }}>
                                <DataGrid
                                    rows={classes}
                                    columns={columns}
                                    loading={loadingClasses}
                                    disableColumnMenu
                                    disableRowSelectionOnClick
                                    hideFooter
                                    autoHeight={false}
                                    sx={{
                                        // HEADER STYLE
                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: '#f3e5f5',
                                            color: '#7b1fa2',
                                            fontWeight: 900,
                                            borderBottom: '2px solid #ce93d8',
                                        },
                                        '& .MuiDataGrid-columnHeaderTitle': {
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem',
                                        },
                                        '& .MuiDataGrid-columnHeader': {
                                            borderRight: '1px solid #e1bee7',
                                            textAlign: 'center',
                                        },

                                        // BODY STYLE
                                        '& .MuiDataGrid-cell': {
                                            borderRight: '1px solid #e0e0e0',
                                            borderBottom: '1px solid #f0f0f0',
                                            alignItems: 'center',
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                            color: '#000',
                                        },

                                        // ROW HOVER
                                        '& .MuiDataGrid-row:hover': {
                                            backgroundColor: '#fce4ec',
                                        },
                                    }}
                                    slots={{
                                        noRowsOverlay: () => (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    height: '100%',
                                                }}
                                            >
                                                <Typography variant="body2" color="text.secondary">
                                                    Năm học này chưa có lớp học nào
                                                </Typography>
                                            </Box>
                                        ),
                                        loadingOverlay: () => (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    height: '100%',
                                                }}
                                            >
                                                <CircularProgress />
                                            </Box>
                                        ),
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
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
                    onClick={handleCopy}
                    disabled={loading || !selectedFromYear || classes.length === 0}
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
                    {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ClassesCopyDialog;

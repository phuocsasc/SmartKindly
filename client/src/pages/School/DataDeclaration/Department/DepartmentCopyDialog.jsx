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
import { departmentApi } from '~/apis/departmentApi';
import { academicYearApi } from '~/apis/academicYearApi';
import { toast } from 'react-toastify';

function DepartmentCopyDialog({ open, currentYearId, onClose, onSuccess }) {
    const [selectedFromYear, setSelectedFromYear] = useState('');
    const [configuredYears, setConfiguredYears] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);

    // Fetch các năm học đã cấu hình
    useEffect(() => {
        if (open) {
            fetchConfiguredYears();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Fetch departments khi chọn năm
    useEffect(() => {
        if (selectedFromYear) {
            fetchDepartments(selectedFromYear);
        } else {
            setDepartments([]);
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

    const fetchDepartments = async (yearId) => {
        try {
            setLoadingDepartments(true);
            const res = await departmentApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: yearId,
            });

            const depts = res.data.data.departments.map((dept, index) => ({
                ...dept,
                id: dept._id,
                stt: index + 1,
                managersDisplay: dept.managers?.map((m) => m.fullName).join(', ') || 'Chưa có',
            }));

            setDepartments(depts);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Lỗi khi tải danh sách tổ bộ môn!');
        } finally {
            setLoadingDepartments(false);
        }
    };

    const handleCopy = async () => {
        if (!selectedFromYear) {
            toast.error('Vui lòng chọn năm học cần copy!');
            return;
        }

        if (departments.length === 0) {
            toast.error('Năm học được chọn không có tổ bộ môn nào!');
            return;
        }

        try {
            setLoading(true);

            await departmentApi.copyFromYear({
                fromAcademicYearId: selectedFromYear,
                toAcademicYearId: currentYearId,
            });

            toast.success(`Đã copy ${departments.length} tổ bộ môn thành công!`);
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error copying departments:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi copy tổ bộ môn!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedFromYear('');
        setDepartments([]);
        onClose();
    };

    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'name',
            headerName: 'Tên tổ bộ môn',
            flex: 1,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => (
                <Typography
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
            field: 'managersDisplay',
            headerName: 'Cán bộ quản lý',
            flex: 2,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {params.row.managers?.length ? (
                        params.row.managers.map((m) => (
                            <Chip
                                key={m._id}
                                label={m.fullName}
                                size="small"
                                sx={{
                                    bgcolor: '#e0e0e0',
                                    color: '#000',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                }}
                            />
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Chưa có
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'note',
            headerName: 'Ghi chú',
            flex: 3,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    color="text.primary" // ✅ màu đen bình thường
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
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            {/* Header */}
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
                        <ContentCopyIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Copy tổ bộ môn từ năm học cũ
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
                    maxHeight: '70vh', // 👈 cần có để xuất hiện scroll
                    overflowY: 'auto',
                    mt: -2,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
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
                    {/* Chọn năm học */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mt: 2,
                                mb: 1.5,
                                color: '#0071bc',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: '#0071bc', borderRadius: 1 }} />
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

                    {/* Danh sách tổ bộ môn */}
                    {selectedFromYear && (
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
                                Danh sách tổ bộ môn ({loadingDepartments ? '...' : `${departments.length} tổ bộ môn`})
                            </Typography>

                            <Box sx={{ height: 400, width: '100%' }}>
                                <DataGrid
                                    rows={departments}
                                    columns={columns}
                                    loading={loadingDepartments}
                                    disableColumnMenu
                                    disableRowSelectionOnClick
                                    hideFooter
                                    autoHeight={false}
                                    sx={{
                                        // 💠 HEADER STYLE
                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: '#e3f2fd', // ✅ xanh biển nhạt
                                            color: '#1976d2', // ✅ chữ xanh đậm
                                            fontWeight: 900,
                                            borderBottom: '2px solid #bbdefb', // ✅ viền dưới header
                                        },
                                        '& .MuiDataGrid-columnHeaderTitle': {
                                            fontWeight: 'bold', // ✅ chữ in đậm
                                            fontSize: '0.95rem', // ✅ tùy chọn: chỉnh kích thước chữ
                                        },
                                        '& .MuiDataGrid-columnHeader': {
                                            borderRight: '1px solid #bbdefb', // ✅ đường kẻ giữa các cột header
                                            textAlign: 'center',
                                        },

                                        // 💠 BODY STYLE
                                        '& .MuiDataGrid-cell': {
                                            borderRight: '1px solid #e0e0e0', // ✅ đường kẻ giữa các cột body
                                            borderBottom: '1px solid #f0f0f0', // ✅ đường kẻ ngang
                                            alignItems: 'center',
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                            color: '#000',
                                        },
                                        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                            outline: 'none', // ✅ bỏ border khi click
                                        },

                                        // 💠 ROW HOVER (nếu muốn)
                                        '& .MuiDataGrid-row:hover': {
                                            backgroundColor: '#f5faff',
                                        },

                                        // 💠 BO GÓC NHẸ, BÓNG NHẸ
                                        borderRadius: 2,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                                                    Năm học này chưa có tổ bộ môn nào
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
                    disabled={loading || !selectedFromYear || departments.length === 0}
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
                    {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DepartmentCopyDialog;

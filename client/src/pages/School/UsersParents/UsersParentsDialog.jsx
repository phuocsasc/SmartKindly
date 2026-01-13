// client/src/pages/School/UsersParents/UsersParentsDialog.jsx

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Avatar,
    CircularProgress,
    Chip,
    Alert,
    TextField,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { parentApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function UsersParentsDialog({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 500);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Fetch available students with pagination & search
    const fetchAvailableStudents = async () => {
        try {
            setLoading(true);
            const res = await parentApi.getAvailableStudents({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
            });

            const { students: studentsData, pagination } = res.data.data;
            setStudents(studentsData);
            setTotalRows(pagination.totalItems);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Lỗi khi tải danh sách học sinh!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchAvailableStudents();
            setSelectedStudents([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, paginationModel, debounceSearch]);

    // Handle submit
    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            toast.warning('Vui lòng chọn ít nhất 1 học sinh!');
            return;
        }

        try {
            setSubmitting(true);

            // ✅ FIX: Proper error handling
            const res = await parentApi.create({ studentIds: selectedStudents });

            console.log('✅ [UsersParentsDialog] Response:', res.data); // Debug

            // ✅ FIX: Check response structure
            if (!res || !res.data) {
                throw new Error('Không nhận được phản hồi từ server');
            }

            const { data, message } = res.data;
            const { created, errors } = data;

            // ✅ Show result
            if (errors && errors.length > 0) {
                // Có lỗi nhưng vẫn tạo được một số tài khoản
                toast.warning(message || `Tạo thành công ${created.length} tài khoản, ${errors.length} lỗi`, {
                    autoClose: 5000,
                });
                console.warn('⚠️ [UsersParentsDialog] Errors:', errors);
            } else {
                // Tạo thành công tất cả
                toast.success(message || `Tạo thành công ${created.length} tài khoản phụ huynh!`);
            }

            onSuccess();
        } catch (error) {
            console.error('❌ [UsersParentsDialog] Error:', error);

            // ✅ FIX: Better error message
            const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi tạo tài khoản phụ huynh!';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ UPDATED: Columns - Tách riêng cột "Họ tên" và "Mã học sinh"
    const columns = [
        {
            field: 'stt',
            headerName: 'STT',
            width: 60,
            sortable: false,
            renderCell: (params) =>
                params.api.getRowIndexRelativeToVisibleRows(params.row._id) +
                1 +
                paginationModel.page * paginationModel.pageSize,
        },
        {
            field: 'fullName',
            headerName: 'Họ tên học sinh',
            flex: 1.5,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => (
                // ✅ UPDATED: Chỉ hiển thị tên học sinh, không có Chip
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            // ✅ NEW: Cột riêng cho Mã học sinh
            field: 'studentCode',
            headerName: 'Mã học sinh',
            flex: 1.2,
            minWidth: 140,
            sortable: false,
        },
        {
            field: 'birthDate',
            headerName: 'Ngày sinh',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => {
                return params.row.birthDate ? dayjs(params.row.birthDate).format('DD/MM/YYYY') : '---';
            },
        },
        {
            field: 'gender',
            headerName: 'Giới tính',
            flex: 0.8,
            minWidth: 90,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        bgcolor: params.value === 'Nam' ? '#e3f2fd' : '#fce4ec',
                        color: params.value === 'Nam' ? '#1976d2' : '#c2185b',
                        fontWeight: 500,
                    }}
                />
            ),
        },
        {
            field: 'currentAgeGroup',
            headerName: 'Nhóm tuổi hiện tại',
            flex: 1.2,
            minWidth: 140,
            sortable: false,
            renderCell: (params) => <Typography variant="body2">{params.value || '---'}</Typography>,
        },
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
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
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <PersonAddIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Thêm tài khoản phụ huynh
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
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ pt: 2, mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        Chọn học sinh để tạo tài khoản phụ huynh. Hệ thống sẽ tự động:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
                        <li>
                            Tạo <strong>username</strong> theo định dạng: <strong>viettat.hovaten</strong>
                        </li>
                        <li>
                            Mật khẩu mặc định: <strong>123456</strong>
                        </li>
                        <li>Liên kết tài khoản với học sinh đã chọn</li>
                    </Box>
                </Alert>

                {/* Search Box */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Tìm theo họ tên hoặc mã học sinh..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        fullWidth
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                                '&:hover fieldset': { borderColor: '#0071bc' },
                                '&.Mui-focused fieldset': { borderColor: '#0071bc' },
                            },
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : students.length === 0 && !searchText ? (
                    <Alert severity="warning">Không có học sinh nào chưa có tài khoản phụ huynh!</Alert>
                ) : students.length === 0 && searchText ? (
                    <Alert severity="info">Không tìm thấy học sinh phù hợp!</Alert>
                ) : (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Tổng số: {totalRows} học sinh | Đã chọn: {selectedStudents.length} học sinh
                        </Typography>

                        <DataGrid
                            rows={students}
                            columns={columns}
                            getRowId={(row) => row._id}
                            checkboxSelection
                            disableRowSelectionOnClick
                            disableColumnMenu
                            disableColumnSort
                            paginationMode="server"
                            rowCount={totalRows}
                            paginationModel={paginationModel}
                            onPaginationModelChange={setPaginationModel}
                            onRowSelectionModelChange={setSelectedStudents}
                            pageSizeOptions={[10, 20, 50]}
                            autoHeight
                            sx={{
                                '& .MuiCheckbox-root': {
                                    color: '#0071bc',
                                    '&.Mui-checked': { color: '#0071bc' },
                                },
                                '& .MuiDataGrid-row:hover': {
                                    backgroundColor: '#f5f5f5',
                                },
                                '& .MuiDataGrid-columnHeader': {
                                    backgroundColor: '#f8f9fa',
                                    fontWeight: 600,
                                },
                            }}
                            slotProps={{
                                pagination: {
                                    labelRowsPerPage: 'Số dòng mỗi trang:',
                                    labelDisplayedRows: ({ from, to, count }) =>
                                        `${from} - ${to} của ${count !== -1 ? count : `hơn ${to}`}`,
                                },
                            }}
                        />
                    </Box>
                )}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{ borderRadius: 1.5, px: 2.5, textTransform: 'none', fontWeight: 600 }}
                >
                    Hủy bỏ
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting || loading || students.length === 0}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        '&:hover': { boxShadow: 3 },
                    }}
                >
                    {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UsersParentsDialog;

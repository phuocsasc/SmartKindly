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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { childrenByClassApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function AddStudentsToClassDialog({ open, academicYearId, classId, className, ageGroup, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

    // ✅ Fetch available students
    const fetchAvailableStudents = async () => {
        try {
            setLoading(true);
            console.log('📥 [AddStudentsDialog] Fetching available students...');

            const res = await childrenByClassApi.getAvailableStudents(academicYearId, classId);
            const { students: studentsData } = res.data.data;

            console.log('✅ [AddStudentsDialog] Fetched students:', studentsData.length);
            console.log('📋 [AddStudentsDialog] Sample student:', studentsData[0]); // Debug structure

            setStudents(studentsData);
        } catch (error) {
            console.error('❌ [AddStudentsDialog] Error:', error);
            toast.error('Lỗi khi tải danh sách trẻ!');
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
    }, [open]);

    // ✅ Handle submit
    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            toast.warning('Vui lòng chọn ít nhất 1 học sinh!');
            return;
        }

        try {
            setSubmitting(true);
            await childrenByClassApi.addStudentsToClass({
                academicYearId,
                classId,
                studentIds: selectedStudents,
            });

            toast.success(`Đã thêm ${selectedStudents.length} trẻ vào lớp ${className}!`);
            onSuccess();
        } catch (error) {
            console.error('Error adding students:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi thêm trẻ vào lớp!');
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ FIX: Columns - Sử dụng renderCell thay vì valueGetter cho STT và birthDate
    const columns = [
        {
            field: 'stt',
            headerName: 'STT',
            width: 60,
            sortable: false,
            renderCell: (params) => {
                const index = students.findIndex((s) => s._id === params.row._id);
                return index + 1;
            },
        },
        {
            field: 'fullName',
            headerName: 'Họ tên học sinh',
            flex: 1.2,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>,
        },
        {
            field: 'studentCode',
            headerName: 'Mã học sinh',
            flex: 1,
            minWidth: 140,
            sortable: false,
        },
        {
            field: 'birthDate',
            headerName: 'Ngày sinh',
            flex: 0.8,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => {
                // ✅ FIX: Truy cập trực tiếp params.row.birthDate
                return params.row.birthDate ? dayjs(params.row.birthDate).format('DD/MM/YYYY') : '---';
            },
        },
        {
            field: 'gender',
            headerName: 'Giới tính',
            flex: 0.6,
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
            flex: 1,
            minWidth: 150,
            sortable: false,
        },
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                        Thêm trẻ vào lớp {className}
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
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Chỉ hiển thị trẻ <strong>chưa có lớp</strong>, <strong>đang học</strong> và có{' '}
                    <strong>nhóm tuổi "{ageGroup}"</strong>
                </Alert>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : students.length === 0 ? (
                    <Alert severity="warning">Không có trẻ phù hợp để thêm vào lớp này!</Alert>
                ) : (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Tổng số: {students.length} trẻ | Đã chọn: {selectedStudents.length} trẻ
                        </Typography>

                        <DataGrid
                            rows={students}
                            columns={columns}
                            getRowId={(row) => row._id}
                            checkboxSelection
                            disableRowSelectionOnClick
                            disableColumnMenu
                            disableColumnSort
                            paginationModel={paginationModel}
                            onPaginationModelChange={setPaginationModel}
                            pageSizeOptions={[5, 10, 25]}
                            rowSelectionModel={selectedStudents}
                            onRowSelectionModelChange={(newSelection) => setSelectedStudents(newSelection)}
                            autoHeight
                            sx={{
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    fontWeight: 900,
                                },
                                '& .MuiDataGrid-cell': {
                                    borderRight: '1px solid #e0e0e0',
                                },
                                '& .MuiDataGrid-row:hover': {
                                    backgroundColor: '#f5faff',
                                },
                                borderRadius: 2,
                            }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit" size="small">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={submitting || selectedStudents.length === 0}
                >
                    {submitting ? <CircularProgress size={20} color="inherit" /> : `Thêm (${selectedStudents.length})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddStudentsToClassDialog;

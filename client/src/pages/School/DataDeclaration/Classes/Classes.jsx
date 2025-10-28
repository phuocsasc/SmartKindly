import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useEffect, useState } from 'react';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { classApi } from '~/apis/classApi';
import { academicYearApi } from '~/apis/academicYearApi';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import { toast } from 'react-toastify';
import ClassDialog from './ClassesDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ClassesCopyDialog from './ClassesCopyDialog'; // ✅ Import

function Classes() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentClass, setCurrentClass] = useState(null);
    const [openCopyDialog, setOpenCopyDialog] = useState(false); // ✅ Thêm state

    const isActiveYear = selectedYear === activeYearId;

    // Fetch academic years
    const fetchAcademicYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data.data.academicYears;
            setAcademicYears(years);

            // Tìm năm học đang active
            const activeYear = years.find((year) => year.status === 'active');
            if (activeYear) {
                setActiveYearId(activeYear._id);
                setSelectedYear(activeYear._id);
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    // Fetch classes
    const fetchClasses = async () => {
        if (!selectedYear) return;

        try {
            setLoading(true);
            const res = await classApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                academicYearId: selectedYear,
                search: searchText,
            });

            const classesWithStt = res.data.data.classes.map((cls, index) => ({
                ...cls,
                id: cls._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                teacherName: cls.homeRoomTeacher?.fullName || 'Chưa có',
                sessionsDisplay: [
                    cls.sessions?.morning && 'Sáng',
                    cls.sessions?.afternoon && 'Chiều',
                    cls.sessions?.evening && 'Tối',
                ]
                    .filter(Boolean)
                    .join(', '),
            }));

            setRows(classesWithStt);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchClasses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, selectedYear, searchText]);

    // Handlers
    const handleCreate = () => {
        if (selectedYear !== activeYearId) {
            toast.warning('Chỉ có thể thêm lớp học cho năm học đang hoạt động!');
            return;
        }
        setDialogMode('create');
        setCurrentClass(null);
        setOpenDialog(true);
    };

    const handleEdit = (classData) => {
        if (selectedYear !== activeYearId) {
            toast.warning('Chỉ có thể chỉnh sửa lớp học trong năm học đang hoạt động!');
            return;
        }
        setDialogMode('edit');
        setCurrentClass(classData);
        setOpenDialog(true);
    };

    const handleDelete = async (id, className) => {
        if (selectedYear !== activeYearId) {
            toast.warning('Chỉ có thể xóa lớp học trong năm học đang hoạt động!');
            return;
        }

        try {
            await showConfirm({
                title: 'Xác nhận xóa lớp học',
                message: `Bạn có chắc chắn muốn xóa lớp "${className}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                cancelText: 'Hủy',
                onConfirm: async () => {
                    await classApi.delete(id);
                    toast.success('Xóa lớp học thành công!');
                    fetchClasses();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa lớp học!');
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 40, sortable: false },
        {
            field: 'name',
            headerName: 'Tên lớp',
            flex: 1,
            minWidth: 120,
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
            field: 'grade',
            headerName: 'Tên khối',
            flex: 0.5,
            minWidth: 100,
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
            field: 'ageGroup',
            headerName: 'Nhóm lớp',
            flex: 0.8,
            minWidth: 100,
            sortable: false,
        },
        {
            field: 'teacherName',
            headerName: 'Giáo viên chủ nhiệm',
            flex: 1,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'uppercase' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'sessionsDisplay',
            headerName: 'Buổi học',
            flex: 0.8,
            minWidth: 100,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value.split(', ').map((session, index) => (
                        <Chip
                            key={index}
                            label={session}
                            size="small"
                            sx={{
                                bgcolor: '#e0e0e0',
                                color: '#000',
                                fontSize: '0.75rem',
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
            minWidth: 150,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary" noWrap>
                    {params.value || '---'}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const canUpdate = hasPermission(PERMISSIONS.UPDATE_CLASSROOM);
                const canDelete = hasPermission(PERMISSIONS.DELETE_CLASSROOM);
                const isActiveYear = selectedYear === activeYearId;

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {canUpdate && (
                            <Tooltip title={isActiveYear ? 'Sửa thông tin' : 'Chỉ xem'}>
                                <IconButton color="primary" size="small" onClick={() => handleEdit(params.row)}>
                                    <EditOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip title={isActiveYear ? 'Xóa lớp học' : 'Không thể xóa'}>
                                <span>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        disabled={!isActiveYear}
                                        onClick={() => handleDelete(params.row.id, params.row.name)}
                                        sx={{
                                            opacity: isActiveYear ? 1 : 0.5,
                                        }}
                                    >
                                        <DeleteOutlineOutlinedIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                    </Box>
                );
            },
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Khai báo dữ liệu', icon: StorageOutlinedIcon, href: '/#' }, { text: 'Lớp học' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách lớp học
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    '&:hover fieldset': { borderColor: '#0071bc' },
                                    '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                },
                                '& label.Mui-focused': { color: '#0071bc' },
                            }}
                        >
                            {/* Tìm kiếm */}
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm lớp học..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: { xs: '100%', sm: 200 } }}
                            />

                            {/* Chọn năm học */}
                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 200 } }}>
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    label="Năm học"
                                >
                                    {academicYears.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: year.status === 'active' ? 600 : 400,
                                                        color:
                                                            year.status === 'active' ? 'success.main' : 'text.primary',
                                                    }}
                                                >
                                                    {year.fromYear}-{year.toYear}
                                                </Typography>
                                                {year.status === 'active' && (
                                                    <DoneOutlinedIcon color="success" fontSize="small" />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Thêm mới */}
                            {hasPermission(PERMISSIONS.CREATE_CLASSROOM) && (
                                <Tooltip
                                    title={
                                        isActiveYear
                                            ? 'Thêm lớp học mới'
                                            : 'Chỉ được thêm lớp học cho năm học đang hoạt động'
                                    }
                                >
                                    <span>
                                        <IconButton
                                            sx={{
                                                color: isActiveYear ? '#1976d2' : 'grey',
                                                cursor: isActiveYear ? 'pointer' : 'not-allowed',
                                            }}
                                            onClick={handleCreate}
                                            disabled={!isActiveYear}
                                        >
                                            <AddCircleOutlineOutlinedIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                            {/* ✅ Nút Copy từ năm học cũ */}
                            {hasPermission(PERMISSIONS.CREATE_CLASSROOM) && isActiveYear && (
                                <Tooltip title="Copy lớp học từ năm học cũ">
                                    <IconButton sx={{ color: '#764ba2' }} onClick={() => setOpenCopyDialog(true)}>
                                        <ContentCopyIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Thông báo năm học */}
                    {selectedYear && (
                        <Box
                            sx={{
                                mb: 2,
                                p: 1.5,
                                bgcolor: isActiveYear ? '#e8f5e9' : '#fff3e0',
                                borderRadius: 1,
                                border: `1px solid ${isActiveYear ? '#4caf50' : '#ff9800'}`,
                            }}
                        >
                            <Typography variant="body2" color={isActiveYear ? 'success.main' : 'warning.main'}>
                                {isActiveYear ? (
                                    <>
                                        <strong>Năm học đang hoạt động</strong>
                                    </>
                                ) : (
                                    <>
                                        <strong>Năm học đã kết thúc</strong>
                                    </>
                                )}
                            </Typography>
                        </Box>
                    )}

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        disableColumnMenu
                        disableRowSelectionOnClick
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[5, 10, 25, 50]}
                        rowCount={totalRows}
                        autoHeight
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
                                        {selectedYear ? 'Chưa có lớp nào' : 'Vui lòng chọn năm học'}
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
                        slotProps={{
                            pagination: {
                                labelRowsPerPage: 'Số dòng mỗi trang:',
                                labelDisplayedRows: ({ from, to, count }) =>
                                    `${from} - ${to} của ${count !== -1 ? count : `hơn ${to}`}`,
                            },
                        }}
                    />
                </Paper>
            </PageContainer>

            {/* Dialog Create/Edit Class */}
            <ClassDialog
                open={openDialog}
                mode={dialogMode}
                classData={currentClass}
                academicYearId={selectedYear}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchClasses();
                }}
            />

            {/* ✅ Dialog Copy từ năm học cũ */}
            <ClassesCopyDialog
                open={openCopyDialog}
                currentYearId={activeYearId}
                onClose={() => setOpenCopyDialog(false)}
                onSuccess={() => {
                    fetchClasses();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default Classes;

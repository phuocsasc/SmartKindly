// client/src/pages/Parent/ParentRequest/ParentRequest.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Alert,
    Chip,
    Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    AddCircleOutline as AddIcon,
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
    DoneOutlined as DoneIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentRequestApi, parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import ParentRequestDialog from './ParentRequestDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';

function ParentRequest() {
    const { user } = useUser();
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentRequest, setCurrentRequest] = useState(null);

    const isActiveYear = selectedYear === activeYearId;

    // ✅ Initialize data
    useEffect(() => {
        initializeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Fetch requests when filters change
    useEffect(() => {
        if (selectedYear) {
            fetchRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, selectedYear, selectedClass, filterStatus]);

    const initializeData = async () => {
        try {
            // Step 1: Load academic years
            const yearRes = await parentChildrenApi.getAcademicYears();
            const yearData = yearRes.data.data;
            setAcademicYears(yearData.academicYears);
            setActiveYearId(yearData.activeYearId);

            const yearId =
                yearData.activeYearId || (yearData.academicYears.length > 0 ? yearData.academicYears[0]._id : null);
            if (!yearId) return;
            setSelectedYear(yearId);

            // Step 2: Load classes - ✅ Tự động chọn lớp hiện tại
            const classRes = await parentChildrenApi.getStudentClassesByYear(yearId);
            const classList = classRes.data.data.classes || [];
            setClasses(classList);

            if (classList.length > 0) {
                setSelectedClass(classList[0]._id); // ✅ Mặc định lớp đầu tiên (lớp hiện tại)
            }
        } catch (error) {
            console.error('❌ Error initializing data:', error);
            toast.error('Không thể tải dữ liệu ban đầu');
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                academicYearId: selectedYear,
                status: filterStatus,
            };

            const res = await parentRequestApi.getMyRequests(params);
            const data = res.data.data;

            const requests = data.items.map((item, index) => ({
                id: item._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                requestName: item.requestName,
                fromDate: item.fromDate,
                toDate: item.toDate,
                parentNote: item.parentNote,
                teacherReply: item.teacherReply,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                classId: item.classId?._id,
                className: item.classId?.name,
                academicYearId: item.academicYearId?._id,
                yearStatus: item.academicYearId?.status,
            }));

            setRows(requests);
            setTotalRows(data.pagination.totalItems);
        } catch (error) {
            console.error('❌ Error fetching requests:', error);
            toast.error(error?.response?.data?.message || 'Không thể tải danh sách phiếu dặn dò');
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = async (newYearId) => {
        setSelectedYear(newYearId);
        setSelectedClass('');

        try {
            const classRes = await parentChildrenApi.getStudentClassesByYear(newYearId);
            const classList = classRes.data.data.classes || [];
            setClasses(classList);

            // ✅ Tự động chọn lớp đầu tiên
            if (classList.length > 0) {
                setSelectedClass(classList[0]._id);
            }
        } catch (error) {
            console.error('❌ Error fetching classes:', error);
            setClasses([]);
        }
    };

    const handleCreate = () => {
        setDialogMode('create');
        setCurrentRequest(null);
        setOpenDialog(true);
    };

    const handleEdit = async (id) => {
        try {
            const res = await parentRequestApi.getDetails(id);
            setCurrentRequest(res.data.data);
            setDialogMode('edit');
            setOpenDialog(true);
        } catch (error) {
            toast.error('Không thể tải thông tin phiếu dặn dò');
        }
    };

    const handleDelete = (id, requestName) => {
        showConfirm({
            title: 'Xác nhận xóa phiếu dặn dò',
            message: `Bạn có chắc chắn muốn xóa phiếu "${requestName}"?`,
            severity: 'error',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            onConfirm: async () => {
                try {
                    await parentRequestApi.delete(id);
                    toast.success('Xóa phiếu dặn dò thành công!');
                    fetchRequests();
                } catch (error) {
                    toast.error(error?.response?.data?.message || 'Không thể xóa phiếu dặn dò');
                }
            },
        });
    };

    const getStatusChipProps = (status) => {
        switch (status) {
            case 'Chờ duyệt':
                return { color: 'warning', label: 'Chờ duyệt' };
            case 'Đã duyệt':
                return { color: 'success', label: 'Đã duyệt' };
            case 'Từ chối':
                return { color: 'error', label: 'Từ chối' };
            default:
                return { color: 'default', label: status };
        }
    };

    // ✅ Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false, align: 'center' },
        {
            field: 'requestName',
            headerName: 'Tên phiếu',
            flex: 1.2,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'dateRange',
            headerName: 'Ngày áp dụng',
            flex: 1,
            minWidth: 180,
            sortable: false,
            align: 'center',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                    <Chip
                        label={`Từ: ${dayjs(params.row.fromDate).format('DD/MM/YYYY')}`}
                        size="small"
                        sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontSize: '0.75rem' }}
                    />
                    <Chip
                        label={`Đến: ${dayjs(params.row.toDate).format('DD/MM/YYYY')}`}
                        size="small"
                        sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontSize: '0.75rem' }}
                    />
                </Box>
            ),
        },
        {
            field: 'parentNote',
            headerName: 'Dặn dò từ phụ huynh',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'pre-line',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'teacherReply',
            headerName: 'Phản hồi từ giáo viên',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'pre-line',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        color: params.value ? 'text.primary' : 'text.disabled',
                        fontStyle: params.value ? 'normal' : 'italic',
                    }}
                >
                    {params.value || 'Chưa có phản hồi'}
                </Typography>
            ),
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 120,
            sortable: false,
            align: 'center',
            renderCell: (params) => {
                const props = getStatusChipProps(params.value);
                return <Chip {...props} size="small" sx={{ fontWeight: 400 }} />;
            },
        },
        {
            field: 'createdAt',
            headerName: 'Ngày tạo',
            width: 110,
            sortable: false,
            renderCell: (params) => dayjs(params.value).format('DD/MM/YYYY'),
        },
        {
            field: 'updatedAt',
            headerName: 'Ngày sửa',
            width: 110,
            sortable: false,
            renderCell: (params) =>
                params.value
                    ? dayjs(params.value).format('DD/MM/YYYY')
                    : dayjs(params.row.createdAt).format('DD/MM/YYYY'),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 100,
            sortable: false,
            align: 'center',
            renderCell: (params) => {
                const canEdit = params.row.status === 'Chờ duyệt' && isActiveYear;
                const canDelete = params.row.status === 'Chờ duyệt' && isActiveYear;

                return (
                    <Box>
                        <Tooltip title={canEdit ? 'Chỉnh sửa' : 'Chỉ sửa được phiếu "Chờ duyệt"'}>
                            <span>
                                <IconButton
                                    size="small"
                                    sx={{ color: '#0071bc' }} // ✅ Đổi màu icon Edit thành #0071bc
                                    disabled={!canEdit}
                                    onClick={() => handleEdit(params.row.id)}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={canDelete ? 'Xóa' : 'Chỉ xóa được phiếu "Chờ duyệt"'}>
                            <span>
                                <IconButton
                                    size="small"
                                    color="error"
                                    disabled={!canDelete}
                                    onClick={() => handleDelete(params.row.id, params.row.requestName)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Phiếu dặn dò' }]} />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    {/* Header */}
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Danh sách phiếu dặn dò
                    </Typography>

                    {/* Filters */}
                    <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                        {/* Select Năm học */}
                        <Grid item xs={12} sm={3}>
                            <FormControl
                                fullWidth
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                        '&:hover fieldset': { borderColor: '#0071bc' },
                                        '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#0071bc' },
                                    '& .MuiSelect-icon': { color: '#6f6f6f' },
                                }}
                            >
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => handleYearChange(e.target.value)}
                                    label="Năm học"
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                '& .MuiMenuItem-root': {
                                                    '&:hover': { bgcolor: '#e3f2fd', color: '#0071bc' },
                                                    '&.Mui-selected': {
                                                        bgcolor: '#e3f2fd !important',
                                                        color: '#0071bc',
                                                        fontWeight: 700,
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                >
                                    {academicYears.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2">
                                                    {year.fromYear}-{year.toYear}
                                                </Typography>
                                                {year._id === activeYearId && (
                                                    <DoneIcon color="success" fontSize="small" />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Select Lớp học */}
                        {classes.length > 0 && selectedClass && (
                            <Grid item xs={12} sm={3}>
                                <FormControl
                                    fullWidth
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                            '&:hover fieldset': { borderColor: '#0071bc' },
                                            '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#0071bc' },
                                        '& .MuiSelect-icon': { color: '#6f6f6f' },
                                    }}
                                >
                                    <InputLabel>Lớp học</InputLabel>
                                    <Select
                                        value={selectedClass}
                                        label="Lớp học"
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    '& .MuiMenuItem-root': {
                                                        '&:hover': { bgcolor: '#e3f2fd', color: '#0071bc' },
                                                        '&.Mui-selected': {
                                                            bgcolor: '#e3f2fd !important',
                                                            color: '#0071bc',
                                                            fontWeight: 700,
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    >
                                        {classes.map((cls) => (
                                            <MenuItem key={cls._id} value={cls._id}>
                                                {cls.name} - {cls.ageGroup}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {/* Select Trạng thái */}
                        <Grid item xs={12} sm={3}>
                            <FormControl
                                fullWidth
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                        '&:hover fieldset': { borderColor: '#0071bc' },
                                        '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#0071bc' },
                                    '& .MuiSelect-icon': { color: '#6f6f6f' },
                                }}
                            >
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                '& .MuiMenuItem-root': {
                                                    '&:hover': { bgcolor: '#e3f2fd', color: '#0071bc' },
                                                    '&.Mui-selected': {
                                                        bgcolor: '#e3f2fd !important',
                                                        color: '#0071bc',
                                                        fontWeight: 700,
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="Chờ duyệt">Chờ duyệt</MenuItem>
                                    <MenuItem value="Đã duyệt">Đã duyệt</MenuItem>
                                    <MenuItem value="Từ chối">Từ chối</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Button Thêm mới */}
                        <Grid item xs={12} sm={3}>
                            <Tooltip
                                title={
                                    isActiveYear
                                        ? 'Thêm phiếu dặn dò'
                                        : 'Chỉ thêm được phiếu trong năm học đang hoạt động'
                                }
                            >
                                <span>
                                    <IconButton
                                        sx={{
                                            color: '#0071bc', // ✅ Đổi màu nút Thêm mới thành #0071bc
                                            bgcolor: 'rgba(0, 113, 188, 0.08)',
                                            '&:hover': { bgcolor: 'rgba(0, 113, 188, 0.15)' },
                                        }}
                                        disabled={!isActiveYear}
                                        onClick={handleCreate}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Grid>
                    </Grid>

                    {/* Alert */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2, borderRadius: 2 }}>
                            {isActiveYear ? (
                                <>
                                    <strong>Năm học đang hoạt động</strong>
                                </>
                            ) : (
                                <>
                                    <strong>Năm học đã kết thúc</strong> - Chỉ có thể xem dữ liệu
                                </>
                            )}
                        </Alert>
                    )}

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        rowCount={totalRows}
                        pageSizeOptions={[5, 10, 20, 50]}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        autoHeight
                        getRowHeight={() => 'auto'}
                        sx={{
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#e3f2fd',
                                color: '#0071bc', // ✅ Đổi màu header DataGrid
                                fontWeight: 900,
                                borderBottom: '2px solid #bbdefb',
                            },
                            '& .MuiDataGrid-columnHeaderTitle': {
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                            },
                            '& .MuiDataGrid-columnHeader': {
                                borderRight: '1px solid #bbdefb',
                                textAlign: 'center',
                            },
                            '& .MuiDataGrid-cell': {
                                borderRight: '1px solid #e0e0e0',
                                borderBottom: '1px solid #f0f0f0',
                                alignItems: 'center',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                color: '#000',
                                py: 1,
                            },
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: '#f5faff',
                            },
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: 'none',
                        }}
                        localeText={{
                            noRowsLabel: 'Không có dữ liệu',
                            MuiTablePagination: {
                                labelRowsPerPage: 'Số dòng mỗi trang:',
                                labelDisplayedRows: ({ from, to, count }) =>
                                    `${from} - ${to} của ${count !== -1 ? count : `hơn ${to}`}`,
                            },
                        }}
                    />
                </Paper>
            </PageContainer>

            {/* Dialog */}
            <ParentRequestDialog
                open={openDialog}
                mode={dialogMode}
                requestData={currentRequest}
                academicYearId={selectedYear}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchRequests();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default ParentRequest;

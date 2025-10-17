import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Tooltip,
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
import { useEffect, useState } from 'react';
import MainLayout from '~/layouts/MainLayout';
import PageContainer from '~/components/layout/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { academicYearApi } from '~/apis/academicYearApi';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import { toast } from 'react-toastify';
import AcademicYearDialog from './AcademicYearDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';

function AcademicYear() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentAcademicYear, setCurrentAcademicYear] = useState(null);

    // Fetch academic years
    const fetchAcademicYears = async () => {
        try {
            setLoading(true);

            const res = await academicYearApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                status: filterStatus,
            });

            const yearsWithStt = res.data.data.academicYears.map((year, index) => {
                const sem1 = year.semesters?.find((s) => s.name === 'Học kì I') || {};
                const sem2 = year.semesters?.find((s) => s.name === 'Học kì II') || {};

                return {
                    ...year,
                    id: year._id,
                    stt: paginationModel.page * paginationModel.pageSize + index + 1,
                    yearDisplay: `${year.fromYear}-${year.toYear}`,
                    sem1StartDate: sem1.startDate,
                    sem1EndDate: sem1.endDate,
                    sem2StartDate: sem2.startDate,
                    sem2EndDate: sem2.endDate,
                };
            });

            setRows(yearsWithStt);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, filterStatus]);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentAcademicYear(null);
        setOpenDialog(true);
    };

    const handleEdit = (yearData) => {
        setDialogMode('edit');
        setCurrentAcademicYear(yearData);
        setOpenDialog(true);
    };

    const handleDelete = async (id, yearDisplay) => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa năm học',
                message: `Bạn có chắc chắn muốn xóa năm học "${yearDisplay}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                cancelText: 'Hủy',
                onConfirm: async () => {
                    await academicYearApi.delete(id);
                    toast.success('Xóa năm học thành công!');
                    fetchAcademicYears();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa năm học!');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'yearDisplay',
            headerName: 'Năm học',
            flex: 0.8,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'sem1StartDate',
            headerName: 'Ngày bắt đầu HK I',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => formatDate(params.value),
        },
        {
            field: 'sem1EndDate',
            headerName: 'Ngày kết thúc HK I',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => formatDate(params.value),
        },
        {
            field: 'sem2StartDate',
            headerName: 'Ngày bắt đầu HK II',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => formatDate(params.value),
        },
        {
            field: 'sem2EndDate',
            headerName: 'Ngày kết thúc HK II',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => formatDate(params.value),
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 0.9,
            minWidth: 130,
            sortable: false,
            renderCell: (params) => {
                const statusConfig = {
                    active: { label: 'Đang hoạt động', color: 'success' },
                    inactive: { label: 'Không hoạt động', color: 'default' },
                };
                const config = statusConfig[params.value] || statusConfig.inactive;
                return <Chip label={config.label} color={config.color} size="small" />;
            },
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.8,
            minWidth: 100,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const canUpdate = hasPermission(PERMISSIONS.UPDATE_ACADEMIC_YEAR);
                const canDelete = hasPermission(PERMISSIONS.DELETE_ACADEMIC_YEAR);

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {canUpdate && (
                            <Tooltip title="Sửa thông tin">
                                <IconButton color="primary" size="small" onClick={() => handleEdit(params.row)}>
                                    <EditOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip title="Xóa năm học">
                                <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleDelete(params.row.id, params.row.yearDisplay)}
                                >
                                    <DeleteOutlineOutlinedIcon />
                                </IconButton>
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
                {/* ======= BREADCRUMB ======= */}
                <PageBreadcrumb
                    items={[{ text: 'Khai báo dữ liệu', icon: StorageOutlinedIcon, href: '/#' }, { text: 'Năm học' }]}
                />

                {/* ======= Danh sách năm học ======= */}
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* ======= Thanh công cụ ======= */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách năm học
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 150 } }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="active">Đang hoạt động</MenuItem>
                                    <MenuItem value="inactive">Không hoạt động</MenuItem>
                                </Select>
                            </FormControl>

                            {hasPermission(PERMISSIONS.CREATE_ACADEMIC_YEAR) && (
                                <Tooltip title="Thêm năm học">
                                    <IconButton sx={{ color: '#1976d2' }} onClick={handleCreate}>
                                        <AddCircleOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* ======= Bảng Danh sách ======= */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        disableColumnMenu
                        disableColumnSort
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[5, 10, 20, 50]}
                        autoHeight
                        sx={{
                            '& .MuiDataGrid-columnHeader .MuiDataGrid-sortIcon': {
                                display: 'none',
                            },
                            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                                outline: 'none',
                            },
                            '& .MuiDataGrid-row:hover': { cursor: 'pointer', backgroundColor: '#f5f5f5' },
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none !important',
                            },
                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#e3f2fd', fontWeight: 'bold' },
                        }}
                        slots={{
                            noRowsOverlay: () => (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography>Không tìm thấy dữ liệu!</Typography>
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

            {/* Dialog Create/Edit Academic Year */}
            <AcademicYearDialog
                open={openDialog}
                mode={dialogMode}
                academicYear={currentAcademicYear}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchAcademicYears();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default AcademicYear;

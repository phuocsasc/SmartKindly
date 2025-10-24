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
import { useEffect, useState } from 'react';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { departmentApi } from '~/apis/departmentApi';
import { academicYearApi } from '~/apis/academicYearApi';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import { toast } from 'react-toastify';
import DepartmentDialog from './DepartmentDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';

function Department() {
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
    const [currentDepartment, setCurrentDepartment] = useState(null);

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
                setSelectedYear(activeYear._id); // Mặc định chọn năm active
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    // Fetch departments
    const fetchDepartments = async () => {
        if (!selectedYear) return;

        try {
            setLoading(true);
            const res = await departmentApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                academicYearId: selectedYear,
                name: searchText,
            });

            const departmentsWithStt = res.data.data.departments.map((dept, index) => ({
                ...dept,
                id: dept._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                managersDisplay: dept.managers?.map((m) => m.fullName).join(', ') || 'Chưa có',
                academicYearDisplay: `${dept.academicYearId?.fromYear}-${dept.academicYearId?.toYear}`,
            }));

            setRows(departmentsWithStt);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Lỗi khi tải danh sách tổ bộ môn!');
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
            fetchDepartments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, selectedYear, searchText]);

    // Handlers
    const handleCreate = () => {
        if (selectedYear !== activeYearId) {
            toast.warning('Chỉ có thể thêm tổ bộ môn cho năm học đang hoạt động!');
            return;
        }
        setDialogMode('create');
        setCurrentDepartment(null);
        setOpenDialog(true);
    };

    const handleEdit = (deptData) => {
        if (selectedYear !== activeYearId) {
            toast.warning('Chỉ có thể chỉnh sửa tổ bộ môn trong năm học đang hoạt động!');
            return;
        }
        setDialogMode('edit');
        setCurrentDepartment(deptData);
        setOpenDialog(true);
    };

    const handleDelete = async (id, deptName) => {
        if (selectedYear !== activeYearId) {
            toast.warning('Chỉ có thể xóa tổ bộ môn trong năm học đang hoạt động!');
            return;
        }

        try {
            await showConfirm({
                title: 'Xác nhận xóa tổ bộ môn',
                message: `Bạn có chắc chắn muốn xóa tổ bộ môn "${deptName}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                cancelText: 'Hủy',
                onConfirm: async () => {
                    await departmentApi.delete(id);
                    toast.success('Xóa tổ bộ môn thành công!');
                    fetchDepartments();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa tổ bộ môn!');
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'name',
            headerName: 'Tên tổ bộ môn',
            flex: 1.5,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        fontWeight: 600,
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                    }}
                />
            ),
        },
        {
            field: 'managersDisplay',
            headerName: 'Cán bộ quản lý',
            flex: 2,
            minWidth: 200,
            sortable: false,
        },
        {
            field: 'note',
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
            flex: 0.8,
            minWidth: 100,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const canUpdate = hasPermission(PERMISSIONS.UPDATE_DEPARTMENT);
                const canDelete = hasPermission(PERMISSIONS.DELETE_DEPARTMENT);
                const isActiveYear = selectedYear === activeYearId;

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {canUpdate && (
                            <Tooltip title={isActiveYear ? 'Sửa thông tin' : 'Chỉ xem'}>
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => handleEdit(params.row)}
                                    sx={{
                                        opacity: isActiveYear ? 1 : 0.5,
                                    }}
                                >
                                    <EditOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip
                                title={
                                    isActiveYear ? 'Xóa tổ bộ môn' : 'Không thể xóa tổ bộ môn của năm học đã kết thúc'
                                }
                            >
                                <span>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        disabled={!isActiveYear}
                                        onClick={() => handleDelete(params.row.id, params.row.name)}
                                        sx={{
                                            opacity: isActiveYear ? 1 : 0.5,
                                            cursor: isActiveYear ? 'pointer' : 'not-allowed',
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

    const isActiveYear = selectedYear === activeYearId;

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* Breadcrumb */}
                <PageBreadcrumb
                    items={[{ text: 'Khai báo dữ liệu', icon: StorageOutlinedIcon, href: '/#' }, { text: 'Tổ bộ môn' }]}
                />

                {/* Page Content */}
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách tổ bộ môn
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Tìm kiếm */}
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm tổ bộ môn..."
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
                                                    <Chip label="Đang hoạt động" color="success" size="small" />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Thêm mới */}
                            {hasPermission(PERMISSIONS.CREATE_DEPARTMENT) && (
                                <Tooltip
                                    title={
                                        isActiveYear
                                            ? 'Thêm tổ bộ môn mới'
                                            : 'Chỉ được thêm tổ bộ môn cho năm học đang hoạt động'
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
                                        📌 <strong>Năm học đang hoạt động:</strong> Bạn có thể thêm, sửa, xóa tổ bộ môn.
                                    </>
                                ) : (
                                    <>
                                        👁️ <strong>Chế độ xem:</strong> Năm học đã kết thúc, chỉ được xem dữ liệu.
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
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid #f0f0f0',
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
                                        {selectedYear ? 'Chưa có tổ bộ môn nào' : 'Vui lòng chọn năm học'}
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

            {/* Dialog Create/Edit Department */}
            <DepartmentDialog
                open={openDialog}
                mode={dialogMode}
                department={currentDepartment}
                academicYearId={selectedYear}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchDepartments();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default Department;

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Tooltip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Chip,
    Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenManagementApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import ChildrenManagementDialog from './ChildrenManagementDialog';
import dayjs from '~/config/dayjsConfig';
import ImportChildrenManagementDialog from './ImportChildrenManagementDialog';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { exportChildrenManagementToExcel } from '~/utils/childrenManagementExcelExport';
import { schoolApi } from '~/apis/schoolApi';

function ChildrenManagement() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('Đang học'); // ✅ Mặc định "Đang học"
    const [filterHasClass, setFilterHasClass] = useState(''); // '' | 'true' | 'false'
    const [filterAgeGroup, setFilterAgeGroup] = useState(''); // ✅ THÊM: Bộ lọc nhóm tuổi
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentChild, setCurrentChild] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    // Check permissions
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_MANAGEMENT);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_MANAGEMENT);
    const canDelete = hasPermission(PERMISSIONS.DELETE_CHILDREN_MANAGEMENT);

    // ✅ Constants cho age groups
    const AGE_GROUPS = [
        { value: '12-24 tháng', label: '12-24 tháng' },
        { value: '24-36 tháng', label: '24-36 tháng' },
        { value: '3-4 tuổi', label: '3-4 tuổi' },
        { value: '4-5 tuổi', label: '4-5 tuổi' },
        { value: '5-6 tuổi', label: '5-6 tuổi' },
    ];

    // Fetch children
    const fetchChildren = async () => {
        try {
            setLoading(true);
            const res = await childrenManagementApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: searchText,
                status: filterStatus,
                hasClass: filterHasClass,
                ageGroup: filterAgeGroup, // ✅ THÊM param
            });

            const children = res.data.data.children.map((child, index) => ({
                ...child,
                id: child._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                birthDateFormatted: child.birthDate ? dayjs(child.birthDate).format('DD/MM/YYYY') : '---',
                enrollmentDateFormatted: child.enrollmentDate
                    ? dayjs(child.enrollmentDate).format('DD/MM/YYYY')
                    : '---',
            }));

            setRows(children);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching children:', error);
            toast.error('Lỗi khi tải danh sách trẻ toàn trường!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChildren();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, searchText, filterStatus, filterHasClass, filterAgeGroup]);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentChild(null);
        setOpenDialog(true);
    };

    const handleEdit = (childData) => {
        setDialogMode('edit');
        setCurrentChild(childData);
        setOpenDialog(true);
    };

    const handleDelete = async (id, fullName, status) => {
        if (status === 'Đang học') {
            toast.error(`Không thể xóa trẻ "${fullName}" đang có trạng thái "Đang học"!`);
            return;
        }

        showConfirm({
            title: 'Xác nhận xóa',
            message: `Bạn có chắc chắn muốn xóa trẻ "${fullName}"?`,
            severity: 'error',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            onConfirm: async () => {
                try {
                    await childrenManagementApi.delete(id);
                    toast.success('Xóa thành công!');
                    fetchChildren();
                    setSelectedRows([]); // Clear selection
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa!');
                }
            },
        });
    };

    const handleDeleteMany = async () => {
        if (selectedRows.length === 0) {
            toast.warning('Vui lòng chọn ít nhất 1 trẻ để xóa!');
            return;
        }

        // Kiểm tra xem có trẻ nào đang học không
        const selectedChildren = rows.filter((row) => selectedRows.includes(row.id));
        const activeChildren = selectedChildren.filter((child) => child.status === 'Đang học');

        if (activeChildren.length > 0) {
            const activeNames = activeChildren.map((c) => c.fullName).join(', ');
            toast.error(`Không thể xóa ${activeChildren.length} trẻ đang có trạng thái "Đang học": ${activeNames}`);
            return;
        }

        showConfirm({
            title: 'Xác nhận xóa nhiều',
            message: `Bạn có chắc chắn muốn xóa ${selectedRows.length} trẻ đã chọn?`,
            severity: 'error',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            onConfirm: async () => {
                try {
                    await childrenManagementApi.deleteMany(selectedRows);
                    toast.success(`Đã xóa thành công ${selectedRows.length} trẻ!`);
                    fetchChildren();
                    setSelectedRows([]);
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa!');
                }
            },
        });
    };

    // ✅ Export Excel
    const handleExportExcel = async () => {
        try {
            setExportLoading(true);

            // Get all children (no pagination)
            const res = await childrenManagementApi.getAll({
                page: 1,
                limit: 9999,
                search: searchText,
                status: filterStatus,
                hasClass: filterHasClass,
            });

            // Get school info
            const schoolRes = await schoolApi.getSchoolInfo();
            const schoolName = schoolRes.data.data.name;

            // Export
            await exportChildrenManagementToExcel(res.data.data.children, schoolName);

            toast.success('Xuất file Excel thành công!');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            toast.error('Lỗi khi xuất file Excel!');
        } finally {
            setExportLoading(false);
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
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
            flex: 0.8,
            minWidth: 140,
            sortable: false,
        },
        {
            field: 'birthDateFormatted',
            headerName: 'Ngày sinh',
            flex: 0.6,
            minWidth: 120,
            sortable: false,
        },
        {
            field: 'gender',
            headerName: 'Giới tính',
            flex: 0.4,
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
            field: 'status',
            headerName: 'Trạng thái',
            flex: 0.6,
            minWidth: 80,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value === 'Đang học' ? 'success' : 'default'}
                    sx={{ fontWeight: 500 }}
                />
            ),
        },
        {
            field: 'currentAgeGroup',
            headerName: 'Nhóm tuổi hiện tại',
            flex: 0.8,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => <Typography variant="body2">{params.value || 'Chưa có'}</Typography>,
        },
        {
            field: 'currentClassName',
            headerName: 'Lớp học hiện tại',
            flex: 0.8,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => <Typography variant="body2">{params.value || 'Chưa có'}</Typography>,
        },
        {
            field: 'hasClass',
            headerName: 'Đã có lớp',
            flex: 0.6,
            minWidth: 100,
            sortable: false,
            align: 'center',
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Đã có' : 'Chưa có'}
                    size="small"
                    color={params.value ? 'primary' : 'default'}
                    variant={params.value ? 'filled' : 'outlined'}
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    {canUpdate && (
                        <Tooltip title="Sửa thông tin">
                            <IconButton color="primary" size="small" onClick={() => handleEdit(params.row)}>
                                <EditOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title={params.row.status === 'Đang học' ? 'Không thể xóa trẻ đang học' : 'Xóa'}>
                            <span>
                                <IconButton
                                    color="error"
                                    size="small"
                                    disabled={params.row.status === 'Đang học'}
                                    onClick={() => handleDelete(params.row.id, params.row.fullName, params.row.status)}
                                >
                                    <DeleteOutlineOutlinedIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Quản lý trẻ em', icon: PeopleIcon, href: '#' },
                        { text: 'Danh sách trẻ toàn trường' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách trẻ toàn trường
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            {/* Search */}
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mã HS..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: 220 }}
                            />

                            {/* Filter Status */}
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="Đang học">Đang học</MenuItem>
                                    <MenuItem value="Nghỉ học">Nghỉ học</MenuItem>
                                </Select>
                            </FormControl>
                            {/* Filter Age Group */}
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Nhóm tuổi</InputLabel>
                                <Select
                                    value={filterAgeGroup}
                                    onChange={(e) => setFilterAgeGroup(e.target.value)}
                                    label="Nhóm tuổi"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {AGE_GROUPS.map((group) => (
                                        <MenuItem key={group.value} value={group.value}>
                                            {group.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Filter Has Class */}
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Đã có lớp</InputLabel>
                                <Select
                                    value={filterHasClass}
                                    onChange={(e) => setFilterHasClass(e.target.value)}
                                    label="Đã có lớp"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="true">Đã có</MenuItem>
                                    <MenuItem value="false">Chưa có</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Delete Many Button */}
                            {canDelete && selectedRows.length > 0 && (
                                <Tooltip title="Xóa các trẻ đã chọn">
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="medium"
                                        sx={{ py: 1 }}
                                        startIcon={<DeleteSweepOutlinedIcon />}
                                        onClick={handleDeleteMany}
                                    >
                                        Xóa ({selectedRows.length})
                                    </Button>
                                </Tooltip>
                            )}

                            {/* Create Button */}
                            {canCreate && (
                                <Tooltip title="Thêm trẻ mới">
                                    <IconButton sx={{ color: '#1976d2' }} onClick={handleCreate}>
                                        <AddCircleOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* Import Button */}
                            {canCreate && (
                                <Tooltip title="Nhập dữ liệu từ Excel">
                                    <IconButton sx={{ color: '#f57c00' }} onClick={() => setOpenImportDialog(true)}>
                                        <FileUploadOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* Export Button */}
                            <Tooltip title="Xuất file Excel">
                                <IconButton
                                    sx={{ color: '#2e7d32' }}
                                    onClick={handleExportExcel}
                                    disabled={exportLoading}
                                >
                                    {exportLoading ? (
                                        <CircularProgress size={24} sx={{ color: '#2e7d32' }} />
                                    ) : (
                                        <FileDownloadOutlinedIcon />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        checkboxSelection={canDelete}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        disableColumnSort
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[5, 10, 25, 50]}
                        rowSelectionModel={selectedRows}
                        onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
                        autoHeight
                        sx={{
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
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

            {/* Dialog Create/Edit */}
            <ChildrenManagementDialog
                open={openDialog}
                mode={dialogMode}
                childData={currentChild}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchChildren();
                }}
            />

            {/* Import Dialog */}
            <ImportChildrenManagementDialog
                open={openImportDialog}
                onClose={() => setOpenImportDialog(false)}
                onSuccess={() => {
                    setOpenImportDialog(false);
                    fetchChildren();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default ChildrenManagement;

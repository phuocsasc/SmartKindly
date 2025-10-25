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
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useEffect, useState } from 'react';
import AdminLayout from '~/layouts/AdminLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { schoolApi } from '~/apis/schoolApi';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import { toast } from 'react-toastify';
import AdminSchoolDialog from './AdminSchoolDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';

function AdminSchoolManagement() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'
    const [currentSchool, setCurrentSchool] = useState(null);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 1000);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Fetch schools
    const fetchSchools = async () => {
        try {
            setLoading(true);

            const res = await schoolApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                status: filterStatus,
            });

            const schoolsWithStt = res.data.data.schools.map((school, index) => ({
                ...school,
                id: school._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
            }));

            setRows(schoolsWithStt);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching schools:', error);
            toast.error('Lỗi khi tải danh sách trường học!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterStatus]);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentSchool(null);
        setOpenDialog(true);
    };

    const handleEdit = (schoolData) => {
        setDialogMode('edit');
        setCurrentSchool(schoolData);
        setOpenDialog(true);
    };

    const handleDelete = async (id, schoolName, schoolStatus) => {
        // ✅ Kiểm tra trạng thái trước khi cho phép xóa
        if (schoolStatus === true) {
            toast.warning(
                'Không thể xóa trường đang hoạt động! Vui lòng chuyển sang trạng thái "Không hoạt động" trước khi xóa.',
                {
                    autoClose: 5000, // Hiển thị lâu hơn để admin đọc rõ
                },
            );
            return;
        }

        try {
            await showConfirm({
                title: 'Xác nhận xóa trường học',
                message: `Bạn có chắc chắn muốn xóa trường "${schoolName}"?\n\nHành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan đến trường này.`,
                severity: 'error',
                confirmText: 'Xóa',
                cancelText: 'Hủy',
                onConfirm: async () => {
                    try {
                        await schoolApi.delete(id);
                        toast.success('Xóa trường học thành công!');
                        fetchSchools();
                    } catch (error) {
                        // ✅ Hiển thị message từ backend
                        const errorMessage =
                            error.response?.data?.message ||
                            'Lỗi khi xóa trường học! Vui lòng kiểm tra lại trạng thái.';
                        toast.error(errorMessage);
                    }
                },
            });
        } catch (error) {
            // ✅ Xử lý lỗi khi showConfirm bị từ chối
            if (error && error.response) {
                const errorMessage = error.response?.data?.message || 'Lỗi khi xóa trường học!';
                toast.error(errorMessage);
            }
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
        { field: 'name', headerName: 'Tên trường', flex: 1.5, minWidth: 200, sortable: false },
        { field: 'manager', headerName: 'Hiệu trưởng', flex: 1, minWidth: 150, sortable: false },
        { field: 'phone', headerName: 'Số điện thoại', flex: 0.9, minWidth: 120, sortable: false }, // ✅ Thêm cột mới
        { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 180, sortable: false },
        {
            field: 'createdAt',
            headerName: 'Ngày tạo',
            flex: 0.8,
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
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Hoạt động' : 'Không hoạt động'}
                    color={params.value ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.6,
            minWidth: 100,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const canUpdate = hasPermission(PERMISSIONS.ADMIN_MANAGE_SCHOOLS);
                const canDelete = hasPermission(PERMISSIONS.ADMIN_MANAGE_SCHOOLS);
                const isActive = params.row.status === true;

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
                            <Tooltip title={isActive ? 'Không thể xóa trường đang hoạt động' : 'Xóa trường học'}>
                                <span>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        onClick={() => handleDelete(params.row.id, params.row.name, params.row.status)}
                                        sx={{
                                            opacity: isActive ? 0.5 : 1,
                                            cursor: isActive ? 'not-allowed' : 'pointer',
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
        <AdminLayout user={user}>
            <PageContainer>
                {/* ======= BREADCRUMB ======= */}
                <PageBreadcrumb items={[{ text: 'Quản lý trường học' }]} />

                {/* ======= Danh sách trường học ======= */}
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* ======= Thanh công cụ ======= */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách trường học
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: { xs: '100%', sm: 250, md: 350 } }}
                            />

                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 150 } }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="true">Hoạt động</MenuItem>
                                    <MenuItem value="false">Không hoạt động</MenuItem>
                                </Select>
                            </FormControl>

                            {hasPermission(PERMISSIONS.ADMIN_MANAGE_SCHOOLS) && (
                                <Tooltip title="Thêm trường học">
                                    <IconButton sx={{ color: '#1976d2' }} onClick={handleCreate}>
                                        <AddCircleOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* ======= Bảng Danh sách trường học ======= */}
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
                            // 💠 HEADER STYLE
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#e3f2fd', // ✅ xanh biển nhạt
                                color: '#1976d2', // ✅ chữ xanh đậm
                                fontWeight: 900,
                                borderBottom: '2px solid #bbdefb', // ✅ viền dưới header
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

            {/* Dialog Create/Edit School */}
            <AdminSchoolDialog
                open={openDialog}
                mode={dialogMode}
                school={currentSchool}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchSchools();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </AdminLayout>
    );
}

export default AdminSchoolManagement;

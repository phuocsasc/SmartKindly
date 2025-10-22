// client/src/pages/Users/UserManagement.jsx
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
import StarIcon from '@mui/icons-material/Star';
import { useEffect, useState } from 'react';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { userApi } from '~/apis/userApi';
import { ROLE_CONFIG, ROLE_DISPLAY, PERMISSIONS } from '~/config/roleConfig';
import { ROLES } from '~/config/rbacConfig';

import { usePermission } from '~/hooks/usePermission';
import { toast } from 'react-toastify';
import UserDialog from './UserDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';

function UserManagement() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });
    const [totalRows, setTotalRows] = useState(0);
    const [roleStats, setRoleStats] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentUser, setCurrentUser] = useState(null);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 1000);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);

            const res = await userApi.getAllUsers({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                role: filterRole,
                status: filterStatus,
            });

            const usersWithStt = res.data.data.users.map((user, index) => ({
                ...user,
                id: user._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
            }));

            setRows(usersWithStt);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Lỗi khi tải danh sách người dùng!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterRole, filterStatus]);

    // Fetch thống kê tổng số người dùng theo vai trò (không phân trang)
    const fetchRoleStats = async () => {
        try {
            const stats = {};

            // Gọi API để lấy tổng số cho từng role
            for (const role of Object.keys(ROLE_CONFIG)) {
                const res = await userApi.getAllUsers({
                    page: 1,
                    limit: 1, // Chỉ cần lấy pagination info, không cần data
                    role: role,
                    search: '',
                    status: '',
                });
                stats[role] = res.data.data.pagination.totalItems;
            }

            setRoleStats(stats);
        } catch (error) {
            console.error('Error fetching role stats:', error);
        }
    };

    // Fetch stats khi component mount hoặc khi có thay đổi data
    useEffect(() => {
        fetchRoleStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentUser(null);
        setOpenDialog(true);
    };

    const handleEdit = (userData) => {
        setDialogMode('edit');
        setCurrentUser(userData);
        setOpenDialog(true);
    };

    // ✅ Xóa 1 user - CẬP NHẬT
    const handleDelete = async (id) => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa người dùng',
                message: `Bạn có chắc chắn muốn xóa người dùng này?`,
                severity: 'error',
                confirmText: 'Xóa',
                onConfirm: async () => {
                    try {
                        await userApi.deleteUser(id);
                        toast.success('Xóa người dùng thành công!');
                        fetchUsers();
                        fetchRoleStats();
                    } catch (deleteError) {
                        // ✅ Hiển thị lỗi chi tiết từ backend
                        const errorMessage = deleteError?.response?.data?.message || 'Lỗi khi xóa người dùng!';
                        toast.error(errorMessage);
                        console.error('Delete user error:', deleteError);
                    }
                },
            });
        } catch (error) {
            // ✅ Lỗi khi mở confirm dialog
            console.error('Error showing confirm dialog:', error);
        }
    };

    // ✅ Xóa nhiều users - CẬP NHẬT
    const handleDeleteMany = async () => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa nhiều người dùng',
                message: `Bạn có chắc chắn muốn xóa ${selectedRows.length} người dùng đã chọn?`,
                severity: 'error',
                confirmText: 'Xóa tất cả',
                onConfirm: async () => {
                    try {
                        await userApi.deleteManyUsers(selectedRows);
                        toast.success(`Xóa ${selectedRows.length} người dùng thành công!`);
                        setSelectedRows([]);
                        fetchUsers();
                        fetchRoleStats();
                    } catch (deleteError) {
                        // ✅ Hiển thị lỗi chi tiết từ backend
                        const errorMessage = deleteError?.response?.data?.message || 'Lỗi khi xóa người dùng!';
                        toast.error(errorMessage);
                        console.error('Delete many users error:', deleteError);
                    }
                },
            });
        } catch (error) {
            // ✅ Lỗi khi mở confirm dialog
            console.error('Error showing confirm dialog:', error);
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 40, sortable: false },
        { field: 'username', headerName: 'Tên tài khoản', flex: 1, minWidth: 120, sortable: false },
        { field: 'fullName', headerName: 'Họ tên', flex: 1.2, minWidth: 140, sortable: false },
        { field: 'gender', headerName: 'Giới tính', flex: 0.6, minWidth: 90, sortable: false },
        { field: 'email', headerName: 'Email', flex: 0.6, minWidth: 180, sortable: false },
        { field: 'phone', headerName: 'Số điện thoại', flex: 0.6, minWidth: 120, sortable: false },
        {
            field: 'role',
            headerName: 'Vai trò',
            flex: 1.0,
            minwidth: 150,
            sortable: false,
            renderCell: (params) => {
                const roleConfig = ROLE_CONFIG[params.value] || {};
                const isRoot = params.row.isRoot && params.value === 'ban_giam_hieu';

                return (
                    <Tooltip title={isRoot ? 'Ban giám hiệu Root - Quyền cao nhất trong trường' : ''} arrow>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Chip
                                label={ROLE_DISPLAY[params.value]}
                                size="small"
                                sx={{
                                    bgcolor: roleConfig.bgColor,
                                    color: roleConfig.color,
                                    fontWeight: 700,
                                    border: isRoot ? '2px solid #FFD700' : `1px solid ${roleConfig.color}`,
                                    boxShadow: isRoot ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        boxShadow: isRoot ? '0 0 12px rgba(255, 215, 0, 0.6)' : 'none',
                                    },
                                }}
                            />

                            {isRoot && (
                                <StarIcon
                                    sx={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        fontSize: 16,
                                        color: '#FFD700',
                                        filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))',
                                        transform: 'rotate(-15deg)',
                                    }}
                                />
                            )}
                        </Box>
                    </Tooltip>
                );
            },
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 0.9,
            minwidth: 130,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Kích hoạt' : 'Vô hiệu hóa'}
                    color={params.value ? 'success' : 'error'}
                    size="small"
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.6,
            minwidth: 100,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const isDisabled = selectedRows.length >= 2;
                const canUpdate = hasPermission(PERMISSIONS.UPDATE_USER);
                const canDelete = hasPermission(PERMISSIONS.DELETE_USER);

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        {canUpdate && (
                            <Tooltip title={isDisabled ? 'Vui lòng bỏ chọn để sửa' : 'Sửa thông tin'}>
                                <span>
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        disabled={isDisabled}
                                        onClick={() => handleEdit(params.row)}
                                    >
                                        <EditOutlinedIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip title={isDisabled ? 'Vui lòng bỏ chọn để xóa' : 'Xóa người dùng'}>
                                <span>
                                    <IconButton
                                        color="error"
                                        disabled={isDisabled}
                                        onClick={() => handleDelete(params.row.id)}
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
    // ✅ Lọc bỏ role ADMIN khỏi thống kê và filter
    const availableRoles = Object.entries(ROLE_CONFIG).filter(([role]) => role !== ROLES.ADMIN);

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* ======= BREADCRUMB ======= */}
                <PageBreadcrumb items={[{ text: 'Quản lý người dùng' }]} />

                {/* ======= THỐNG KÊ ======= */}
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* ✅ Chỉ hiển thị thống kê cho role ngoại trừ ADMIN */}
                    {availableRoles.map(([role, config]) => {
                        const Icon = config.icon;
                        return (
                            <Paper
                                key={role}
                                elevation={2}
                                sx={{
                                    flex: 1,
                                    minWidth: { xs: 'calc(50% - 8px)', sm: '180px' },
                                    p: 2,
                                    borderRadius: 4,
                                    borderLeft: `10px solid ${config.color}`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {ROLE_DISPLAY[role]}
                                        </Typography>
                                        <Typography variant="h4" fontWeight={700} sx={{ color: config.color }}>
                                            {roleStats[role] || 0}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '50%',
                                            bgcolor: config.bgColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 28, color: config.color }} />
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>

                {/* ======= Danh sách người dùng ======= */}
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* ======= Thanh công cụ trên bảng Danh sách người dùng ======= */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách người dùng
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
                                <InputLabel>Vai trò</InputLabel>
                                <Select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    label="Vai trò"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {/* ✅ Chỉ hiển thị filter cho role ngoại trừ ADMIN */}
                                    {availableRoles.map(([code]) => (
                                        <MenuItem key={code} value={code}>
                                            {ROLE_DISPLAY[code]}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 140 } }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="true">Kích hoạt</MenuItem>
                                    <MenuItem value="false">Vô hiệu hóa</MenuItem>
                                </Select>
                            </FormControl>

                            {hasPermission(PERMISSIONS.CREATE_USER) && (
                                <Tooltip title="Thêm người dùng">
                                    <IconButton
                                        sx={{ color: '#1976d2' }}
                                        onClick={handleCreate}
                                        disabled={selectedRows.length >= 2}
                                    >
                                        <AddCircleOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {hasPermission(PERMISSIONS.DELETE_USER) && selectedRows.length > 0 && (
                                <Tooltip title={`Xóa ${selectedRows.length} người dùng đã chọn`}>
                                    <IconButton color="error" onClick={handleDeleteMany}>
                                        <DeleteOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* ======= Bảng Danh sách người dùng ======= */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        checkboxSelection={hasPermission(PERMISSIONS.DELETE_USER)}
                        disableColumnMenu
                        disableColumnSort
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        onRowSelectionModelChange={setSelectedRows}
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

            {/* Dialog Create/Edit User */}
            <UserDialog
                open={openDialog}
                mode={dialogMode}
                user={currentUser}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchUsers();
                    fetchRoleStats(); // Cập nhật lại thống kê
                }}
            />
            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default UserManagement;

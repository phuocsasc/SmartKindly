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
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import StarIcon from '@mui/icons-material/Star';
import { useEffect, useState } from 'react';
import AdminLayout from '~/layouts/AdminLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { adminUserApi } from '~/apis/adminUserApi';
import { schoolApi } from '~/apis/schoolApi';
import { PERMISSIONS, ROLE_DISPLAY } from '~/config/rbacConfig';
import { ROLE_CONFIG } from '~/config/roleConfig';
import { usePermission } from '~/hooks/usePermission';
import { toast } from 'react-toastify';
import AdminUserDialog from './AdminUserDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';

function AdminUserManagement() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [filterSchool, setFilterSchool] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [stats, setStats] = useState({
        totalActiveSchools: 0, // ✅ Đổi tên để rõ nghĩa
        totalActiveStaff: 0,
        totalActiveParents: 0,
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentUser, setCurrentUser] = useState(null);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 1000);
        return () => clearTimeout(handler);
    }, [searchText]);

    // ✅ Fetch schools - Lấy tất cả trường (bao gồm cả "Không hoạt động")
    const fetchSchools = async () => {
        try {
            // ✅ Không truyền status filter, backend sẽ trả về tất cả trường chưa bị xóa
            const res = await schoolApi.getAll({ page: 1, limit: 1000 });
            setSchools(res.data.data.schools);
        } catch (error) {
            console.error('Error fetching schools:', error);
        }
    };

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);

            const res = await adminUserApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                schoolId: filterSchool,
                role: filterRole,
                status: filterStatus,
            });

            // console.log('📦 Raw API Response:', res.data.data.users[0]); // Debug

            const usersWithStt = res.data.data.users.map((user, index) => {
                const schoolStatus = user.school?.status ?? true;

                // console.log(`👤 User ${user.username}:`, {
                //     schoolName: user.school?.name,
                //     schoolStatus: schoolStatus,
                //     rawSchoolData: user.school,
                // }); // Debug mỗi user

                return {
                    ...user,
                    id: user._id,
                    stt: paginationModel.page * paginationModel.pageSize + index + 1,
                    schoolName: user.school?.name || 'N/A',
                    schoolStatus: schoolStatus, // ✅ Lưu schoolStatus
                };
            });

            // console.log('✅ Processed users:', usersWithStt[0]); // Debug

            setRows(usersWithStt);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Lỗi khi tải danh sách người dùng!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch statistics - Cập nhật logic đếm
    const fetchStats = async () => {
        try {
            // ✅ 1. Tổng số trường "Hoạt động" (status = true)
            const schoolRes = await schoolApi.getAll({ page: 1, limit: 1, status: 'true' });
            const totalActiveSchools = schoolRes.data.data.pagination.totalItems;

            // ✅ 2. Tổng số cán bộ có status = true
            const staffRoles = ['ban_giam_hieu', 'to_truong', 'giao_vien', 'ke_toan'];
            let totalActiveStaff = 0;
            for (const role of staffRoles) {
                const res = await adminUserApi.getAll({ page: 1, limit: 1, role, status: 'true' });
                totalActiveStaff += res.data.data.pagination.totalItems;
            }

            // ✅ 3. Tổng số phụ huynh có status = true
            const parentRes = await adminUserApi.getAll({ page: 1, limit: 1, role: 'phu_huynh', status: 'true' });
            const totalActiveParents = parentRes.data.data.pagination.totalItems;

            setStats({ totalActiveSchools, totalActiveStaff, totalActiveParents });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchSchools();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterSchool, filterRole, filterStatus]);

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

    const handleDelete = async (id, username) => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa người dùng',
                message: `Bạn có chắc chắn muốn xóa người dùng "${username}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                onConfirm: async () => {
                    await adminUserApi.delete(id);
                    toast.success('Xóa người dùng thành công!');
                    fetchUsers();
                    fetchStats();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa người dùng!');
        }
    };

    const handleDeleteMany = async () => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa nhiều người dùng',
                message: `Bạn có chắc chắn muốn xóa ${selectedRows.length} người dùng đã chọn? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa tất cả',
                onConfirm: async () => {
                    await adminUserApi.deleteManyUsers(selectedRows);
                    toast.success(`Xóa ${selectedRows.length} người dùng thành công!`);
                    setSelectedRows([]);
                    fetchUsers();
                    fetchStats();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa người dùng!');
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        { field: 'schoolName', headerName: 'Tên trường', flex: 1.5, minWidth: 200, sortable: false },
        { field: 'username', headerName: 'Tên tài khoản', flex: 1, minWidth: 150, sortable: false },
        { field: 'phone', headerName: 'Số điện thoại', flex: 0.9, minWidth: 120, sortable: false },
        { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 180, sortable: false },
        {
            field: 'role',
            headerName: 'Vai trò',
            flex: 1,
            minWidth: 140,
            sortable: false,
            renderCell: (params) => {
                const roleConfig = ROLE_CONFIG[params.value] || {};
                const isRoot = params.row.isRoot && params.value === 'ban_giam_hieu';

                return (
                    <Tooltip title={isRoot ? 'Ban giám hiệu Root - Quyền cao nhất' : ''} arrow>
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

                            {/* ⭐ Ngôi sao nằm trên góc phải label */}
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
            minWidth: 130,
            sortable: false,
            headerAlign: 'center',
            align: 'center',
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
            minWidth: 100,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const canUpdate = hasPermission(PERMISSIONS.ADMIN_MANAGE_USERS);
                const canDelete = hasPermission(PERMISSIONS.ADMIN_MANAGE_USERS);
                const isDisabled = selectedRows.length >= 2;

                // ✅ Kiểm tra trường có đang hoạt động không
                const isSchoolInactive = params.row.schoolStatus === false;

                // ✅ Debug log
                // console.log(`🔍 Action buttons for ${params.row.username}:`, {
                //     schoolName: params.row.schoolName,
                //     schoolStatus: params.row.schoolStatus,
                //     isSchoolInactive: isSchoolInactive,
                //     willDisable: isDisabled || isSchoolInactive,
                // });

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {canUpdate && (
                            <Tooltip
                                title={
                                    isSchoolInactive
                                        ? 'Không thể sửa - Trường đang không hoạt động'
                                        : isDisabled
                                          ? 'Vui lòng bỏ chọn để sửa'
                                          : 'Sửa thông tin'
                                }
                            >
                                <span>
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        disabled={isDisabled || isSchoolInactive}
                                        onClick={() => {
                                            // console.log('🖱️ Edit clicked:', {
                                            //     user: params.row.username,
                                            //     schoolStatus: params.row.schoolStatus,
                                            //     isSchoolInactive: isSchoolInactive,
                                            // });
                                            if (!isSchoolInactive && !isDisabled) {
                                                handleEdit(params.row);
                                            }
                                        }}
                                        sx={{
                                            opacity: isSchoolInactive ? 0.3 : 1,
                                            cursor: isSchoolInactive ? 'not-allowed' : 'pointer',
                                        }}
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
                                        size="small"
                                        disabled={isDisabled}
                                        onClick={() => handleDelete(params.row.id, params.row.username)}
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
                {/* BREADCRUMB */}
                <PageBreadcrumb items={[{ text: 'Quản lý người dùng hệ thống' }]} />

                {/* ✅ THỐNG KÊ - Cập nhật label */}
                <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Tổng số trường hoạt động */}
                    <Paper
                        elevation={2}
                        sx={{
                            flex: 1,
                            minWidth: { xs: 'calc(50% - 8px)', sm: '200px' },
                            p: 2,
                            borderRadius: 4,
                            borderLeft: '10px solid #1976d2',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Tổng số trường hoạt động
                                </Typography>
                                <Typography variant="h4" fontWeight={700} sx={{ color: '#1976d2' }}>
                                    {stats.totalActiveSchools}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: '50%',
                                    bgcolor: '#e3f2fd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <SchoolIcon sx={{ fontSize: 28, color: '#1976d2' }} />
                            </Box>
                        </Box>
                    </Paper>

                    {/* Tổng số cán bộ kích hoạt */}
                    <Paper
                        elevation={2}
                        sx={{
                            flex: 1,
                            minWidth: { xs: 'calc(50% - 8px)', sm: '200px' },
                            p: 2,
                            borderRadius: 4,
                            borderLeft: '10px solid #2e7d32',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Tổng số cán bộ kích hoạt
                                </Typography>
                                <Typography variant="h4" fontWeight={700} sx={{ color: '#2e7d32' }}>
                                    {stats.totalActiveStaff}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: '50%',
                                    bgcolor: '#e8f5e9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <PeopleIcon sx={{ fontSize: 28, color: '#2e7d32' }} />
                            </Box>
                        </Box>
                    </Paper>

                    {/* Tổng số phụ huynh kích hoạt */}
                    <Paper
                        elevation={2}
                        sx={{
                            flex: 1,
                            minWidth: { xs: 'calc(50% - 8px)', sm: '200px' },
                            p: 2,
                            borderRadius: 4,
                            borderLeft: '10px solid #ed6c02',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Tổng số phụ huynh kích hoạt
                                </Typography>
                                <Typography variant="h4" fontWeight={700} sx={{ color: '#ed6c02' }}>
                                    {stats.totalActiveParents}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: '50%',
                                    bgcolor: '#fff3e0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FamilyRestroomIcon sx={{ fontSize: 28, color: '#ed6c02' }} />
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                {/* Danh sách người dùng */}
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Thanh công cụ */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách người dùng
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                flexWrap: 'wrap' /* ✅ Style chung cho input */,
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
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: { xs: '100%', sm: 200 } }}
                            />

                            {/* ✅ Filter Tên trường - Hiển thị tất cả (bao gồm "Không hoạt động") */}
                            <FormControl size="small" sx={{ minWidth: { xs: '32%', sm: 150 } }}>
                                <InputLabel>Tên trường</InputLabel>
                                <Select
                                    value={filterSchool}
                                    onChange={(e) => setFilterSchool(e.target.value)}
                                    label="Tên trường"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {schools.map((school) => (
                                        <MenuItem key={school._id} value={school.schoolId}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2">{school.name}</Typography>
                                                {/* ✅ Hiển thị badge "Không hoạt động" nếu status = false */}
                                                {!school.status && (
                                                    <Chip
                                                        label="Không hoạt động"
                                                        size="small"
                                                        color="default"
                                                        sx={{
                                                            height: 18,
                                                            fontSize: '0.7rem',
                                                            '& .MuiChip-label': { px: 1 },
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: { xs: '32%', sm: 130 } }}>
                                <InputLabel>Vai trò</InputLabel>
                                <Select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    label="Vai trò"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {Object.entries(ROLE_DISPLAY)
                                        .filter(([code]) => code !== 'admin')
                                        .map(([code, label]) => (
                                            <MenuItem key={code} value={code}>
                                                {label}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: { xs: '32%', sm: 120 } }}>
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

                            {hasPermission(PERMISSIONS.ADMIN_MANAGE_USERS) && (
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
                            {/* ✅ Nút xóa nhiều người dùng */}
                            {hasPermission(PERMISSIONS.ADMIN_MANAGE_USERS) && selectedRows.length > 0 && (
                                <Tooltip title={`Xóa ${selectedRows.length} người dùng đã chọn`}>
                                    <IconButton color="error" onClick={handleDeleteMany}>
                                        <DeleteOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Bảng dữ liệu */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        checkboxSelection={hasPermission(PERMISSIONS.ADMIN_MANAGE_USERS)}
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
                            // 💠 STYLE CHO CHECKBOX
                            '& .MuiCheckbox-root': {
                                color: '#0071bc', // ✅ màu viền và icon mặc định
                                '&.Mui-checked': {
                                    color: '#0071bc', // ✅ màu khi tick
                                },
                                '&:hover': {
                                    backgroundColor: '#aee2ff33', // ✅ hiệu ứng hover nhẹ màu xanh nhạt
                                },
                            },
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
            <AdminUserDialog
                open={openDialog}
                mode={dialogMode}
                user={currentUser}
                schools={schools}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchUsers();
                    fetchStats();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </AdminLayout>
    );
}

export default AdminUserManagement;

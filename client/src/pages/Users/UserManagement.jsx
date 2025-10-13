import {
    Box,
    Typography,
    Paper,
    Breadcrumbs,
    Link,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip,
    TextField,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Home as HomeIcon, Block as BlockIcon, Security as SecurityIcon } from '@mui/icons-material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useEffect, useState } from 'react';
import MainLayout from '~/layouts/MainLayout';
import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';
import { MOCK_USERS } from '~/utils/MockDataUsers';

function UserManagement() {
    const [user, setUser] = useState(null);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 5,
    });
    // DATA
    const [rows, setRows] = useState(MOCK_USERS); // ✅ Fake demo data (16 dòng)
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');

    // Debounce search (1s)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounceSearch(searchText);
        }, 1000);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Filter data
    useEffect(() => {
        const filteredData = MOCK_USERS.filter((item) =>
            Object.values(item).some((value) => String(value).toLowerCase().includes(debounceSearch.toLowerCase())),
        );
        setRows(filteredData);
    }, [debounceSearch]);

    // ✅ Cấu hình cột
    const columns = [
        { field: 'stt', headerName: 'STT', width: 80 },
        { field: 'username', headerName: 'Tên tài khoản', flex: 1 },
        { field: 'fullName', headerName: 'Họ tên', flex: 1.3 },
        { field: 'gender', headerName: 'Giới tính', width: 100 },
        { field: 'email', headerName: 'Email', flex: 1.3 },
        { field: 'phone', headerName: 'Số điện thoại', width: 120 },
        {
            field: 'role',
            headerName: 'Vai trò',
            width: 140,
            renderCell: (params) => <Chip label={params.value} color="primary" variant="outlined" size="small" />,
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 120,
            renderCell: (params) => (
                <Chip label={params.value} color={params.value === 'Kích hoạt' ? 'success' : 'error'} size="small" />
            ),
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 100,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Tooltip title="Sửa thông tin">
                        <IconButton color="primary" size="small">
                            <EditOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    useEffect(() => {
        authorizedAxiosInstance
            .get(`${API_ROOT}/v1/dashboards/access`)
            .then((res) => setUser(res.data))
            .catch((err) => console.error(err));
    }, []);

    if (!user) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    width: '100vw',
                    height: '100vh',
                }}
            >
                <CircularProgress />
                <Typography>Loading user data...</Typography>
            </Box>
        );
    }

    return (
        <MainLayout user={user}>
            <Box sx={{ p: 2 }}>
                {/* Breadcrumb */}
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="/dashboard"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                        }}
                    >
                        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Trang chủ
                    </Link>
                    <Typography color="text.primary">Quản lý người dùng</Typography>
                </Breadcrumbs>

                {/* Bảng người dùng */}
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                    {/* Thanh chức năng */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách người dùng
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />

                            <Tooltip title="Thêm người dùng">
                                <IconButton sx={{ color: '#1976d2' }}>
                                    <AddCircleOutlineOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa người dùng">
                                <IconButton color="error">
                                    <DeleteOutlineOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Vô hiệu hóa">
                                <IconButton color="warning">
                                    <BlockIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Phân quyền">
                                <IconButton color="info">
                                    <SecurityIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        checkboxSelection
                        disableColumnMenu
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[5, 10, 20, rows.length]}
                        autoHeight
                        sx={{
                            '& .MuiDataGrid-row:hover': {
                                cursor: 'pointer',
                                backgroundColor: '#f5f5f5',
                            },
                            '& .MuiDataGrid-cell:focus': {
                                outline: 'none !important',
                            },
                            '& .MuiDataGrid-cell:focus-within': {
                                outline: 'none !important',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#e3f2fd',
                                fontWeight: 'bold',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                backgroundColor: '#f8f9fa',
                            },
                        }}
                        slots={{
                            noRowsOverlay: () => (
                                <Box sx={{ p: 3, textAlign: 'center', color: 'gray' }}>
                                    <Typography>Không tìm thấy dữ liệu phù hợp!</Typography>
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
            </Box>
        </MainLayout>
    );
}

export default UserManagement;

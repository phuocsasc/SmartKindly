// client/src/pages/School/Nutrition/Food/Food.jsx

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
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { schoolFoodApi } from '~/apis/schoolFoodApi';
import { toast } from 'react-toastify';
import FoodDialog from './FoodDialog';
import { usePermission } from '~/hooks/usePermission';
import { PERMISSIONS } from '~/config/rbacConfig';

const FOOD_CATEGORIES = ['Động vật', 'Thực vật', 'Thực phẩm Khô', 'Thực phẩm tươi', 'Thực phẩm ăn liền'];

function Food() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentFood, setCurrentFood] = useState(null);
    const [needSync, setNeedSync] = useState(false); // ✅ NEW
    const [syncing, setSyncing] = useState(false); // ✅ NEW

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 1000);
        return () => clearTimeout(handler);
    }, [searchText]);

    // ✅ Check sync on mount
    useEffect(() => {
        checkSync();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Check nếu cần sync
    const checkSync = async () => {
        try {
            const res = await schoolFoodApi.checkAndSync();
            if (res.data.data.synced) {
                setNeedSync(true);
                toast.info('Đã đồng bộ danh sách thực phẩm từ ngân hàng dữ liệu');
                fetchFoods(); // Fetch lại sau khi sync
            }
        } catch (error) {
            console.error('Error checking sync:', error);
        }
    };

    // ✅ Manual sync - GỌI forceSync thay vì checkAndSync
    const handleManualSync = async () => {
        try {
            setSyncing(true);
            const res = await schoolFoodApi.forceSync(); // ✅ CHANGE HERE

            toast.success(res.data.message);
            fetchFoods(); // Fetch lại sau khi sync
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Lỗi khi đồng bộ dữ liệu!';
            toast.error(errorMsg);
        } finally {
            setSyncing(false);
        }
    };

    // Fetch foods
    const fetchFoods = async () => {
        try {
            setLoading(true);
            const response = await schoolFoodApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                category: filterCategory,
            });

            const data = response.data.data;
            const formattedRows = data.foods.map((food, index) => ({
                id: food._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                name: food.name,
                unitPrice: food.unitPrice,
                unit: food.unit,
                gramConversion: food.gramConversion,
                categories: food.categories,
                wastePercentage: food.wastePercentage,
                protein: food.protein,
                lipid: food.lipid,
                glucid: food.glucid,
                ...food,
            }));

            setRows(formattedRows);
            setTotalRows(data.pagination.totalItems);
            setNeedSync(false); // Reset flag
        } catch (error) {
            console.error('Error fetching foods:', error);
            toast.error('Lỗi khi tải danh sách thực phẩm!');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFoods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterCategory]);

    // Handlers
    const handleEdit = (food) => {
        setCurrentFood(food);
        setOpenDialog(true);
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setCurrentFood(null);
    };

    const handleDialogSuccess = () => {
        fetchFoods();
        handleDialogClose();
    };

    // Columns (same as before)
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'name',
            headerName: 'Tên thực phẩm',
            flex: 1.0,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography sx={{ fontWeight: 500, color: '#000', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'unitPrice',
            headerName: 'Đơn giá (VNĐ)',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                    {params.value.toLocaleString('vi-VN')}
                </Typography>
            ),
        },
        {
            field: 'unit',
            headerName: 'Đơn vị tính',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => <Chip label={params.value} size="small" color="primary" variant="outlined" />,
        },
        {
            field: 'gramConversion',
            headerName: 'Quy đổi sang gam (hoặc ml)',
            width: 180,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => `${params.value}`,
        },
        {
            field: 'categories',
            headerName: 'Loại thực phẩm',
            flex: 1.0,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
                    {params.value.map((category, index) => (
                        <Chip key={index} label={category} size="small" color="default" />
                    ))}
                </Box>
            ),
        },
        {
            field: 'wastePercentage',
            headerName: 'Hệ số thái bỏ (%)',
            width: 160,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => `${params.value}%`,
        },
        {
            field: 'protein',
            headerName: 'Protein (Đạm)',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderHeader: () => (
                <Tooltip title="Thông tin dinh dưỡng (trên 1 gam thực phẩm)" placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                        <Typography variant="body2" fontWeight={700}>
                            Protein (Đạm)
                        </Typography>
                    </Box>
                </Tooltip>
            ),
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'lipid',
            headerName: 'Lipid (Béo)',
            width: 130,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderHeader: () => (
                <Tooltip title="Thông tin dinh dưỡng (trên 1 gam thực phẩm)" placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                        <Typography variant="body2" fontWeight={700}>
                            Lipid (Béo)
                        </Typography>
                    </Box>
                </Tooltip>
            ),
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#ed6c02' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'glucid',
            headerName: 'Glucid (Đường)',
            width: 145,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderHeader: () => (
                <Tooltip title="Thông tin dinh dưỡng (trên 1 gam thực phẩm)" placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                        <Typography variant="body2" fontWeight={700}>
                            Glucid (Đường)
                        </Typography>
                    </Box>
                </Tooltip>
            ),
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#1976d2' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {hasPermission(PERMISSIONS.UPDATE_SCHOOL_INFO) && (
                        <Tooltip title="Sửa">
                            <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
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
                    items={[{ text: 'Dinh dưỡng', icon: RestaurantOutlinedIcon, href: '#' }, { text: 'Thực phẩm' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* ✅ Sync Alert */}
                    {needSync && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Danh sách thực phẩm đã được đồng bộ từ ngân hàng dữ liệu
                        </Alert>
                    )}

                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách thực phẩm
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
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm theo tên..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: { xs: '100%', sm: 250, md: 350 } }}
                            />

                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 200 } }}>
                                <InputLabel>Loại thực phẩm</InputLabel>
                                <Select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    label="Loại thực phẩm"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {FOOD_CATEGORIES.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* ✅ Nút đồng bộ manual */}
                            {hasPermission(PERMISSIONS.UPDATE_SCHOOL_INFO) && (
                                <Tooltip title="Đồng bộ từ ngân hàng dữ liệu">
                                    <IconButton sx={{ color: '#1976d2' }} onClick={handleManualSync} disabled={syncing}>
                                        {syncing ? <CircularProgress size={24} /> : <SyncIcon />}
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

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
                        getRowHeight={() => 'auto'}
                        autoHeight
                        getRowId={(row) => row.id}
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

            {/* Dialog */}
            <FoodDialog
                open={openDialog}
                food={currentFood}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />
        </MainLayout>
    );
}

export default Food;

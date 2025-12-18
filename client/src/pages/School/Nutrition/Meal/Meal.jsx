// client/src/pages/School/Nutrition/Meal/Meal.jsx

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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { schoolMealApi } from '~/apis';
import { toast } from 'react-toastify';
import MealDialog from './MealDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import dayjs from '~/config/dayjsConfig';

const MEAL_TYPES = [
    'Món kho',
    'Món luộc',
    'Món canh',
    'Món mặn',
    'Món xào',
    'Món xế',
    'Soup',
    'Lẩu',
    'Món bánh',
    'Tráng miệng',
];

function Meal() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [filterMealType, setFilterMealType] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentMeal, setCurrentMeal] = useState(null);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 1000);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Fetch meals
    const fetchMeals = async () => {
        try {
            setLoading(true);
            const response = await schoolMealApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                mealType: filterMealType,
            });

            const data = response.data.data;
            const formattedRows = data.meals.map((meal, index) => ({
                id: meal._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                name: meal.name,
                mealType: meal.mealType,
                totalCalories: meal.totalCalories,
                ingredientsCount: meal.ingredients?.length || 0,
                ...meal,
            }));

            setRows(formattedRows);
            setTotalRows(data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching meals:', error);
            toast.error('Lỗi khi tải danh sách món ăn!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterMealType]);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentMeal(null);
        setOpenDialog(true);
    };

    const handleEdit = (meal) => {
        setDialogMode('edit');
        setCurrentMeal(meal);
        setOpenDialog(true);
    };

    const handleDelete = async (id, name) => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa món ăn',
                message: `Bạn có chắc chắn muốn xóa món ăn "${name}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                onConfirm: async () => {
                    await schoolMealApi.delete(id);
                    toast.success('Xóa món ăn thành công!');
                    fetchMeals();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa món ăn!');
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setCurrentMeal(null);
    };

    const handleDialogSuccess = () => {
        fetchMeals();
        handleDialogClose();
    };

    // ✅ Format datetime function
    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        return dayjs(dateString).format('HH:mm:ss | DD/MM/YYYY');
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'name',
            headerName: 'Tên món ăn',
            flex: 1.0,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography sx={{ fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'mealType',
            headerName: 'Loại món ăn',
            minWidth: 250,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#000000ff', fontWeight: 500 }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'ingredientsCount',
            headerName: 'Số nguyên liệu',
            minWidth: 240,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#000000' }}>
                    {params.value} nguyên liệu
                </Typography>
            ),
        },
        {
            field: 'totalCalories',
            headerName: 'Tổng Calo / 1 trẻ',
            minWidth: 260,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                    {params.value.toFixed(2)} kcal
                </Typography>
            ),
        },
        // ✅ CỘT THỜI GIAN TẠO
        {
            field: 'createdAt',
            headerName: 'Thời gian tạo',
            width: 180,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {formatDateTime(params.value)}
                </Typography>
            ),
        },
        // ✅ CỘT THỜI GIAN SỬA
        {
            field: 'updatedAt',
            headerName: 'Thời gian sửa',
            width: 180,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {formatDateTime(params.value)}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {hasPermission(PERMISSIONS.UPDATE_MEAL) && (
                        <Tooltip title="Sửa">
                            <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {hasPermission(PERMISSIONS.DELETE_MEAL) && (
                        <Tooltip title="Xóa">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(params.row.id, params.row.name)}
                            >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
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
                    items={[{ text: 'Dinh dưỡng', icon: RestaurantOutlinedIcon, href: '#' }, { text: 'Món ăn' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách món ăn
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
                                placeholder="Tìm kiếm theo tên món ăn..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: { xs: '100%', sm: 250, md: 350 } }}
                            />

                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 200 } }}>
                                <InputLabel>Loại món ăn</InputLabel>
                                <Select
                                    value={filterMealType}
                                    onChange={(e) => setFilterMealType(e.target.value)}
                                    label="Loại món ăn"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {MEAL_TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {hasPermission(PERMISSIONS.CREATE_MEAL) && (
                                <Tooltip title="Thêm món ăn">
                                    <IconButton sx={{ color: '#1976d2' }} onClick={handleCreate}>
                                        <AddCircleOutlineOutlinedIcon />
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
            <MealDialog
                open={openDialog}
                mode={dialogMode}
                meal={currentMeal}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default Meal;

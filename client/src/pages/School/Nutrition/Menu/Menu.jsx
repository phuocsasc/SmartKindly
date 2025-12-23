import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Tooltip,
    TextField,
    CircularProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
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
import { schoolMenuApi, schoolNutritionalStandardApi } from '~/apis';
import { toast } from 'react-toastify';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import dayjs from '~/config/dayjsConfig';
import MenuDialog from './MenuDialog';

function Menu() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [filterAgeGroup, setFilterAgeGroup] = useState('');
    const [ageGroupOptions, setAgeGroupOptions] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentMenuId, setCurrentMenuId] = useState(null);

    // Permissions
    const canCreate = hasPermission(PERMISSIONS.CREATE_MENU);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_MENU);
    const canDelete = hasPermission(PERMISSIONS.DELETE_MENU);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 500);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Fetch menus
    const fetchMenus = async () => {
        try {
            setLoading(true);
            const response = await schoolMenuApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                ageGroup: filterAgeGroup,
            });

            const data = response.data.data;
            const formattedRows = data.items.map((item, index) => ({
                id: item._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                ...item,
            }));

            setRows(formattedRows);
            setTotalRows(data.pagination.totalItems);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách thực đơn!');
        } finally {
            setLoading(false);
        }
    };

    // Fetch age groups for filter
    const fetchAgeGroups = async () => {
        try {
            const res = await schoolNutritionalStandardApi.getAll({ limit: 100 });
            const uniqueAgeGroups = [...new Set(res.data.data.standards.map((s) => s.ageGroup))];
            setAgeGroupOptions(uniqueAgeGroups);
        } catch (error) {
            console.error('Failed to fetch age groups', error);
        }
    };

    useEffect(() => {
        fetchMenus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterAgeGroup]);

    useEffect(() => {
        fetchAgeGroups();
    }, []);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentMenuId(null);
        setOpenDialog(true);
    };

    const handleEdit = (id) => {
        setDialogMode('edit');
        setCurrentMenuId(id);
        setOpenDialog(true);
    };

    const handleDelete = async (id, name) => {
        showConfirm({
            title: 'Xác nhận xóa thực đơn',
            message: `Bạn có chắc chắn muốn xóa thực đơn "${name}"?`,
            onConfirm: async () => {
                try {
                    await schoolMenuApi.delete(id);
                    toast.success('Xóa thực đơn thành công!');
                    fetchMenus();
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa thực đơn!');
                }
            },
        });
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setCurrentMenuId(null);
    };

    const handleDialogSuccess = () => {
        fetchMenus();
        handleDialogClose();
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'Đạt':
                return <Chip label="Đạt" color="success" size="small" />;
            case 'Chưa đạt':
                return <Chip label="Chưa đạt" color="warning" size="small" />;
            case 'Vượt quá định mức':
                return <Chip label="Vượt quá" color="error" size="small" />;
            default:
                return <Chip label="N/A" size="small" />;
        }
    };

    const getPlgOverallStatus = (plgEval) => {
        if (!plgEval) return 'N/A';
        if (Object.values(plgEval).some((s) => s === 'Vượt quá định mức')) return 'Vượt quá định mức';
        if (Object.values(plgEval).some((s) => s === 'Chưa đạt')) return 'Chưa đạt';
        return 'Đạt';
    };

    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false, align: 'center', headerAlign: 'center' },
        {
            field: 'menuName',
            headerName: 'Tên thực đơn',
            minWidth: 200,
            flex: 1,
            renderCell: (params) => <Typography fontWeight={600}>{params.value}</Typography>,
        },
        { field: 'ageGroup', headerName: 'Nhóm trẻ', width: 180 },
        {
            field: 'meals',
            headerName: 'Các món ăn',
            minWidth: 350,
            flex: 1.5,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                    {params.value &&
                        Object.entries(params.value).map(([session, items]) =>
                            items.length > 0 ? (
                                <Typography key={session} variant="body2" sx={{ whiteSpace: 'normal' }}>
                                    <strong>{session}:</strong>{' '}
                                    {items.map((item, i) => `${i + 1}. ${item.name}`).join('; ')}
                                </Typography>
                            ) : null,
                        )}
                </Box>
            ),
        },
        { field: 'numberOfChildren', headerName: 'Số trẻ', width: 80, align: 'center', headerAlign: 'center' },
        {
            field: 'analysis',
            headerName: 'ĐG Lượng (Calo)',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => getStatusChip(params.value?.caloriesEvaluation),
        },
        {
            field: 'plgEvaluation',
            headerName: 'ĐG Chất (PLG)',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => getStatusChip(getPlgOverallStatus(params.row.analysis?.plgEvaluation)),
        },
        {
            field: 'createdAt',
            headerName: 'Ngày tạo',
            width: 160,
            renderCell: (params) => dayjs(params.value).format('HH:mm | DD/MM/YYYY'),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box>
                    {canUpdate && (
                        <Tooltip title="Sửa">
                            <IconButton color="primary" size="small" onClick={() => handleEdit(params.id)}>
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title="Xóa">
                            <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(params.id, params.row.menuName)}
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
                    items={[{ text: 'Dinh dưỡng', icon: RestaurantOutlinedIcon }, { text: 'Thực đơn dự kiến' }]}
                />
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                            flexWrap: 'wrap',
                            gap: 1,
                        }}
                    >
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách thực đơn dự kiến
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên thực đơn..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: 250 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Nhóm trẻ</InputLabel>
                                <Select
                                    value={filterAgeGroup}
                                    onChange={(e) => setFilterAgeGroup(e.target.value)}
                                    label="Nhóm trẻ"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {ageGroupOptions.map((group) => (
                                        <MenuItem key={group} value={group}>
                                            {group}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {canCreate && (
                                <Tooltip title="Thêm thực đơn">
                                    <IconButton sx={{ color: '#1976d2' }} onClick={handleCreate}>
                                        <AddCircleOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 20, 50]}
                        getRowHeight={() => 'auto'}
                        autoHeight
                        disableColumnMenu
                        slots={{
                            noRowsOverlay: () => (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography>Không có dữ liệu thực đơn!</Typography>
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
                        sx={{ '& .MuiDataGrid-columnHeaders': { backgroundColor: '#e3f2fd' } }}
                    />
                </Paper>
            </PageContainer>

            <MenuDialog
                open={openDialog}
                mode={dialogMode}
                menuId={currentMenuId}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default Menu;

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
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // Import Icon
import BalancingMenuAi from './BalancingMenuAi'; // Import Component mới

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
    const [filterAppliedStatus, setFilterAppliedStatus] = useState(''); // ✅ NEW: Bộ lọc trạng thái áp dụng
    const [ageGroupOptions, setAgeGroupOptions] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentMenuId, setCurrentMenuId] = useState(null);
    const [openAiDialog, setOpenAiDialog] = useState(false);
    const [selectedMenuForAi, setSelectedMenuForAi] = useState(null);

    // Permissions
    const canCreate = hasPermission(PERMISSIONS.CREATE_MENU);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_MENU);
    const canDelete = hasPermission(PERMISSIONS.DELETE_MENU);

    const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];

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

            // ✅ Filter theo appliedStatus ở client-side
            let filteredItems = data.items;

            if (filterAppliedStatus === 'applied') {
                // Đã áp dụng: appliedCount > 0
                filteredItems = filteredItems.filter((item) => (item.appliedCount || 0) > 0);
            } else if (filterAppliedStatus === 'not_applied') {
                // Chưa áp dụng: appliedCount === 0
                filteredItems = filteredItems.filter((item) => (item.appliedCount || 0) === 0);
            }

            const formattedRows = filteredItems.map((item, index) => ({
                id: item._id,
                isApplied: item.isApplied, // ✅ Flag từ backend
                appliedCount: item.appliedCount || 0, // ✅ Số lần áp dụng
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                ...item,
            }));

            setRows(formattedRows);
            setTotalRows(filteredItems.length);
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
    // Handler mới
    const handleOpenAi = (row) => {
        setSelectedMenuForAi(row); // Lưu toàn bộ row data hoặc fetch detail lại nếu cần
        setOpenAiDialog(true);
    };

    const handleCloseAi = () => {
        setOpenAiDialog(false);
        setSelectedMenuForAi(null);
    };

    useEffect(() => {
        fetchMenus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterAgeGroup, filterAppliedStatus]);

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
            severity: 'error',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
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
                return <Chip label="Vượt quá định mức" color="error" size="small" />;
            default:
                return <Chip label="N/A" size="small" />;
        }
    };

    const getPlgStatusChip = (label, status) => {
        let color = 'default';

        if (status === 'Đạt') color = 'success';
        if (status === 'Chưa đạt') color = 'warning';
        if (status === 'Vượt quá định mức') color = 'error';

        return <Chip label={`${label}: ${status}`} color={color} size="small" sx={{ minWidth: 140 }} />;
    };

    const renderDateTimeCell = (value) => {
        if (!value) {
            return (
                <Typography variant="caption" color="text.secondary">
                    —
                </Typography>
            );
        }

        const time = dayjs(value).format('HH:mm:ss');
        const date = dayjs(value).format('DD/MM/YYYY');

        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    lineHeight: 1.2,
                }}
            >
                <Typography variant="body2" fontWeight={600}>
                    {time}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {date}
                </Typography>
            </Box>
        );
    };

    const columns = [
        { field: 'stt', headerName: 'STT', width: 40, sortable: false, align: 'center', headerAlign: 'center' },
        {
            field: 'menuName',
            headerName: 'Tên thực đơn',
            sortable: false,
            minWidth: 200,
            flex: 1,
            renderCell: (params) => <Typography fontWeight={600}>{params.value}</Typography>,
        },
        { field: 'ageGroup', headerName: 'Nhóm trẻ áp dụng', sortable: false, width: 180 },
        {
            field: 'meals',
            headerName: 'Các món ăn',
            minWidth: 200,
            flex: 1.5,
            sortable: false,
            renderCell: (params) => {
                const meals = params.value || {};

                return (
                    <Box
                        sx={{
                            py: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            width: '100%',
                        }}
                    >
                        {MEAL_SESSIONS.map((session) => {
                            const items = meals[session] || [];

                            return (
                                <Typography
                                    key={session}
                                    variant="body2"
                                    sx={{
                                        whiteSpace: 'normal',
                                        color: items.length === 0 ? 'text.secondary' : 'text.primary',
                                    }}
                                >
                                    <strong>{session}:</strong>{' '}
                                    {items.length > 0
                                        ? items.map((item, i) => `${i + 1}. ${item.name}`).join('; ')
                                        : '—'}
                                </Typography>
                            );
                        })}
                    </Box>
                );
            },
        },

        {
            field: 'numberOfChildren',
            headerName: 'Số trẻ áp dụng',
            sortable: false,
            width: 130,
            align: 'center',
            headerAlign: 'center',
        },
        {
            field: 'analysis',
            headerName: 'Về Lượng (Calo)',
            width: 160,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => getStatusChip(params.value?.caloriesEvaluation),
        },
        {
            field: 'plgEvaluation',
            headerName: 'Về Chất (PLG)',
            minWidth: 180,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const plg = params.row.analysis?.plgEvaluation;

                if (!plg) {
                    return <Typography variant="body2">N/A</Typography>;
                }

                return (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            py: 0.5,
                        }}
                    >
                        {getPlgStatusChip('P', plg.protein)}
                        {getPlgStatusChip('L', plg.lipid)}
                        {getPlgStatusChip('G', plg.glucid)}
                    </Box>
                );
            },
        },
        // ✅ CỘT MỚI: Số lần áp dụng
        {
            field: 'appliedCount',
            headerName: 'Số lần áp dụng',
            width: 130,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const count = params.value || 0;
                return (
                    <Chip
                        label={`${count} lần`}
                        size="small"
                        color={count > 0 ? 'success' : 'default'}
                        variant={count > 0 ? 'filled' : 'outlined'}
                    />
                );
            },
        },
        {
            field: 'createdAt',
            headerName: 'Ngày tạo',
            sortable: false,
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => renderDateTimeCell(params.value),
        },
        {
            field: 'updatedAt',
            headerName: 'Ngày sửa',
            width: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => renderDateTimeCell(params.value),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const isApplied = params.row.isApplied; // ✅ Check flag
                const isReady = params.row._ready;

                return (
                    <Box>
                        {/* NÚT AI: Chỉ hiện khi chưa ready và chưa apply */}
                        {!isReady && !isApplied && canUpdate && (
                            <Tooltip title="Cân đối thực đơn bằng A.I">
                                <IconButton color="secondary" size="small" onClick={() => handleOpenAi(params.row)}>
                                    <AutoFixHighIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canUpdate && (
                            <Tooltip
                                title={
                                    isApplied
                                        ? 'Thực đơn đã được áp dụng trong năm học hiện tại, không thể chỉnh sửa'
                                        : 'Chỉnh sửa thực đơn'
                                }
                            >
                                <span>
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        onClick={() => handleEdit(params.id)}
                                        disabled={isApplied} // ✅ Disable nếu đã áp dụng
                                    >
                                        <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip
                                title={
                                    isApplied
                                        ? 'Thực đơn đã được áp dụng trong năm học hiện tại, không thể xóa'
                                        : 'Xóa thực đơn'
                                }
                            >
                                <span>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        onClick={() => handleDelete(params.id, params.row.menuName)}
                                        disabled={isApplied} // ✅ Disable nếu đã áp dụng
                                    >
                                        <DeleteOutlineOutlinedIcon fontSize="small" />
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
                            {/* ✅ NEW: Filter Applied Status */}
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Trạng thái áp dụng</InputLabel>
                                <Select
                                    value={filterAppliedStatus}
                                    onChange={(e) => setFilterAppliedStatus(e.target.value)}
                                    label="Trạng thái áp dụng"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="applied">Đã áp dụng</MenuItem>
                                    <MenuItem value="not_applied">Chưa áp dụng</MenuItem>
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

            <BalancingMenuAi
                open={openAiDialog}
                menuData={selectedMenuForAi} // Lưu ý: Ở đây params.row có thể thiếu aggregatesFoodTable chi tiết nếu API getAll không trả về đủ.
                // Nếu thiếu, trong BalancingMenuAi cần có useEffect gọi API getDetails(menuId) trước.
                onClose={handleCloseAi}
                onSuccess={() => {
                    fetchMenus(); // Reload lại bảng sau khi update
                    handleCloseAi();
                }}
            />
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default Menu;

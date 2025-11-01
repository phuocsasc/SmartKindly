// client/src/pages/School/Personnel/PersonnelEvaluation/PersonnelEvaluation.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    IconButton,
    Tooltip,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PeopleIcon from '@mui/icons-material/People';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';

import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { personnelEvaluationApi } from '~/apis/personnelEvaluationApi';
import { academicYearApi } from '~/apis/academicYearApi';
import { toast } from 'react-toastify';
import PersonnelEvaluationDialog from './PersonnelEvaluationDialog';
import { PERMISSIONS } from '~/config/rbacConfig';

function PersonnelEvaluation() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [searchText, setSearchText] = useState('');
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('edit');
    const [currentEvaluation, setCurrentEvaluation] = useState(null);

    const isActiveYear = selectedYear === activeYearId;

    // ✅ Fetch Academic Years
    const fetchAcademicYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data.data.academicYears;
            setAcademicYears(years);

            const activeYear = years.find((year) => year.status === 'active');
            if (activeYear) {
                setActiveYearId(activeYear._id);
                setSelectedYear(activeYear._id);
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    // ✅ Fetch Evaluations
    const fetchEvaluations = async () => {
        if (!selectedYear) return;

        try {
            setLoading(true);
            const res = await personnelEvaluationApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: searchText,
                academicYearId: selectedYear,
            });

            const evaluations = res.data.data.records.map((item, index) => ({
                ...item,
                id: item._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                academicYear: item.academicYearId
                    ? `${item.academicYearId.fromYear}-${item.academicYearId.toYear}`
                    : '---',
            }));

            setRows(evaluations);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            toast.error('Lỗi khi tải danh sách đánh giá!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Effects
    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchEvaluations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, searchText, selectedYear]);

    // ✅ Handlers
    const handleEdit = (evaluation) => {
        setDialogMode('edit');
        setCurrentEvaluation(evaluation);
        setOpenDialog(true);
    };

    const handleView = (evaluation) => {
        setDialogMode('view');
        setCurrentEvaluation(evaluation);
        setOpenDialog(true);
    };

    // ✅ Columns Definition
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'fullName',
            headerName: 'Họ tên cán bộ',
            flex: 1.5,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontWeight: 600,
                        // color: '#1976d2',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'personnelCode',
            headerName: 'Mã cán bộ',
            flex: 1,
            minWidth: 160,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontWeight: 500,
                        color: '#666',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'officialEvaluation',
            headerName: 'Đánh giá viên chức',
            flex: 1.3,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => {
                const value = params.value;
                const colorMap = {
                    'Xuất sắc': { bg: '#e8f5e9', text: '#2e7d32' },
                    'Hoàn thành tốt': { bg: '#e3f2fd', text: '#1976d2' },
                    'Hoàn thành (hạn chế về NL)': { bg: '#fff3e0', text: '#e65100' },
                    'Không hoàn thành nhiệm vụ': { bg: '#ffebee', text: '#c62828' },
                };
                const colors = colorMap[value] || { bg: '#f5f5f5', text: '#757575' };

                return value ? (
                    <Chip
                        label={value}
                        size="small"
                        sx={{
                            bgcolor: colors.bg,
                            color: colors.text,
                            fontWeight: 500,
                        }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        ---
                    </Typography>
                );
            },
        },
        {
            field: 'regularTraining',
            headerName: 'Bồi dưỡng thường xuyên',
            flex: 1.2,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => {
                const value = params.value;
                const colorMap = {
                    Tốt: { bg: '#e8f5e9', text: '#2e7d32' },
                    Khá: { bg: '#e3f2fd', text: '#1976d2' },
                    Đạt: { bg: '#fff3e0', text: '#e65100' },
                    'Chưa hoàn thành': { bg: '#ffebee', text: '#c62828' },
                };
                const colors = colorMap[value] || { bg: '#f5f5f5', text: '#757575' };

                return value ? (
                    <Chip label={value} size="small" sx={{ bgcolor: colors.bg, color: colors.text, fontWeight: 500 }} />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        ---
                    </Typography>
                );
            },
        },
        {
            field: 'excellentTeacher',
            headerName: 'Giáo viên dạy giỏi',
            flex: 1,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => {
                const value = params.value;
                const colorMap = {
                    'Cấp Tỉnh': { bg: '#fce4ec', text: '#c2185b' },
                    'Cấp Huyện': { bg: '#e3f2fd', text: '#1976d2' },
                    'Cấp trường': { bg: '#f3e5f5', text: '#7b1fa2' },
                };
                const colors = colorMap[value] || { bg: '#f5f5f5', text: '#757575' };

                return value ? (
                    <Chip label={value} size="small" sx={{ bgcolor: colors.bg, color: colors.text, fontWeight: 500 }} />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        ---
                    </Typography>
                );
            },
        },
        {
            field: 'emulationTitle',
            headerName: 'Danh hiệu thi đua',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => {
                const value = params.value;
                return value ? (
                    <Chip
                        label={value}
                        size="small"
                        sx={{
                            bgcolor: '#fff3e0',
                            color: '#e65100',
                            fontWeight: 500,
                        }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        ---
                    </Typography>
                );
            },
        },
        {
            field: 'notes',
            headerName: 'Ghi chú',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        color: '#666',
                    }}
                >
                    {params.value || '---'}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 90,
            sortable: false,
            renderCell: (params) => {
                const canUpdate = hasPermission(PERMISSIONS.UPDATE_PERSONNEL_EVALUATION) && isActiveYear;
                const canView = hasPermission(PERMISSIONS.VIEW_PERSONNEL_EVALUATION);

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {canUpdate ? (
                            <Tooltip title="Chỉnh sửa đánh giá">
                                <IconButton color="primary" size="small" onClick={() => handleEdit(params.row)}>
                                    <EditOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        ) : (
                            canView && (
                                <Tooltip title="Xem chi tiết">
                                    <IconButton color="info" size="small" onClick={() => handleView(params.row)}>
                                        <VisibilityOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )
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
                    items={[{ text: 'Quản lý cán bộ', icon: PeopleIcon, href: '#' }, { text: 'Đánh giá xếp loại' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* ✅ Header - Giống Classes */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách đánh giá xếp loại
                        </Typography>

                        {/* ✅ Filters - Giống Classes */}
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
                            {/* Tìm kiếm */}
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mã cán bộ..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: { xs: '100%', sm: 200 } }}
                            />

                            {/* Chọn năm học */}
                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 120 } }}>
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
                                                    <DoneOutlinedIcon color="success" fontSize="small" />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* ✅ Thông báo năm học - Giống Classes */}
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
                                        <strong>Năm học đang hoạt động</strong>
                                    </>
                                ) : (
                                    <>
                                        <strong>Năm học đã kết thúc</strong>
                                    </>
                                )}
                            </Typography>
                        </Box>
                    )}

                    {/* ✅ DataGrid với Fixed Columns */}
                    <Box sx={{ display: 'flex', width: '100%', overflow: 'hidden' }}>
                        {/* Bảng bên trái: 3 cột cố định */}
                        <Box
                            sx={{
                                flex: '0 0 400px',
                                backgroundColor: '#fff',
                            }}
                        >
                            <DataGrid
                                rows={rows}
                                columns={columns.filter((c) => ['stt', 'fullName', 'personnelCode'].includes(c.field))}
                                loading={loading}
                                disableColumnMenu
                                disableRowSelectionOnClick
                                hideFooter
                                autoHeight
                                rowHeight={52}
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
                                        whiteSpace: 'normal',
                                        lineHeight: '1.2rem',
                                    },
                                    '& .MuiDataGrid-cell': {
                                        borderBottom: '1px solid #e0e0e0',
                                        borderRight: '1px solid #e0e0e0',
                                        color: '#000',
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                    },
                                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                        outline: 'none',
                                    },
                                    '& .MuiDataGrid-row:hover': { backgroundColor: '#f5faff' },
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                                                Không có dữ liệu
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
                            />
                        </Box>

                        {/* Bảng bên phải: Các cột còn lại + Scroll ngang */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowX: 'auto',
                                '& .MuiDataGrid-virtualScroller': {
                                    overflowX: 'auto',
                                    '&::-webkit-scrollbar': { height: '8px', width: '6px' },
                                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: '#0964a1a4',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                                },
                            }}
                        >
                            <DataGrid
                                rows={rows}
                                columns={columns.filter((c) => !['stt', 'fullName', 'personnelCode'].includes(c.field))}
                                loading={loading}
                                paginationMode="server"
                                paginationModel={paginationModel}
                                onPaginationModelChange={setPaginationModel}
                                pageSizeOptions={[5, 10, 25, 50]}
                                rowCount={totalRows}
                                disableRowSelectionOnClick
                                disableColumnMenu
                                autoHeight
                                sx={{
                                    borderLeft: 'none',
                                    borderBottom: 'none',
                                    borderRight: 'none',
                                    '& .MuiDataGrid-virtualScroller': {
                                        overflowX: 'auto',
                                    },
                                    '& .MuiDataGrid-columnHeaders': {
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        fontWeight: 900,
                                        borderRight: '2px solid #bbdefb',
                                        borderBottom: '2px solid #bbdefb',
                                    },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 'bold',
                                        fontSize: '0.95rem',
                                        whiteSpace: 'normal',
                                        lineHeight: '1.2rem',
                                    },
                                    '& .MuiDataGrid-cell': {
                                        borderRight: '1px solid #e0e0e0',
                                        borderBottom: '1px solid #f0f0f0',
                                        alignItems: 'center',
                                        whiteSpace: 'normal',
                                        color: '#000',
                                    },
                                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                        outline: 'none',
                                    },
                                    '& .MuiDataGrid-row:hover': { backgroundColor: '#f5faff' },
                                }}
                                localeText={{
                                    MuiTablePagination: {
                                        labelRowsPerPage: 'Số hàng mỗi trang:',
                                        labelDisplayedRows: ({ from, to, count }) =>
                                            `${from} - ${to} của ${count !== -1 ? count : `hơn ${to}`}`,
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
                                                Không có dữ liệu
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
                            />
                        </Box>
                    </Box>
                </Paper>
            </PageContainer>

            {/* Dialog */}
            <PersonnelEvaluationDialog
                open={openDialog}
                mode={dialogMode}
                evaluation={currentEvaluation}
                isActiveYear={isActiveYear}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchEvaluations();
                }}
            />
        </MainLayout>
    );
}

export default PersonnelEvaluation;

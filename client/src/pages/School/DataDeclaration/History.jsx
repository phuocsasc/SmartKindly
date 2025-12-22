import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Checkbox,
    CircularProgress,
    Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SchoolLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { auditLogApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import { ROLE_DISPLAY } from '~/config/roleConfig';

// ✅ Action colors
const ACTION_COLORS = {
    'Tạo mới': 'success',
    'Cập nhật': 'info',
    'Xóa': 'error',
    'Nhập dữ liệu': 'primary',
    'Xuất dữ liệu': 'secondary',
    'Đăng nhập': 'success',
    'Đăng xuất': 'default',
    'Xem': 'default',
    'Sao chép': 'success',
    'Kích hoạt': 'success',
    'Vô hiệu hóa': 'warning',
};

function History() {
    const { user } = useUser();

    // ✅ State
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedLogs, setSelectedLogs] = useState([]);

    // ✅ Filters
    const [filters, setFilters] = useState({
        action: '',
        resource: '',
        userName: '',
        userRole: '',
        startDate: null,
        endDate: null,
    });

    const isDisableSingleDelete = selectedLogs.length >= 2;

    // ✅ Fetch logs
    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await auditLogApi.getAll({
                page: page + 1,
                limit: rowsPerPage,
                ...filters,
                startDate: filters.startDate ? dayjs(filters.startDate).format('YYYY-MM-DD') : '',
                endDate: filters.endDate ? dayjs(filters.endDate).format('YYYY-MM-DD') : '',
            });

            setLogs(res.data.data.logs);
            setTotalItems(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Lỗi khi tải lịch sử thao tác!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle delete single
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa lịch sử này?')) return;

        try {
            await auditLogApi.delete(id);
            toast.success('Xóa lịch sử thành công!');
            fetchLogs();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa lịch sử!');
        }
    };

    // ✅ Handle delete many
    const handleDeleteMany = async () => {
        if (selectedLogs.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một lịch sử để xóa!');
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedLogs.length} lịch sử đã chọn?`)) return;

        try {
            await auditLogApi.deleteMany(selectedLogs);
            toast.success(`Đã xóa ${selectedLogs.length} lịch sử!`);
            setSelectedLogs([]);
            fetchLogs();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa lịch sử!');
        }
    };

    // ✅ Handle select
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedLogs(logs.map((log) => log._id));
        } else {
            setSelectedLogs([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedLogs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    // ✅ Effects
    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage]);

    // ✅ Render
    return (
        <SchoolLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Quản trị hệ thống', icon: HistoryIcon }, { text: 'Lịch sử thao tác' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Lịch sử thao tác
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteSweepIcon />}
                                onClick={handleDeleteMany}
                                disabled={selectedLogs.length === 0}
                            >
                                Xóa đã chọn ({selectedLogs.length})
                            </Button>
                        </Box>
                    </Box>

                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            label="Tên người tác động"
                            value={filters.userName}
                            onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
                            sx={{
                                display: 'flex',
                                gap: 2,
                                mb: 2,
                                flexWrap: 'wrap',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    '&:hover fieldset': { borderColor: '#0071bc' },
                                    '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                },
                                '& label.Mui-focused': { color: '#0071bc' },
                            }}
                        />

                        <FormControl
                            size="small"
                            sx={{
                                minWidth: 150,
                                display: 'flex',
                                gap: 2,
                                mb: 2,
                                flexWrap: 'wrap',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    '&:hover fieldset': { borderColor: '#0071bc' },
                                    '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                },
                                '& label.Mui-focused': { color: '#0071bc' },
                            }}
                        >
                            <InputLabel>Hành động</InputLabel>
                            <Select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                label="Hành động"
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                <MenuItem value="CREATE">Tạo mới</MenuItem>
                                <MenuItem value="COPY">Sao chép</MenuItem>
                                <MenuItem value="UPDATE">Cập nhật</MenuItem>
                                <MenuItem value="DELETE">Xóa</MenuItem>
                                <MenuItem value="IMPORT">Import</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl
                            size="small"
                            sx={{
                                minWidth: 150,
                                display: 'flex',
                                gap: 2,
                                mb: 2,
                                flexWrap: 'wrap',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    '&:hover fieldset': { borderColor: '#0071bc' },
                                    '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                },
                                '& label.Mui-focused': { color: '#0071bc' },
                            }}
                        >
                            <InputLabel>Vai trò</InputLabel>
                            <Select
                                value={filters.userRole}
                                onChange={(e) => setFilters({ ...filters, userRole: e.target.value })}
                                label="Vai trò"
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                <MenuItem value="ban_giam_hieu">Ban giám hiệu</MenuItem>
                                <MenuItem value="to_truong">Tổ trưởng</MenuItem>
                                <MenuItem value="giao_vien">Giáo viên</MenuItem>
                            </Select>
                        </FormControl>

                        <DatePicker
                            label="Từ ngày"
                            value={filters.startDate}
                            onChange={(date) => setFilters({ ...filters, startDate: date })}
                            slotProps={{ textField: { size: 'small' } }}
                            sx={{
                                minWidth: 150,
                                display: 'flex',
                                gap: 2,
                                mb: 2,
                                flexWrap: 'wrap',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    '&:hover fieldset': { borderColor: '#0071bc' },
                                    '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                },
                                '& label.Mui-focused': { color: '#0071bc' },
                            }}
                        />

                        <DatePicker
                            label="Đến ngày"
                            value={filters.endDate}
                            onChange={(date) => setFilters({ ...filters, endDate: date })}
                            slotProps={{ textField: { size: 'small' } }}
                            sx={{
                                minWidth: 150,
                                display: 'flex',
                                gap: 2,
                                mb: 2,
                                flexWrap: 'wrap',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    '&:hover fieldset': { borderColor: '#0071bc' },
                                    '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                },
                                '& label.Mui-focused': { color: '#0071bc' },
                            }}
                        />

                        <Button
                            variant="outlined"
                            startIcon={<SearchIcon />}
                            onClick={fetchLogs}
                            sx={{
                                height: 40, // 👈 bằng TextField size="small"
                                borderRadius: 1.5,
                                color: '#1976d2',
                                backgroundColor: '#e3f2fd',
                                borderColor: '#c4c4c4',
                                textTransform: 'none',
                                fontWeight: 500,
                                px: 2,
                                '&:hover': {
                                    borderColor: '#0071bc',
                                    backgroundColor: '#e3f2fd',
                                },
                                '&:focus-visible': {
                                    outline: 'none',
                                    borderColor: '#0071bc',
                                    boxShadow: '0 0 0 2px rgba(0,113,188,0.2)',
                                },
                            }}
                        >
                            Tìm kiếm
                        </Button>
                    </Box>

                    {/* Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : logs.length === 0 ? (
                        <Alert severity="info">Chưa có lịch sử thao tác nào</Alert>
                    ) : (
                        <>
                            <TableContainer
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    maxHeight: '65vh',
                                    overflowY: 'auto',
                                    '&::-webkit-scrollbar': { width: '6px' },
                                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: '#0964a1a4',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                                }}
                            >
                                <Table
                                    stickyHeader
                                    size="small"
                                    sx={{
                                        // 💠 HEADER STYLE - giống bảng Lớp học
                                        '& .MuiTableHead-root .MuiTableCell-head': {
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2',
                                            fontWeight: 600,
                                            borderBottom: '2px solid #bbdefb',
                                            borderRight: '1px solid #bbdefb',
                                            fontSize: '0.95rem',
                                            // textAlign: 'center',
                                            zIndex: 2,
                                        },

                                        // 💠 BODY STYLE
                                        '& .MuiTableBody-root .MuiTableCell-body': {
                                            borderRight: '1px solid #e0e0e0',
                                            borderBottom: '1px solid #f0f0f0',
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                            color: '#000',
                                            padding: '8px',
                                            fontSize: '0.9rem',
                                        },

                                        // 💠 ROW HOVER
                                        '& .MuiTableRow-root:hover': {
                                            backgroundColor: '#f5faff',
                                        },

                                        // 💠 BO GÓC VÀ SHADOW
                                        borderRadius: 2,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    width: 40,
                                                    pl: 1, // 👈 đẩy sát trái
                                                }}
                                            >
                                                <Checkbox
                                                    checked={selectedLogs.length === logs.length && logs.length > 0}
                                                    indeterminate={
                                                        selectedLogs.length > 0 && selectedLogs.length < logs.length
                                                    }
                                                    onChange={handleSelectAll}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ width: 40 }}>STT</TableCell>
                                            <TableCell>Người tác động</TableCell>
                                            <TableCell>Vai trò</TableCell>
                                            <TableCell>Hành động</TableCell>
                                            <TableCell>Đối tượng tác động</TableCell>
                                            <TableCell>Mô tả hành động</TableCell>
                                            <TableCell>Thời gian</TableCell>
                                            <TableCell sx={{ textAlign: 'center', width: 100 }}>Thao tác</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {logs.map((log, index) => (
                                            <TableRow key={log._id} hover>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedLogs.includes(log._id)}
                                                        onChange={() => handleSelectOne(log._id)}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {page * rowsPerPage + index + 1}
                                                </TableCell>
                                                <TableCell>{log.userName}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={ROLE_DISPLAY[log.userRole] || log.userRole}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.action}
                                                        size="small"
                                                        color={ACTION_COLORS[log.action] || 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell>{log.resource}</TableCell>
                                                <TableCell sx={{ maxWidth: 300 }}>
                                                    <Tooltip title={log.description} placement="top-start">
                                                        <Typography
                                                            variant="body2"
                                                            noWrap
                                                            sx={{
                                                                maxWidth: 300,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {log.description}
                                                        </Typography>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {dayjs(log.createdAt).format('HH:mm:ss')}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dayjs(log.createdAt).format('DD/MM/YYYY')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Xóa">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            disabled={isDisableSingleDelete}
                                                            onClick={() => handleDelete(log._id)}
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            <TablePagination
                                component="div"
                                count={totalItems}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value));
                                    setPage(0);
                                }}
                                labelRowsPerPage="Số hàng mỗi trang:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
                            />
                        </>
                    )}
                </Paper>
            </PageContainer>
        </SchoolLayout>
    );
}

export default History;

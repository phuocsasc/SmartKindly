import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Stack,
    Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { childrenAttendanceApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

// Cấu hình UI status
const STATUS_OPTIONS = [
    { value: 'Có mặt', label: 'Có mặt', symbol: '✓', color: '#2e7d32', bgColor: '#e8f5e9' },
    { value: 'Vắng có phép', label: 'Có phép', symbol: 'P', color: '#ed6c02', bgColor: '#fff3e0' },
    { value: 'Vắng không phép', label: 'Không phép', symbol: 'K', color: '#d32f2f', bgColor: '#ffebee' },
];

// Hàm tạo màu avatar
function stringToColor(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
}

function stringAvatar(name) {
    if (!name) return {};
    const splitName = name.split(' ');
    return {
        sx: {
            bgcolor: stringToColor(name),
            width: 34,
            height: 34,
            fontSize: '0.85rem',
            fontWeight: 'bold',
            border: '1px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        children: `${splitName[0][0]}${splitName[splitName.length - 1][0]}`,
    };
}

function BulkAttendanceDialog({ open, classId, academicYearId, students, date, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [attendances, setAttendances] = useState([]);

    useEffect(() => {
        if (open && students?.length > 0) {
            const list = students
                .filter((s) => s.managementStatus === 'Đang học')
                .map((s) => ({
                    studentId: s.studentId,
                    fullName: s.fullName,
                    studentCode: s.studentCode,
                    status: 'Có mặt',
                    note: '',
                }));
            setAttendances(list);
        }
    }, [open, students]);

    const handleStatusChange = (studentId, newStatus) => {
        setAttendances((prev) =>
            prev.map((att) => (att.studentId === studentId ? { ...att, status: newStatus } : att)),
        );
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await childrenAttendanceApi.bulkAttendance({
                academicYearId,
                classId,
                date,
                items: attendances.map((att) => ({
                    studentId: att.studentId,
                    status: att.status,
                    note: att.note,
                })),
            });
            toast.success('Điểm danh thành công!');
            onSuccess?.();
            onClose?.();
        } catch (error) {
            console.error('Error bulk attendance:', error);
            toast.error(error?.response?.data?.message || 'Lỗi khi điểm danh!');
        } finally {
            setLoading(false);
        }
    };

    if (!students || students.length === 0) return null;

    // Thống kê
    const countPresent = attendances.filter((a) => a.status === 'Có mặt').length;
    const countAbsent = attendances.length - countPresent;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden', height: '90vh' } }} // Cố định chiều cao để có thanh scroll
        >
            {/* 1. Header: Ngày tháng được đưa lên đây và làm nổi bật */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                    color: '#fff',
                    py: 1.5,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                            <FactCheckOutlinedIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600}>
                            Điểm danh hàng loạt
                        </Typography>
                    </Box>

                    {/* Badge Ngày tháng nổi bật */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            py: 0.5,
                            px: 1.5,
                            borderRadius: 20,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                    >
                        <CalendarMonthIcon sx={{ fontSize: 18, color: '#120303ff' }} />
                        <Typography variant="subtitle2" fontWeight={600} color="#1a0505ff">
                            {dayjs(date).format('DD/MM/YYYY')}
                        </Typography>
                    </Box>
                </Box>

                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* 2. Content Full Width & Single Scroll */}
            <DialogContent
                sx={{
                    p: 0,
                    bgcolor: '#fff',
                    // Custom Scrollbar đồng bộ màu bg
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-track': { background: '#f5f5f5' },
                    '&::-webkit-scrollbar-thumb': { background: '#bdbdbd', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#9e9e9e' },
                }}
            >
                <Table size="medium" sx={{ minWidth: 650 }}>
                    <TableHead>
                        {/* 3. Sticky Header - Cố định khi scroll */}
                        <TableRow>
                            <TableCell
                                align="center"
                                sx={{
                                    width: 60,
                                    fontWeight: 700,
                                    bgcolor: '#f5f7fa',
                                    borderRight: '1px solid #e0e0e0',
                                    borderBottom: '1px solid #e0e0e0',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                }}
                            >
                                STT
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 700,
                                    bgcolor: '#f5f7fa',
                                    borderRight: '1px solid #e0e0e0',
                                    borderBottom: '1px solid #e0e0e0',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                }}
                            >
                                Thông tin Học sinh
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{
                                    minWidth: 200,
                                    fontWeight: 700,
                                    bgcolor: '#f5f7fa',
                                    borderBottom: '1px solid #e0e0e0',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1,
                                }}
                            >
                                Trạng thái
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {attendances.map((att, index) => {
                            const isAbsent = att.status !== 'Có mặt';
                            return (
                                <TableRow key={att.studentId} hover sx={{ bgcolor: isAbsent ? '#fff8f8' : 'inherit' }}>
                                    <TableCell
                                        align="center"
                                        sx={{ borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #eee' }}
                                    >
                                        {index + 1}
                                    </TableCell>

                                    <TableCell
                                        sx={{ borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #eee' }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar {...stringAvatar(att.fullName)} />
                                            <Box>
                                                <Typography variant="body2" fontWeight={600} color="text.primary">
                                                    {att.fullName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {att.studentCode}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center" sx={{ borderBottom: '1px solid #eee' }}>
                                        <Stack direction="row" spacing={1.5} justifyContent="center">
                                            {STATUS_OPTIONS.map((option) => {
                                                const isSelected = att.status === option.value;
                                                return (
                                                    <Tooltip key={option.value} title={option.label}>
                                                        <Box
                                                            onClick={() =>
                                                                handleStatusChange(att.studentId, option.value)
                                                            }
                                                            sx={{
                                                                width: 34,
                                                                height: 34,
                                                                borderRadius: '50%',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.9rem',
                                                                fontWeight: 'bold',
                                                                transition: 'all 0.1s',
                                                                bgcolor: isSelected ? option.color : '#fff',
                                                                color: isSelected ? '#fff' : '#bdbdbd',
                                                                border: `1px solid ${isSelected ? option.color : '#e0e0e0'}`,
                                                                boxShadow: isSelected
                                                                    ? '0 2px 4px rgba(0,0,0,0.2)'
                                                                    : 'none',
                                                                '&:hover': {
                                                                    borderColor: option.color,
                                                                    color: isSelected ? '#fff' : option.color,
                                                                    transform: 'scale(1.1)',
                                                                },
                                                            }}
                                                        >
                                                            {option.symbol}
                                                        </Box>
                                                    </Tooltip>
                                                );
                                            })}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </DialogContent>

            {/* 4. Footer: Thống kê nằm chung 1 dòng */}
            <DialogActions
                sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#fff', justifyContent: 'space-between' }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                        Có mặt: {countPresent}
                    </Typography>
                    {countAbsent > 0 && (
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ color: '#d32f2f', display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            Vắng: {countAbsent}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        sx={{ borderRadius: 1.5, borderColor: '#ccc', color: 'text.secondary' }}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                        sx={{
                            borderRadius: 1.5,
                            px: 3,
                            background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        }}
                    >
                        {loading ? 'Đang lưu...' : `Lưu điểm danh (${attendances.length})`}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

export default BulkAttendanceDialog;

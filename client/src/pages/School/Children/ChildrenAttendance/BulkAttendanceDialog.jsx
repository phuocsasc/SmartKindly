import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    FormControl,
    Select,
    MenuItem,
    Typography,
    IconButton,
    Avatar,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { childrenAttendanceApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

const ATTENDANCE_STATUS = [
    { value: 'Có mặt', label: 'Có mặt', color: 'success' },
    { value: 'Vắng có phép', label: 'Vắng có phép', color: 'warning' },
    { value: 'Vắng không phép', label: 'Vắng không phép', color: 'error' },
    { value: 'Đi trễ', label: 'Đi trễ', color: 'info' },
];

function BulkAttendanceDialog({ open, classId, students, date, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [attendances, setAttendances] = useState([]);

    useEffect(() => {
        if (open && students.length > 0) {
            setAttendances(
                students.map((student) => ({
                    studentId: student._id,
                    fullName: student.fullName,
                    studentCode: student.studentCode,
                    status: 'Có mặt',
                    note: '',
                })),
            );
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
                classId,
                date,
                attendances: attendances.map((att) => ({
                    studentId: att.studentId,
                    status: att.status,
                    note: att.note,
                })),
            });

            toast.success('Điểm danh hàng loạt thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error bulk attendance:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi điểm danh hàng loạt!');
        } finally {
            setLoading(false);
        }
    };

    if (!students || students.length === 0) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <GroupAddIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Điểm danh hàng loạt - {dayjs(date).format('DD/MM/YYYY')}
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ px: 3, py: 3 }}>
                <TableContainer component={Paper} sx={{ maxHeight: 400, mt: 2 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#e3f2fd' }}>STT</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#e3f2fd' }}>Mã HS</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#e3f2fd' }}>Họ tên</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#e3f2fd', minWidth: 180 }}>
                                    Trạng thái
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attendances.map((att, index) => (
                                <TableRow key={att.studentId}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{att.studentCode}</TableCell>
                                    <TableCell>{att.fullName}</TableCell>
                                    <TableCell>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={att.status}
                                                onChange={(e) => handleStatusChange(att.studentId, e.target.value)}
                                            >
                                                {ATTENDANCE_STATUS.map((status) => (
                                                    <MenuItem key={status.value} value={status.value}>
                                                        <Chip label={status.label} color={status.color} size="small" />
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    disabled={loading}
                    size="small"
                    sx={{ borderRadius: 1.5 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang lưu...' : `Điểm danh ${attendances.length} học sinh`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default BulkAttendanceDialog;

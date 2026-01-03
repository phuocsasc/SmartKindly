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
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { childrenByClassApi } from '~/apis';
import { toast } from 'react-toastify';

function TransferStudentsDialog({
    open,
    academicYearId,
    fromClassId,
    fromClassName,
    studentIds,
    students,
    onClose,
    onSuccess,
}) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [selectedToClass, setSelectedToClass] = useState('');

    // ✅ Fetch available classes for transfer
    const fetchAvailableClasses = async () => {
        try {
            setLoading(true);
            const res = await childrenByClassApi.getAvailableClassesForTransfer(
                academicYearId,
                fromClassId,
                studentIds,
            );
            const { classes } = res.data.data;

            setAvailableClasses(classes);
        } catch (error) {
            console.error('Error fetching available classes:', error);
            toast.error('Lỗi khi tải danh sách lớp!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && studentIds.length > 0) {
            fetchAvailableClasses();
            setSelectedToClass('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ✅ Handle submit
    const handleSubmit = async () => {
        if (!selectedToClass) {
            toast.warning('Vui lòng chọn lớp mới!');
            return;
        }

        try {
            setSubmitting(true);
            await childrenByClassApi.transferStudents({
                academicYearId,
                fromClassId,
                toClassId: selectedToClass,
                studentIds,
            });

            const toClassName = availableClasses.find((c) => c._id === selectedToClass)?.name || '';
            toast.success(`Đã chuyển ${studentIds.length} trẻ từ lớp "${fromClassName}" sang lớp "${toClassName}"!`);
            onSuccess();
        } catch (error) {
            console.error('Error transferring students:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi chuyển lớp!');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <SwapHorizIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Chuyển lớp
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

            <DialogContent sx={{ pt: 3, mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Chuyển <strong>{students.length} trẻ</strong> từ lớp <strong>"{fromClassName}"</strong> sang lớp mới
                </Alert>

                {/* Danh sách trẻ được chọn */}
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Danh sách trẻ:
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 250 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#e3f2fd' }}>STT</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#e3f2fd' }}>Mã học sinh</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#e3f2fd' }}>Họ tên</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student, index) => (
                                <TableRow key={student.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{student.studentCode}</TableCell>
                                    <TableCell>{student.fullName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Select lớp mới */}
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    Chọn lớp mới:
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : availableClasses.length === 0 ? (
                    <Alert severity="warning">Không có lớp phù hợp để chuyển!</Alert>
                ) : (
                    <FormControl fullWidth size="small">
                        <InputLabel>Lớp mới *</InputLabel>
                        <Select
                            value={selectedToClass}
                            onChange={(e) => setSelectedToClass(e.target.value)}
                            label="Lớp mới *"
                        >
                            {availableClasses.map((cls) => (
                                <MenuItem key={cls._id} value={cls._id}>
                                    {cls.name} ({cls.ageGroup}) - GVCN: {cls.homeRoomTeacher?.fullName || '---'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit" size="small">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="warning"
                    size="small"
                    disabled={submitting || !selectedToClass}
                >
                    {submitting ? <CircularProgress size={20} color="inherit" /> : 'Chuyển lớp'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default TransferStudentsDialog;

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    IconButton,
    Avatar,
    Divider,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { childrenProgramCompleteApi, schoolYearTargetApi } from '~/apis'; // ✅ Thêm schoolYearTargetApi
import { toast } from 'react-toastify';

function ChildrenProgramCompleteDialog({ open, data, targets, ageGroup, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [targetDetails, setTargetDetails] = useState({});
    const [formData, setFormData] = useState({
        assessmentDetails: [],
        note: '',
    });

    // ✅ Fetch target content details
    useEffect(() => {
        if (open && targets.length > 0 && data?.classId) {
            fetchTargetDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, targets, data?.classId]);

    // ✅ Initialize form when dialog opens
    useEffect(() => {
        if (open && data) {
            if (data.evaluation) {
                setFormData({
                    assessmentDetails: data.evaluation.assessmentDetails || [],
                    note: data.evaluation.note || '',
                });
            } else {
                setFormData({
                    assessmentDetails: targets.map((id) => ({
                        targetId: id,
                        status: 'Chưa đánh giá',
                    })),
                    note: '',
                });
            }
        }
    }, [open, data, targets]);

    // ✅ Fetch target details
    const fetchTargetDetails = async () => {
        try {
            const res = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: data.academicYearId,
                ageGroup: ageGroup,
            });

            const targetData = res.data.data.targets[0];
            if (!targetData) return;

            const details = {};
            let mtNumber = 1;

            const processTargets = (mainFields) => {
                mainFields.forEach((mainField) => {
                    if (mainField.subFields && mainField.subFields.length > 0) {
                        mainField.subFields.forEach((subField) => {
                            subField.expectedResults?.forEach((expectedResult) => {
                                expectedResult.targets?.forEach((target) => {
                                    details[String(target._id)] = {
                                        code: `MT${mtNumber}`,
                                        content: target.content,
                                    };
                                    mtNumber++;
                                });
                            });
                        });
                    } else {
                        mainField.expectedResults?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                details[String(target._id)] = {
                                    code: `MT${mtNumber}`,
                                    content: target.content,
                                };
                                mtNumber++;
                            });
                        });
                    }
                });
            };

            if (targetData.mainFields) {
                processTargets(targetData.mainFields);
            }

            setTargetDetails(details);
        } catch (error) {
            console.error('Error fetching target details:', error);
        }
    };

    // ✅ Handle status change
    const handleStatusChange = (targetId) => {
        setFormData((prev) => ({
            ...prev,
            assessmentDetails: prev.assessmentDetails.map((detail) => {
                if (String(detail.targetId) === String(targetId)) {
                    const statusCycle = {
                        'Chưa đánh giá': 'Đạt',
                        Đạt: 'Chưa đạt',
                        'Chưa đạt': 'Chưa đánh giá',
                    };
                    return {
                        ...detail,
                        status: statusCycle[detail.status] || 'Chưa đánh giá',
                    };
                }
                return detail;
            }),
        }));
    };

    // ✅ Get color for status
    const getStatusColor = (status) => {
        switch (status) {
            case 'Đạt':
                return '#ffc107';
            case 'Chưa đạt':
                return '#4caf50';
            default:
                return '#9e9e9e';
        }
    };

    // ✅ Handle save
    const handleSave = async () => {
        try {
            setLoading(true);

            const payload = {
                academicYearId: data.academicYearId,
                classId: data.classId,
                studentId: data.student._id,
                assessmentDetails: formData.assessmentDetails,
                note: formData.note,
            };

            if (data.evaluation?._id) {
                await childrenProgramCompleteApi.update(data.evaluation._id, payload);
                toast.success('Cập nhật đánh giá thành công!');
            } else {
                await childrenProgramCompleteApi.create(payload);
                toast.success('Tạo đánh giá thành công!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving evaluation:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi lưu đánh giá!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle delete
    const handleDelete = async () => {
        if (!data.evaluation?._id) return;

        try {
            setLoading(true);
            await childrenProgramCompleteApi.delete(data.evaluation._id);
            toast.success('Xóa đánh giá thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deleting evaluation:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi xóa đánh giá!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <EmojiEventsOutlinedIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        {data?.evaluation ? 'Cập nhật đánh giá' : 'Tạo đánh giá'} - {data?.student?.fullName}
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    disabled={loading}
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

            <DialogContent sx={{ px: 3, py: 3 }}>
                {/* Assessment Details Table */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#667eea' }}>
                        📋 Chi tiết đánh giá mục tiêu
                    </Typography>

                    <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#ede7f6' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Mục tiêu</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Nội dung mục tiêu</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>
                                        Đánh giá
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.assessmentDetails.map((detail) => {
                                    const targetInfo = targetDetails[String(detail.targetId)];
                                    const mtCode = targetInfo?.code || 'MT?';
                                    const content = targetInfo?.content || 'Không có dữ liệu';

                                    return (
                                        <TableRow key={detail.targetId} hover>
                                            <TableCell sx={{ fontWeight: 600, minWidth: 60 }}>{mtCode}</TableCell>
                                            <TableCell sx={{ maxWidth: 400 }}>
                                                <Typography variant="body2">{content}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <EmojiEventsOutlinedIcon
                                                    sx={{
                                                        fontSize: 28,
                                                        color: getStatusColor(detail.status),
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            transform: 'scale(1.2)',
                                                        },
                                                    }}
                                                    onClick={() => handleStatusChange(detail.targetId)}
                                                    title={`${detail.status} - Click để thay đổi`}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Note */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#667eea' }}>
                        📝 Ghi chú nhận xét tổng kết
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Nhập ghi chú, nhận xét tổng kết..."
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    />
                </Box>

                {/* Status Legend */}
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>
                        Hướng dẫn:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmojiEventsOutlinedIcon sx={{ fontSize: 16, color: '#9e9e9e' }} />
                            <Typography variant="caption">Chưa đánh giá</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmojiEventsOutlinedIcon sx={{ fontSize: 16, color: '#ffc107' }} />
                            <Typography variant="caption">Đạt</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmojiEventsOutlinedIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                            <Typography variant="caption">Chưa đạt</Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <Divider />

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                {data?.evaluation && (
                    <Button
                        onClick={handleDelete}
                        disabled={loading}
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                    >
                        Xóa
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} disabled={loading} variant="outlined" color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    variant="contained"
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {data?.evaluation ? 'Cập nhật' : 'Tạo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenProgramCompleteDialog;

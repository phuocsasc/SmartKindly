// client/src/pages/School/Children/ChildrenProgramComplete/ChildrenProgramCompleteDialog.jsx

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
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Slider,
    Alert,
} from '@mui/material';
import { Close as CloseIcon, EmojiEventsOutlined as TrophyIcon, Save as SaveIcon } from '@mui/icons-material';
import { childrenProgramCompleteApi, schoolYearTargetApi } from '~/apis';
import { toast } from 'react-toastify';

function ChildrenProgramCompleteDialog({ open, data, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [configuredTargets, setConfiguredTargets] = useState([]);
    const [targetDetails, setTargetDetails] = useState({});
    const [formData, setFormData] = useState({
        assessmentDetails: [],
        note: '',
    });

    // ✅ Map class ageGroup to config ageGroup
    const mapClassAgeGroupToConfigAgeGroup = (classAgeGroup) => {
        const mapping = {
            '12-24 tháng': 'Nhà trẻ 12-24 tháng',
            '24-36 tháng': 'Nhà trẻ 24-36 tháng',
            '3-4 tuổi': 'Khối mầm 3-4 tuổi',
            '4-5 tuổi': 'Khối chồi 4-5 tuổi',
            '5-6 tuổi': 'Khối lá 5-6 tuổi',
        };
        return mapping[classAgeGroup] || null;
    };

    // ✅ Fetch configured targets when dialog opens
    useEffect(() => {
        if (open && data?.classId && data?.academicYearId) {
            fetchConfiguredTargets();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, data?.classId, data?.academicYearId]);

    // ✅ Initialize form when targets are loaded
    useEffect(() => {
        if (open && data && configuredTargets.length > 0) {
            if (data.assessmentDetails && data.assessmentDetails.length > 0) {
                // Edit mode: Use existing data
                setFormData({
                    assessmentDetails: data.assessmentDetails,
                    note: data.note || '',
                });
            } else {
                // Create mode: Initialize with 0 scores
                setFormData({
                    assessmentDetails: configuredTargets.map((targetId) => ({
                        targetId,
                        score: 0,
                    })),
                    note: '',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, data, configuredTargets]);

    const fetchConfiguredTargets = async () => {
        try {
            setLoadingTargets(true);

            // 1. Get class info to determine ageGroup
            const classRes = await childrenProgramCompleteApi.getAccessibleClasses(data.academicYearId);
            const classData = classRes.data.data.classes.find((c) => c._id === data.classId);

            if (!classData) {
                toast.error('Không tìm thấy thông tin lớp học');
                return;
            }

            const configAgeGroup = mapClassAgeGroupToConfigAgeGroup(classData.ageGroup);
            if (!configAgeGroup) {
                toast.error(`Nhóm tuổi "${classData.ageGroup}" chưa được hỗ trợ`);
                return;
            }

            // 2. Get configured targets for this age group
            const configRes = await childrenProgramCompleteApi.getConfigByYear(data.academicYearId);
            const config = configRes.data.data.configs.find((c) => c.ageGroup === configAgeGroup);

            if (!config || !config.selectedTargetIds || config.selectedTargetIds.length === 0) {
                toast.error(
                    `Chưa cấu hình mục tiêu cho nhóm tuổi "${configAgeGroup}". Vui lòng liên hệ Ban giám hiệu.`,
                );
                setConfiguredTargets([]);
                return;
            }

            setConfiguredTargets(config.selectedTargetIds);

            // 3. Fetch target details
            await fetchTargetDetails(data.academicYearId, configAgeGroup, config.selectedTargetIds);
        } catch (error) {
            console.error('Error fetching configured targets:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải mục tiêu đã cấu hình');
        } finally {
            setLoadingTargets(false);
        }
    };

    const fetchTargetDetails = async (academicYearId, ageGroup, targetIds) => {
        try {
            const res = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId,
                ageGroup,
            });

            const targetData = res.data.data.targets[0];
            if (!targetData) return;

            const details = {};

            const processTargets = (mainFields) => {
                mainFields.forEach((mainField) => {
                    if (mainField.subFields && mainField.subFields.length > 0) {
                        mainField.subFields.forEach((subField) => {
                            subField.expectedResults?.forEach((expectedResult) => {
                                expectedResult.targets?.forEach((target) => {
                                    if (targetIds.includes(target._id)) {
                                        details[String(target._id)] = {
                                            code: target.code,
                                            content: target.content,
                                        };
                                    }
                                });
                            });
                        });
                    } else {
                        mainField.expectedResults?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                if (targetIds.includes(target._id)) {
                                    details[String(target._id)] = {
                                        code: target.code,
                                        content: target.content,
                                    };
                                }
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

    const handleScoreChange = (targetId, newScore) => {
        setFormData((prev) => ({
            ...prev,
            assessmentDetails: prev.assessmentDetails.map((detail) =>
                String(detail.targetId) === String(targetId) ? { ...detail, score: newScore } : detail,
            ),
        }));
    };

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

            if (data.evaluationId) {
                await childrenProgramCompleteApi.update(data.evaluationId, payload);
                toast.success('Cập nhật đánh giá thành công!');
            } else {
                await childrenProgramCompleteApi.create(payload);
                toast.success('Tạo đánh giá thành công!');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving evaluation:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi lưu đánh giá!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
                        <TrophyIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        {data?.evaluationId ? 'Cập nhật đánh giá' : 'Tạo đánh giá'} - {data?.student?.fullName}
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
                {/* Info */}
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, mb: 3 }}>
                    <Typography variant="body2">
                        <strong>Học sinh:</strong> {data?.student?.fullName} - {data?.student?.studentCode}
                    </Typography>
                </Paper>

                {/* Loading State */}
                {loadingTargets ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            Đang tải mục tiêu...
                        </Typography>
                    </Box>
                ) : configuredTargets.length === 0 ? (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        Chưa cấu hình mục tiêu cho nhóm tuổi này. Vui lòng liên hệ Ban giám hiệu.
                    </Alert>
                ) : (
                    <>
                        {/* Assessment Table */}
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#667eea' }}>
                            Đánh giá mục tiêu (0-10 điểm)
                        </Typography>

                        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', mb: 3 }}>
                            <Box
                                sx={{
                                    maxHeight: 400,
                                    overflowY: 'auto',
                                    '&::-webkit-scrollbar': { width: 6 },
                                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#667eea', borderRadius: 4 },
                                }}
                            >
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#ede7f6' }}>
                                            <TableCell sx={{ fontWeight: 700, width: 80 }}>Mục tiêu</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Nội dung</TableCell>
                                            <TableCell sx={{ fontWeight: 700, width: 350 }}>Điểm số</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {formData.assessmentDetails.map((detail) => {
                                            const targetInfo = targetDetails[String(detail.targetId)];
                                            const mtCode = targetInfo?.code || 'MT?';
                                            const content = targetInfo?.content || 'Đang tải...';

                                            return (
                                                <TableRow key={detail.targetId} hover>
                                                    <TableCell sx={{ fontWeight: 600 }}>{mtCode}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{content}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Slider
                                                                value={detail.score}
                                                                onChange={(e, newValue) =>
                                                                    handleScoreChange(detail.targetId, newValue)
                                                                }
                                                                min={0}
                                                                max={10}
                                                                step={1}
                                                                marks
                                                                valueLabelDisplay="auto"
                                                                sx={{ flex: 1 }}
                                                            />
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={700}
                                                                sx={{
                                                                    minWidth: 40,
                                                                    textAlign: 'center',
                                                                    color: '#667eea',
                                                                }}
                                                            >
                                                                {detail.score}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>
                        </TableContainer>

                        {/* Note */}
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#667eea' }}>
                            📝 Nhận xét tổng kết
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Nhập nhận xét tổng kết..."
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            inputProps={{ maxLength: 2000 }}
                            helperText={`${formData.note.length}/2000 ký tự`}
                        />
                    </>
                )}
            </DialogContent>

            <Divider />

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                    variant="outlined"
                    color="inherit"
                    sx={{ borderRadius: 2 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={loading || loadingTargets || configuredTargets.length === 0}
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                    sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    {loading ? 'Đang lưu...' : data?.evaluationId ? 'Cập nhật' : 'Tạo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenProgramCompleteDialog;

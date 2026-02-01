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
    CircularProgress,
    Paper,
    Alert,
    Chip,
    Grid,
    Stack,
    Rating,
} from '@mui/material';
import {
    Close as CloseIcon,
    EmojiEventsRounded as TrophyIcon,
    SaveRounded as SaveIcon,
    StarRounded as StarIcon,
    StarBorderRounded as StarBorderIcon,
    EditNoteRounded as NoteIcon,
} from '@mui/icons-material';
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
        // Rating component trả về null nếu click lại vào sao đã chọn, ta set về 0 hoặc giữ nguyên tùy logic
        const score = newScore === null ? 0 : newScore;
        setFormData((prev) => ({
            ...prev,
            assessmentDetails: prev.assessmentDetails.map((detail) =>
                String(detail.targetId) === String(targetId) ? { ...detail, score: score } : detail,
            ),
        }));
    };

    const validateForm = () => {
        // Kiểm tra nếu có điểm nào = 0 (Rating chưa chọn)
        const invalidScores = formData.assessmentDetails.filter((detail) => detail.score < 1);
        if (invalidScores.length > 0) {
            toast.error('Vui lòng đánh giá tất cả các mục tiêu (tối thiểu 1 sao)!');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        // ✅ ADD: Validate before submit
        if (!validateForm()) {
            return;
        }

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
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                    height: '90vh', // Tăng chiều cao để hiển thị được nhiều nội dung hơn
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {/* --- 1. Compact Header with Student Info --- */}
            <DialogTitle
                sx={{
                    p: 2,
                    background: 'linear-gradient(90deg, #6C5DD3 0%, #8071e6 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                        <TrophyIcon fontSize="small" sx={{ color: '#FFD700' }} />
                    </Avatar>

                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                            Đánh giá trẻ hoàn thành chương trình
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {data?.student?.fullName} - {data?.student?.studentCode}
                        </Typography>
                    </Box>
                </Box>

                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            {/* --- Content --- */}
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', bgcolor: '#f1f5f9' }}>
                {loadingTargets ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            py: 5,
                        }}
                    >
                        <CircularProgress sx={{ color: '#6C5DD3' }} />
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                            Đang tải bảng đánh giá...
                        </Typography>
                    </Box>
                ) : configuredTargets.length === 0 ? (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="warning">Chưa cấu hình mục tiêu cho độ tuổi này.</Alert>
                    </Box>
                ) : (
                    <>
                        {/* --- 2. Assessment List (Scrollable Area) --- */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                p: 2,
                                '&::-webkit-scrollbar': { width: '6px' },
                                '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#64748b', mb: 1.5, ml: 1 }}>
                                DANH SÁCH MỤC TIÊU ({formData.assessmentDetails.length})
                            </Typography>

                            <Stack spacing={1.5}>
                                {formData.assessmentDetails.map((detail) => {
                                    const targetInfo = targetDetails[String(detail.targetId)];
                                    const score = detail.score;
                                    const isRated = score > 0;

                                    return (
                                        <Paper
                                            key={detail.targetId}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                bgcolor: 'white',
                                                border: '1px solid',
                                                borderColor: isRated ? 'transparent' : '#e2e8f0',
                                                boxShadow: isRated ? '0 2px 6px rgba(108, 93, 211, 0.08)' : 'none',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    borderColor: '#6C5DD3',
                                                    transform: 'translateY(-1px)',
                                                },
                                            }}
                                        >
                                            <Grid container spacing={2} alignItems="center">
                                                {/* Nội dung mục tiêu */}
                                                <Grid item xs={12} md={7}>
                                                    <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                        <Chip
                                                            label={targetInfo?.code || 'MT...'}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: 1,
                                                                fontWeight: 700,
                                                                fontSize: '1rem',
                                                                bgcolor: '#eef2ff',
                                                                color: '#4f46e5',
                                                                height: 24,
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: '#334155', lineHeight: 1.5 }}
                                                    >
                                                        {targetInfo?.content || 'Đang tải nội dung...'}
                                                    </Typography>
                                                </Grid>

                                                {/* Rating 10 sao */}
                                                <Grid item xs={12} md={5}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                                            gap: 1.5,
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                bgcolor: '#fffbeb',
                                                                px: 1.5,
                                                                py: 0.5,
                                                                borderRadius: 10,
                                                                border: '1px solid #fef3c7',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <Rating
                                                                name={`rating-${detail.targetId}`}
                                                                value={score}
                                                                max={10}
                                                                onChange={(event, newValue) =>
                                                                    handleScoreChange(detail.targetId, newValue)
                                                                }
                                                                icon={
                                                                    <StarIcon
                                                                        fontSize="inherit"
                                                                        sx={{ color: '#fbbf24' }}
                                                                    />
                                                                }
                                                                emptyIcon={
                                                                    <StarBorderIcon
                                                                        fontSize="inherit"
                                                                        sx={{ color: '#d1d5db' }}
                                                                    />
                                                                }
                                                                size="medium"
                                                                sx={{
                                                                    fontSize: '1.4rem',
                                                                    mr: 1,
                                                                }}
                                                            />
                                                            <Typography
                                                                fontWeight={800}
                                                                sx={{
                                                                    color: score > 0 ? '#b45309' : '#94a3b8',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                    fontSize: '1rem',
                                                                }}
                                                            >
                                                                {score}
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>
                                                                    /10
                                                                </span>
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Box>

                        {/* --- 3. Note Section (Fixed at bottom) --- */}
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2,
                                zIndex: 1,
                                borderRadius: 0,
                                borderTop: '1px solid #e2e8f0',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <NoteIcon sx={{ color: '#6C5DD3', mt: 1 }} />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Nhập nhận xét tổng quát của giáo viên..."
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#f8fafc',
                                            '& fieldset': { borderColor: '#cbd5e1' },
                                            '&.Mui-focused fieldset': { borderColor: '#6C5DD3' },
                                        },
                                    }}
                                />
                            </Box>
                        </Paper>
                    </>
                )}
            </DialogContent>

            {/* --- Footer Actions --- */}
            <DialogActions sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #f1f5f9' }}>
                <Button onClick={onClose} disabled={loading} color="inherit" sx={{ borderRadius: 2 }}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={loading || loadingTargets || configuredTargets.length === 0}
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    sx={{
                        bgcolor: '#6C5DD3',
                        '&:hover': { bgcolor: '#5b4dc7' },
                        borderRadius: 2,
                        px: 4,
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu Kết Quả'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenProgramCompleteDialog;

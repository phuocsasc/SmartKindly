// client/src/pages/School/Children/ChildrenProgramComplete/TargetConfigurationDialog.jsx

import { useState, useEffect, useMemo } from 'react';
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
    FormControl,
    Select,
    MenuItem,
    CircularProgress,
    Tooltip,
    TextField,
    InputAdornment,
    Chip,
    Card,
    CardContent,
    LinearProgress,
    Fade,
    Stack,
} from '@mui/material';
import {
    Close as CloseIcon,
    SettingsSuggestRounded as SettingsIcon,
    CheckCircleRounded as CheckIcon,
    RadioButtonUncheckedRounded as UncheckIcon,
    DeleteSweepRounded as DeleteIcon,
    SearchRounded as SearchIcon,
    FilterListRounded as FilterIcon,
    SchoolRounded as SchoolIcon,
    AssignmentTurnedInRounded as TargetIcon,
} from '@mui/icons-material';
import { childrenProgramCompleteApi, schoolYearTargetApi } from '~/apis';
import { toast } from 'react-toastify';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';

const AGE_GROUPS = [
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

// Hàm tạo màu ngẫu nhiên nhất quán cho từng lĩnh vực để giao diện sinh động
const getFieldColor = (fieldName) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B731', '#A3CB38'];
    let hash = 0;
    for (let i = 0; i < fieldName.length; i++) {
        hash = fieldName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

function TargetConfigurationDialog({ open, academicYearId, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
    const [availableTargets, setAvailableTargets] = useState([]);
    const [selectedTargets, setSelectedTargets] = useState([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [hasExistingConfig, setHasExistingConfig] = useState(false);

    // UI States
    const [searchTerm, setSearchTerm] = useState('');

    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // ✅ Fetch targets when age group changes
    useEffect(() => {
        if (selectedAgeGroup && academicYearId) {
            fetchTargetsForAgeGroup();
        } else {
            setAvailableTargets([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAgeGroup, academicYearId]);

    const fetchTargetsForAgeGroup = async () => {
        try {
            setLoadingTargets(true);

            const res = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId,
                ageGroup: selectedAgeGroup,
            });

            const targetData = res.data.data.targets[0];
            if (!targetData) {
                toast.warning(`Không tìm thấy mục tiêu cho nhóm tuổi "${selectedAgeGroup}"`);
                setAvailableTargets([]);
                setSelectedTargets([]);
                return;
            }

            // Extract targets
            const targets = [];

            const processMainFields = (mainFields) => {
                mainFields.forEach((mainField) => {
                    const processSub = (items, subName = null) => {
                        items?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                targets.push({
                                    _id: target._id,
                                    code: target.code,
                                    content: target.content,
                                    mainFieldCode: mainField.code,
                                    mainFieldName: mainField.name,
                                    subFieldName: subName,
                                });
                            });
                        });
                    };

                    if (mainField.subFields?.length > 0) {
                        mainField.subFields.forEach((sub) => processSub(sub.expectedResults, sub.name));
                    } else {
                        processSub(mainField.expectedResults);
                    }
                });
            };

            if (targetData.mainFields) {
                processMainFields(targetData.mainFields);
            }

            setAvailableTargets(targets);

            // Load existing config
            await loadExistingConfig();
        } catch (error) {
            console.error('Error fetching targets:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải mục tiêu!');
            setAvailableTargets([]);
        } finally {
            setLoadingTargets(false);
        }
    };

    const loadExistingConfig = async () => {
        try {
            const res = await childrenProgramCompleteApi.getConfigByYear(academicYearId);
            const config = res.data.data.configs.find((c) => c.ageGroup === selectedAgeGroup);

            if (config && config.selectedTargetIds) {
                setSelectedTargets(config.selectedTargetIds.map((id) => String(id)));
                setHasExistingConfig(true);
            } else {
                setSelectedTargets([]);
                setHasExistingConfig(false);
            }
        } catch (error) {
            console.error('Error loading config:', error);
            setSelectedTargets([]);
            setHasExistingConfig(false);
        }
    };

    const handleToggleTarget = (targetId) => {
        setSelectedTargets((prev) => {
            if (prev.includes(String(targetId))) {
                return prev.filter((id) => id !== String(targetId));
            } else {
                return [...prev, String(targetId)];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedTargets.length === availableTargets.length) {
            setSelectedTargets([]);
        } else {
            setSelectedTargets(availableTargets.map((t) => String(t._id)));
        }
    };

    const handleSave = async () => {
        if (!selectedAgeGroup) {
            toast.error('Vui lòng chọn nhóm tuổi!');
            return;
        }

        if (selectedTargets.length < 5) {
            toast.error('Phải chọn tối thiểu 5 mục tiêu!');
            return;
        }

        try {
            setLoading(true);

            await childrenProgramCompleteApi.upsertConfig({
                academicYearId,
                ageGroup: selectedAgeGroup,
                selectedTargetIds: selectedTargets,
            });

            toast.success('Cấu hình mục tiêu thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving config:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi cấu hình mục tiêu!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ NEW: Handle delete config
    const handleDeleteConfig = () => {
        if (!selectedAgeGroup || !hasExistingConfig) return;
        showConfirm({
            title: 'Xóa cấu hình',
            message: `Bạn có chắc chắn muốn xóa cấu hình cho nhóm "${selectedAgeGroup}"? Dữ liệu đánh giá liên quan sẽ bị xóa.`,
            severity: 'error',
            confirmText: 'Xóa bỏ',
            cancelText: 'Hủy',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await childrenProgramCompleteApi.deleteConfig(selectedAgeGroup, academicYearId);
                    toast.success('Xóa cấu hình thành công!');
                    setSelectedTargets([]);
                    setHasExistingConfig(false);
                    onSuccess();
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa cấu hình!');
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    // --- Search & Filter Logic ---
    const filteredTargets = useMemo(() => {
        return availableTargets.filter(
            (target) =>
                target.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                target.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                target.mainFieldName.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [availableTargets, searchTerm]);

    const allSelected = availableTargets.length > 0 && selectedTargets.length === availableTargets.length;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        height: '90vh', // Fixed height for consistent layout
                        bgcolor: '#f8fafc',
                        backgroundImage: 'radial-gradient(circle at 50% 0%, #f1f5f9 0%, #f8fafc 100%)',
                    },
                }}
            >
                {/* 1. Modern Gradient Header */}
                <DialogTitle
                    sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #6C5DD3 0%, #8071e6 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 20px rgba(108, 93, 211, 0.2)',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                width: 48,
                                height: 48,
                                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)',
                            }}
                        >
                            <SettingsIcon fontSize="medium" />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                                CẤU HÌNH MỤC TIÊU
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                                Thiết lập tiêu chí đánh giá hoàn thành chương trình
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                {/* 2. Control & Filter Bar */}
                <Box sx={{ p: 3, pb: 2, bgcolor: 'white', borderBottom: '1px solid #edf2f7' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        {/* Age Selector */}
                        <FormControl size="small" sx={{ minWidth: 280 }} variant="outlined">
                            <Select
                                displayEmpty
                                value={selectedAgeGroup}
                                onChange={(e) => setSelectedAgeGroup(e.target.value)}
                                startAdornment={<SchoolIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />}
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: '#f8fafc',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                    fontWeight: 600,
                                }}
                                renderValue={(selected) => {
                                    if (selected.length === 0)
                                        return <Typography color="text.secondary">Chọn độ tuổi áp dụng...</Typography>;
                                    return selected;
                                }}
                            >
                                <MenuItem disabled value="">
                                    <em>Chọn nhóm tuổi</em>
                                </MenuItem>
                                {AGE_GROUPS.map((group) => (
                                    <MenuItem key={group.value} value={group.value} sx={{ fontWeight: 500 }}>
                                        {group.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Search Bar */}
                        <TextField
                            placeholder="Tìm kiếm mục tiêu..."
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 3, bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' } },
                            }}
                        />

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {selectedAgeGroup && (
                                <Tooltip title={allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleSelectAll}
                                        color={allSelected ? 'primary' : 'inherit'}
                                        sx={{ borderRadius: 3, minWidth: 40, px: 1, borderColor: '#e2e8f0' }}
                                    >
                                        <TargetIcon fontSize="small" />
                                    </Button>
                                </Tooltip>
                            )}

                            {selectedAgeGroup && hasExistingConfig && (
                                <Tooltip title="Xóa cấu hình hiện tại">
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleDeleteConfig}
                                        sx={{
                                            borderRadius: 3,
                                            minWidth: 40,
                                            px: 1,
                                            borderColor: '#ffcdd2',
                                            bgcolor: '#ffebee',
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </Button>
                                </Tooltip>
                            )}
                        </Box>
                    </Stack>

                    {/* Progress Indicator */}
                    {availableTargets.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={(selectedTargets.length / availableTargets.length) * 100}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: '#edf2f7',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                            bgcolor: selectedTargets.length >= 5 ? '#6C5DD3' : '#f59e0b',
                                        },
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{
                                    color: selectedTargets.length >= 5 ? '#6C5DD3' : '#f59e0b',
                                    minWidth: 80,
                                    textAlign: 'right',
                                }}
                            >
                                {selectedTargets.length} / {availableTargets.length}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
                    {loadingTargets ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                        >
                            <CircularProgress sx={{ color: '#6C5DD3' }} />
                            <Typography sx={{ mt: 2, color: 'text.secondary' }}>Đang tải danh mục...</Typography>
                        </Box>
                    ) : !selectedAgeGroup ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                opacity: 0.6,
                            }}
                        >
                            <FilterIcon sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                Vui lòng chọn nhóm tuổi để bắt đầu
                            </Typography>
                        </Box>
                    ) : filteredTargets.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">Không tìm thấy mục tiêu nào phù hợp.</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ p: 2 }}>
                            <Stack spacing={1.5}>
                                {filteredTargets.map((target) => {
                                    const isSelected = selectedTargets.includes(String(target._id));
                                    const fieldColor = getFieldColor(target.mainFieldName);

                                    return (
                                        <Fade in key={target._id} timeout={300}>
                                            <Card
                                                elevation={0}
                                                onClick={() => handleToggleTarget(target._id)}
                                                sx={{
                                                    borderRadius: 3,
                                                    border: '1px solid',
                                                    borderColor: isSelected ? '#6C5DD3' : 'transparent',
                                                    bgcolor: 'white',
                                                    boxShadow: isSelected
                                                        ? '0 4px 12px rgba(108, 93, 211, 0.15)'
                                                        : '0 2px 4px rgba(0,0,0,0.03)',
                                                    transition: 'all 0.2s ease-in-out',
                                                    position: 'relative',
                                                    overflow: 'visible',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                    },
                                                }}
                                            >
                                                {/* Selection Indicator Strip */}
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: 4,
                                                        bgcolor: isSelected ? '#6C5DD3' : 'transparent',
                                                        borderTopLeftRadius: 12,
                                                        borderBottomLeftRadius: 12,
                                                    }}
                                                />

                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                        {/* Checkbox Area */}
                                                        <Box sx={{ pt: 0.5 }}>
                                                            {isSelected ? (
                                                                <CheckIcon sx={{ color: '#6C5DD3', fontSize: 26 }} />
                                                            ) : (
                                                                <UncheckIcon sx={{ color: '#cbd5e1', fontSize: 26 }} />
                                                            )}
                                                        </Box>

                                                        {/* Content Area */}
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexWrap: 'wrap',
                                                                    gap: 1,
                                                                    mb: 1,
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <Chip
                                                                    label={target.code}
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        borderRadius: 1,
                                                                        bgcolor: '#eff6ff',
                                                                        color: '#1d4ed8',
                                                                        height: 24,
                                                                    }}
                                                                />
                                                                <Chip
                                                                    label={target.mainFieldName}
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        borderRadius: 1,
                                                                        bgcolor: `${fieldColor}15`,
                                                                        color: fieldColor,
                                                                        border: `1px solid ${fieldColor}30`,
                                                                        height: 24,
                                                                    }}
                                                                />
                                                                {target.subFieldName && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: 'text.secondary',
                                                                            fontStyle: 'italic',
                                                                        }}
                                                                    >
                                                                        • {target.subFieldName}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    color: isSelected ? '#2d3748' : '#4a5568',
                                                                    fontWeight: isSelected ? 500 : 400,
                                                                }}
                                                            >
                                                                {target.content}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Fade>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}
                </DialogContent>

                {/* 3. Footer with Status */}
                <DialogActions
                    sx={{
                        p: 2,
                        px: 3,
                        bgcolor: 'white',
                        borderTop: '1px solid #edf2f7',
                        justifyContent: 'space-between',
                    }}
                >
                    <Box>
                        {selectedTargets.length < 5 && selectedTargets.length > 0 && (
                            <Typography variant="caption" color="error" fontWeight={600}>
                                * Cần chọn thêm {5 - selectedTargets.length} mục tiêu nữa
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={onClose} disabled={loading} sx={{ color: '#64748b', borderRadius: 2 }}>
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading || selectedTargets.length < 5 || !selectedAgeGroup}
                            variant="contained"
                            startIcon={loading && <CircularProgress size={18} color="inherit" />}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                bgcolor: '#6C5DD3',
                                boxShadow: '0 4px 14px rgba(108, 93, 211, 0.4)',
                                '&:hover': { bgcolor: '#5a4cb4', boxShadow: '0 6px 20px rgba(108, 93, 211, 0.6)' },
                            }}
                        >
                            {loading ? 'Đang lưu...' : `Lưu Cấu Hình (${selectedTargets.length})`}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </>
    );
}

export default TargetConfigurationDialog;

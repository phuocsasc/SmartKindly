// client/src/pages/School/Children/ChildrenProgramComplete/TargetConfigurationDialog.jsx

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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Alert,
    Tooltip,
} from '@mui/material';
import {
    Close as CloseIcon,
    Settings as SettingsIcon,
    CheckCircle as CheckIcon,
    DeleteOutline as DeleteIcon, // ✅ ADD
} from '@mui/icons-material';
import { childrenProgramCompleteApi, schoolYearTargetApi } from '~/apis';
import { toast } from 'react-toastify';
import { useConfirmDialog } from '~/hooks/useConfirmDialog'; // ✅ ADD
import ConfirmDialog from '~/components/common/ConfirmDialog'; // ✅ ADD

const AGE_GROUPS = [
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

function TargetConfigurationDialog({ open, academicYearId, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
    const [availableTargets, setAvailableTargets] = useState([]);
    const [selectedTargets, setSelectedTargets] = useState([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [hasExistingConfig, setHasExistingConfig] = useState(false); // ✅ ADD

    const { dialogState, showConfirm, handleCancel } = useConfirmDialog(); // ✅ ADD

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
                    if (mainField.subFields && mainField.subFields.length > 0) {
                        mainField.subFields.forEach((subField) => {
                            subField.expectedResults?.forEach((expectedResult) => {
                                expectedResult.targets?.forEach((target) => {
                                    targets.push({
                                        _id: target._id,
                                        code: target.code,
                                        content: target.content,
                                        mainFieldCode: mainField.code,
                                        mainFieldName: mainField.name,
                                        subFieldCode: subField.code,
                                        subFieldName: subField.name,
                                        expectedResultCode: expectedResult.code,
                                        expectedResultDescription: expectedResult.description,
                                    });
                                });
                            });
                        });
                    } else {
                        mainField.expectedResults?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                targets.push({
                                    _id: target._id,
                                    code: target.code,
                                    content: target.content,
                                    mainFieldCode: mainField.code,
                                    mainFieldName: mainField.name,
                                    subFieldCode: null,
                                    subFieldName: null,
                                    expectedResultCode: expectedResult.code,
                                    expectedResultDescription: expectedResult.description,
                                });
                            });
                        });
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
                setHasExistingConfig(true); // ✅ SET FLAG
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
        if (!selectedAgeGroup) {
            toast.warning('Vui lòng chọn nhóm tuổi!');
            return;
        }

        if (!hasExistingConfig) {
            toast.warning('Nhóm tuổi này chưa có cấu hình để xóa!');
            return;
        }

        showConfirm({
            title: 'Xác nhận xóa cấu hình',
            message: `Bạn có chắc chắn muốn xóa cấu hình mục tiêu cho nhóm tuổi "${selectedAgeGroup}"? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu đánh giá liên quan.`,
            severity: 'error',
            confirmText: 'Xóa',
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
                    console.error('Error deleting config:', error);
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa cấu hình!');
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const allSelected = selectedTargets.length === availableTargets.length && availableTargets.length > 0;
    const someSelected = selectedTargets.length > 0 && selectedTargets.length < availableTargets.length;

    return (
        <>
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
                            <SettingsIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600}>
                            Cấu hình mục tiêu đánh giá
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
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                            Chọn tối thiểu 5 mục tiêu để cấu hình đánh giá trẻ hoàn thành chương trình. Các lớp học
                            thuộc nhóm tuổi này sẽ được đánh giá dựa trên các mục tiêu bạn chọn.
                        </Typography>
                    </Alert>

                    {/* Age Group Selection */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Chọn nhóm tuổi *</InputLabel>
                            <Select
                                value={selectedAgeGroup}
                                onChange={(e) => setSelectedAgeGroup(e.target.value)}
                                label="Chọn nhóm tuổi *"
                                disabled={loading}
                            >
                                {AGE_GROUPS.map((group) => (
                                    <MenuItem key={group.value} value={group.value}>
                                        {group.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* ✅ Delete Config Button */}
                        {selectedAgeGroup && hasExistingConfig && (
                            <Tooltip title="Xóa cấu hình nhóm tuổi này">
                                <IconButton
                                    color="error"
                                    disabled={loading}
                                    onClick={handleDeleteConfig}
                                    sx={{
                                        bgcolor: 'rgba(211, 47, 47, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.2)' },
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* Targets List */}
                    {selectedAgeGroup && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#667eea' }}>
                                    Danh sách mục tiêu ({selectedTargets.length}/{availableTargets.length})
                                </Typography>
                            </Box>

                            {availableTargets.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    {selectedTargets.length < 5 ? (
                                        <Alert severity="warning">
                                            Phải chọn tối thiểu 5 mục tiêu (Hiện tại: {selectedTargets.length})
                                        </Alert>
                                    ) : (
                                        <Alert severity="success" icon={<CheckIcon />}>
                                            Đã chọn {selectedTargets.length} mục tiêu
                                        </Alert>
                                    )}
                                </Box>
                            )}

                            {loadingTargets ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : availableTargets.length === 0 ? (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    Không tìm thấy mục tiêu nào cho nhóm tuổi này.
                                </Alert>
                            ) : (
                                <TableContainer
                                    component={Paper}
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        maxHeight: 450,
                                        overflowY: 'auto',
                                        '&::-webkit-scrollbar': { width: 6 },
                                        '&::-webkit-scrollbar-thumb': { backgroundColor: '#667eea', borderRadius: 4 },
                                    }}
                                >
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#ede7f6' }}>
                                                <TableCell sx={{ width: 50, fontWeight: 700 }}>
                                                    <Checkbox
                                                        checked={allSelected}
                                                        indeterminate={someSelected}
                                                        onChange={handleSelectAll}
                                                        disabled={loading}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, width: 80 }}>Mã MT</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Nội dung mục tiêu</TableCell>
                                                <TableCell sx={{ fontWeight: 700, width: 120 }}>Lĩnh vực</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {availableTargets.map((target) => {
                                                const isSelected = selectedTargets.includes(String(target._id));

                                                return (
                                                    <TableRow
                                                        key={target._id}
                                                        hover
                                                        sx={{
                                                            bgcolor: isSelected
                                                                ? 'rgba(102, 126, 234, 0.1)'
                                                                : 'transparent',
                                                        }}
                                                    >
                                                        <TableCell sx={{ width: 50 }}>
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onChange={() => handleToggleTarget(target._id)}
                                                                disabled={loading}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>{target.code}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">{target.content}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {target.mainFieldName}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}
                </DialogContent>

                {/* Actions */}
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={onClose} disabled={loading} variant="outlined" color="inherit">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || selectedTargets.length < 5 || !selectedAgeGroup}
                        variant="contained"
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        Lưu cấu hình
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ✅ Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </>
    );
}

export default TargetConfigurationDialog;

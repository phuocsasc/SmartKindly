/* eslint-disable no-unused-vars */
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
    Divider,
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
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { childrenProgramCompleteApi, schoolYearTargetApi } from '~/apis';
import { toast } from 'react-toastify';

const AGE_GROUPS = [
    { value: 'Nhà trẻ 3-12 tháng', label: 'Nhà trẻ 3-12 tháng' },
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

    // ✅ Fetch targets for age group
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

            // ✅ Gọi getAll với academicYearId và ageGroup
            const res = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId,
                ageGroup: selectedAgeGroup,
            });

            const targetData = res.data.data.targets[0]; // Lấy target đầu tiên (chỉ có 1 do filter ageGroup)
            if (!targetData) {
                toast.warning(`Không tìm thấy mục tiêu cho nhóm tuổi "${selectedAgeGroup}"`);
                setAvailableTargets([]);
                setSelectedTargets([]);
                return;
            }

            // ✅ Extract targets từ mainFields structure
            const targets = [];
            let mtNumber = 1;

            const processMainFields = (mainFields) => {
                mainFields.forEach((mainField) => {
                    // Process sub-fields
                    if (mainField.subFields && mainField.subFields.length > 0) {
                        mainField.subFields.forEach((subField) => {
                            subField.expectedResults?.forEach((expectedResult) => {
                                expectedResult.targets?.forEach((target) => {
                                    targets.push({
                                        _id: target._id,
                                        code: `MT${mtNumber}`,
                                        content: target.content,
                                        mainFieldCode: mainField.code,
                                        mainFieldName: mainField.name,
                                        subFieldCode: subField.code,
                                        subFieldName: subField.name,
                                        expectedResultCode: expectedResult.code,
                                        expectedResultDescription: expectedResult.description,
                                    });
                                    mtNumber++;
                                });
                            });
                        });
                    } else {
                        // Direct expected results
                        mainField.expectedResults?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                targets.push({
                                    _id: target._id,
                                    code: `MT${mtNumber}`,
                                    content: target.content,
                                    mainFieldCode: mainField.code,
                                    mainFieldName: mainField.name,
                                    subFieldCode: null,
                                    subFieldName: null,
                                    expectedResultCode: expectedResult.code,
                                    expectedResultDescription: expectedResult.description,
                                });
                                mtNumber++;
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
            await loadExistingConfig(targets);
        } catch (error) {
            console.error('Error fetching targets:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải mục tiêu!');
            setAvailableTargets([]);
        } finally {
            setLoadingTargets(false);
        }
    };

    const loadExistingConfig = async (targets) => {
        try {
            const res = await childrenProgramCompleteApi.getConfigByYear(academicYearId);
            const config = res.data.data.configs.find((c) => c.ageGroup === selectedAgeGroup);

            if (config && config.selectedTargetIds) {
                setSelectedTargets(config.selectedTargetIds.map((id) => String(id)));
            } else {
                setSelectedTargets([]);
            }
        } catch (error) {
            console.error('Error loading config:', error);
            setSelectedTargets([]);
        }
    };

    // ✅ Handle target selection
    const handleToggleTarget = (targetId) => {
        setSelectedTargets((prev) => {
            if (prev.includes(String(targetId))) {
                return prev.filter((id) => id !== String(targetId));
            } else {
                return [...prev, String(targetId)];
            }
        });
    };

    // ✅ Select all
    const handleSelectAll = () => {
        if (selectedTargets.length === availableTargets.length) {
            setSelectedTargets([]);
        } else {
            setSelectedTargets(availableTargets.map((t) => String(t._id)));
        }
    };

    // ✅ Handle save configuration
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

    const allSelected = selectedTargets.length === availableTargets.length && availableTargets.length > 0;
    const someSelected = selectedTargets.length > 0 && selectedTargets.length < availableTargets.length;

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
                        <SettingsOutlinedIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Cấu hình mục tiêu đánh giá trẻ hoàn thành chương trình
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
                {/* Info Alert */}
                <Alert
                    severity="info"
                    icon={<StorageOutlinedIcon />}
                    sx={{ mt: 2, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center' }}
                >
                    <Typography variant="body2" fontWeight={600}>
                        Chọn tối thiểu 5 mục tiêu để cấu hình đánh giá trẻ hoàn thành chương trình cho từng nhóm tuổi.{' '}
                        <br />
                        Các lớp học thuộc nhóm tuổi này sẽ được đánh giá dựa trên các mục tiêu bạn chọn.
                    </Typography>
                </Alert>

                {/* Age Group Selection */}
                <Box sx={{ mb: 2 }}>
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
                </Box>

                {/* Targets List */}
                {selectedAgeGroup && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#667eea' }}>
                                Danh sách mục tiêu ({selectedTargets.length}/{availableTargets.length})
                            </Typography>

                            {/* {availableTargets.length > 0 && (
                                <Button
                                    size="small"
                                    onClick={handleSelectAll}
                                    variant="outlined"
                                    sx={{ borderColor: '#667eea', color: '#667eea' }}
                                    disabled={loading}
                                >
                                    {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </Button>
                            )} */}
                        </Box>
                        {/* Status Message */}
                        {availableTargets.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                {selectedTargets.length < 5 ? (
                                    <Alert severity="warning">
                                        Phải chọn tối thiểu 5 mục tiêu (Hiện tại: {selectedTargets.length})
                                    </Alert>
                                ) : (
                                    <Alert severity="success" icon={<CheckCircleIcon />}>
                                        Đã chọn {selectedTargets.length} mục tiêu
                                    </Alert>
                                )}
                            </Box>
                        )}

                        <Divider sx={{ mb: 0 }} />

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
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {target.content.substring(0, 80)}
                                                                {target.content.length > 80 ? '...' : ''}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={target.mainFieldCode}
                                                            size="small"
                                                            variant="outlined"
                                                        />
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

            <Divider />

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
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
    );
}

export default TargetConfigurationDialog;

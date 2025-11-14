import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { schoolYearTargetApi } from '~/apis';
import { toast } from 'react-toastify';

function YearTargetDialog({ open, data, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        targetCode: '',
        targetContent: '',
    });
    const [loading, setLoading] = useState(false);
    const [contextInfo, setContextInfo] = useState({
        mainFieldName: '',
        subFieldName: '',
        expectedResultDescription: '',
    });

    const isEditMode = data?.mode === 'edit';

    useEffect(() => {
        if (open && data) {
            if (isEditMode) {
                fetchExistingTarget();
            } else {
                generateNextTargetCode();
            }
            fetchContextInfo();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, data]);

    const fetchContextInfo = async () => {
        try {
            if (!data?.yearTargetId) return;

            const res = await schoolYearTargetApi.getDetails(data.yearTargetId);
            const yearTarget = res.data.data;

            const mainField = yearTarget.mainFields.find((mf) => mf.code === data.mainFieldCode);
            if (!mainField) return;

            let expectedResult;
            let subFieldName = '';

            if (data.subFieldCode) {
                const subField = mainField.subFields?.find((sf) => sf.code === data.subFieldCode);
                subFieldName = subField?.name || '';
                expectedResult = subField?.expectedResults?.find((er) => er.code === data.expectedResultCode);
            } else {
                expectedResult = mainField.expectedResults?.find((er) => er.code === data.expectedResultCode);
            }

            setContextInfo({
                mainFieldName: mainField.name,
                subFieldName,
                expectedResultDescription: expectedResult?.description || '',
            });
        } catch (error) {
            console.error('Error fetching context info:', error);
        }
    };

    const fetchExistingTarget = async () => {
        try {
            const res = await schoolYearTargetApi.getDetails(data.yearTargetId);
            const yearTarget = res.data.data;

            const mainField = yearTarget.mainFields.find((mf) => mf.code === data.mainFieldCode);
            if (!mainField) return;

            let expectedResult;
            if (data.subFieldCode) {
                const subField = mainField.subFields?.find((sf) => sf.code === data.subFieldCode);
                expectedResult = subField?.expectedResults?.find((er) => er.code === data.expectedResultCode);
            } else {
                expectedResult = mainField.expectedResults?.find((er) => er.code === data.expectedResultCode);
            }

            const target = expectedResult?.targets[data.targetIndex];
            if (target) {
                setFormData({
                    targetCode: target.code,
                    targetContent: target.content,
                });
            }
        } catch (error) {
            console.error('Error fetching target:', error);
            toast.error('Lỗi khi tải thông tin mục tiêu!');
        }
    };

    const generateNextTargetCode = async () => {
        try {
            if (!data?.yearTargetId) {
                setFormData({ targetCode: 'MT1', targetContent: '' });
                return;
            }

            const res = await schoolYearTargetApi.getDetails(data.yearTargetId);
            const yearTarget = res.data.data;

            let totalTargets = 0;
            yearTarget.mainFields.forEach((mainField) => {
                if (mainField.subFields && mainField.subFields.length > 0) {
                    mainField.subFields.forEach((subField) => {
                        subField.expectedResults?.forEach((expectedResult) => {
                            totalTargets += expectedResult.targets?.length || 0;
                        });
                    });
                } else {
                    mainField.expectedResults?.forEach((expectedResult) => {
                        totalTargets += expectedResult.targets?.length || 0;
                    });
                }
            });

            const nextNumber = totalTargets + 1;
            setFormData({ targetCode: `MT${nextNumber}`, targetContent: '' });
        } catch (error) {
            console.error('Error generating target code:', error);
            setFormData({ targetCode: 'MT1', targetContent: '' });
        }
    };

    const renumberAllTargets = (mainFields) => {
        let globalMtNumber = 1;

        mainFields.forEach((mainField) => {
            if (mainField.subFields && mainField.subFields.length > 0) {
                mainField.subFields.forEach((subField) => {
                    subField.expectedResults?.forEach((expectedResult) => {
                        if (expectedResult.targets) {
                            expectedResult.targets.forEach((target) => {
                                target.code = `MT${globalMtNumber++}`;
                            });
                        }
                    });
                });
            } else {
                mainField.expectedResults?.forEach((expectedResult) => {
                    if (expectedResult.targets) {
                        expectedResult.targets.forEach((target) => {
                            target.code = `MT${globalMtNumber++}`;
                        });
                    }
                });
            }
        });

        return mainFields;
    };

    const handleSubmit = async () => {
        if (!formData.targetContent.trim()) {
            toast.warning('Vui lòng nhập nội dung mục tiêu!');
            return;
        }

        try {
            setLoading(true);

            const res = await schoolYearTargetApi.getDetails(data.yearTargetId);
            const yearTarget = res.data.data;

            const updatedMainFields = JSON.parse(JSON.stringify(yearTarget.mainFields));

            const mainField = updatedMainFields.find((mf) => mf.code === data.mainFieldCode);
            if (!mainField) throw new Error('Main field not found');

            let expectedResult;
            if (data.subFieldCode) {
                const subField = mainField.subFields?.find((sf) => sf.code === data.subFieldCode);
                expectedResult = subField?.expectedResults?.find((er) => er.code === data.expectedResultCode);
            } else {
                expectedResult = mainField.expectedResults?.find((er) => er.code === data.expectedResultCode);
            }

            if (!expectedResult) throw new Error('Expected result not found');

            if (!expectedResult.targets) {
                expectedResult.targets = [];
            }

            const newTarget = {
                code: formData.targetCode,
                content: formData.targetContent,
            };

            if (isEditMode) {
                expectedResult.targets[data.targetIndex] = newTarget;
            } else {
                expectedResult.targets.push(newTarget);
            }

            const renumberedMainFields = renumberAllTargets(updatedMainFields);

            await schoolYearTargetApi.update(data.yearTargetId, { mainFields: renumberedMainFields });

            toast.success(isEditMode ? 'Cập nhật mục tiêu thành công!' : 'Thêm mục tiêu thành công!');
            onSuccess();
        } catch (error) {
            console.error('Error saving target:', error);
            toast.error('Lỗi khi lưu mục tiêu!');
        } finally {
            setLoading(false);
        }
    };

    if (!data) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: '#fff',
                    py: 1,
                    mb: 2,
                    position: 'relative',
                }}
            >
                <Typography variant="h6" fontWeight={600}>
                    {isEditMode ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu mới'}
                </Typography>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                >
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Context Info */}
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: '#e3f2fd',
                            borderRadius: 1,
                            border: '1px solid #90caf9',
                        }}
                    >
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            <strong>📚 Khối độ tuổi:</strong> {data.ageGroup}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Lĩnh vực phát triển:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ pl: 2, fontWeight: 500 }}>
                            {data.mainFieldCode}. {contextInfo.mainFieldName}
                        </Typography>

                        {contextInfo.subFieldName && (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    <strong>Lĩnh vực con:</strong>
                                </Typography>
                                <Typography variant="body2" color="text.primary" sx={{ pl: 2, fontWeight: 500 }}>
                                    {data.subFieldCode} {contextInfo.subFieldName}
                                </Typography>
                            </>
                        )}

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Kết quả mong đợi:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ pl: 2, fontWeight: 500 }}>
                            {data.expectedResultCode}. {contextInfo.expectedResultDescription}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Form nhập Nội dung mục tiêu */}
                    <TextField
                        label="Nội dung mục tiêu *"
                        value={formData.targetContent}
                        onChange={(e) => setFormData({ ...formData, targetContent: e.target.value })}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="VD: Trẻ bắt chước được 1 số động tác theo cô: Giơ cao tay – đưa về phía trước – sang ngang."
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                            },
                        }}
                    />
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default YearTargetDialog;

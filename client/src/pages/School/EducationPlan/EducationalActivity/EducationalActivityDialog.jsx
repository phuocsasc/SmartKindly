// client/src/pages/School/EducationPlan/EducationalActivity/EducationalActivityDialog.jsx

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
import { schoolYearTargetApi, schoolEducationalActivityApi } from '~/apis';
import { toast } from 'react-toastify';

function EducationalActivityDialog({ open, data, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        activityContent: '',
    });
    const [loading, setLoading] = useState(false);
    const [contextInfo, setContextInfo] = useState({
        mainFieldName: '',
        subFieldName: '',
        expectedResultDescription: '',
        targetContent: '',
    });

    const isEditMode = data?.mode === 'edit';

    useEffect(() => {
        if (open && data) {
            fetchContextInfo();
            if (isEditMode) {
                fetchExistingActivity();
            } else {
                setFormData({ activityContent: '' });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, data]);

    const fetchContextInfo = async () => {
        try {
            if (!data?.schoolYearTargetId) return;

            const res = await schoolYearTargetApi.getDetails(data.schoolYearTargetId);
            const yearTarget = res.data.data;

            const mainField = yearTarget.mainFields.find((mf) => mf.code === data.mainFieldCode);
            if (!mainField) return;

            let expectedResult;
            let subFieldName = '';
            let targetContent = '';

            if (data.subFieldCode) {
                const subField = mainField.subFields?.find((sf) => sf.code === data.subFieldCode);
                subFieldName = subField?.name || '';
                expectedResult = subField?.expectedResults?.find((er) => er.code === data.expectedResultCode);
            } else {
                expectedResult = mainField.expectedResults?.find((er) => er.code === data.expectedResultCode);
            }

            const target = expectedResult?.targets?.find((t) => t.code === data.targetCode);
            targetContent = target?.content || '';

            setContextInfo({
                mainFieldName: mainField.name,
                subFieldName,
                expectedResultDescription: expectedResult?.description || '',
                targetContent,
            });
        } catch (error) {
            console.error('Error fetching context info:', error);
        }
    };

    const fetchExistingActivity = async () => {
        try {
            const res = await schoolEducationalActivityApi.getDetails(data.activityId);
            const activity = res.data.data;
            setFormData({ activityContent: activity.activityContent });
        } catch (error) {
            console.error('Error fetching existing activity:', error);
            toast.error('Lỗi khi tải thông tin hoạt động!');
        }
    };

    const handleSubmit = async () => {
        if (!formData.activityContent.trim()) {
            toast.warning('Vui lòng nhập nội dung hoạt động!');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                academicYearId: data.academicYearId,
                ageGroup: data.ageGroup,
                schoolYearTargetId: data.schoolYearTargetId,
                mainFieldCode: data.mainFieldCode,
                subFieldCode: data.subFieldCode || null,
                expectedResultCode: data.expectedResultCode,
                targetId: data.targetId, // ✅ Send targetId instead of targetCode
                activityContent: formData.activityContent,
            };

            if (isEditMode) {
                await schoolEducationalActivityApi.update(data.activityId, {
                    activityContent: formData.activityContent,
                });
                toast.success('Cập nhật hoạt động giáo dục thành công!');
            } else {
                await schoolEducationalActivityApi.create(payload);
                toast.success('Thêm hoạt động giáo dục thành công!');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving activity:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi lưu hoạt động giáo dục!');
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
                    color: 'white',
                    py: 1,
                    mb: 2,
                    position: 'relative',
                }}
            >
                <Typography variant="h6" fontWeight={600}>
                    {isEditMode ? 'Chỉnh sửa hoạt động giáo dục' : 'Thêm hoạt động giáo dục mới'}
                </Typography>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: '#fff',
                    }}
                >
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    py: 2.5,
                    maxHeight: '75vh',
                    overflowY: 'auto',
                    mt: -2,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                    '& label.Mui-focused': { color: '#667eea' },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Context Info */}
                    <Box
                        sx={{
                            p: 2,
                            mt: 2,
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

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Mục tiêu:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ pl: 2, fontWeight: 500 }}>
                            {data.targetCode}. {contextInfo.targetContent}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Form nhập Nội dung hoạt động */}
                    <TextField
                        label="Nội dung hoạt động giáo dục *"
                        value={formData.activityContent}
                        onChange={(e) => setFormData({ activityContent: e.target.value })}
                        fullWidth
                        multiline
                        rows={8}
                        placeholder={`Ví dụ:\n- Động tác phát triển các nhóm cơ và hô hấp:\n+ Hô hấp: tập hít thở.\n+ Tay: Giơ cao, đưa ra phía trước, đưa sang ngang, đưa ra sau.\n+ Lưng, bụng, lườn: Cúi về phía trước, nghiêng người sang 2 bên.\n+ Chân: Dang sang 2 bên, ngồi xuống, đứng lên.`}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                            },
                        }}
                    />

                    <Typography variant="caption" color="text.secondary">
                        💡 <strong>Lưu ý:</strong> Nội dung sẽ giữ nguyên định dạng (dấu cách, xuống dòng, dấu gạch đầu
                        dòng...).
                    </Typography>
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
                    variant="contained"
                    disabled={loading}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 2,
                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EducationalActivityDialog;

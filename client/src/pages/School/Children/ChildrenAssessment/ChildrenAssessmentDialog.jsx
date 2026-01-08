// client/src/pages/School/Children/ChildrenAssessment/ChildrenAssessmentDialog.jsx

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    IconButton,
    Avatar,
    CircularProgress,
    Chip,
    Stack,
    Grid,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';

// Icons cho từng mục
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SchoolIcon from '@mui/icons-material/School';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonIcon from '@mui/icons-material/Person';

import { childrenDailyAssessmentApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

// ✅ Dữ liệu gợi ý nhanh (Giúp giáo viên chọn nhanh)
const SUGGESTIONS = {
    health: ['Sức khỏe tốt', 'Ăn hết suất', 'Kén ăn', 'Ngủ ngon', 'Hơi mệt', 'Ho nhẹ', 'Sốt nhẹ'],
    emotion: ['Vui vẻ', 'Hòa đồng', 'Tích cực', 'Ngoan ngoãn', 'Hơi quấy', 'Khóc nhè'],
    skills: [
        'Tập trung',
        'Tiếp thu nhanh',
        'Hăng hái phát biểu',
        'Hoàn thành bài tập',
        'Cần cố gắng',
        'Thích nghe kể chuyện',
    ],
};

// Component con để render từng phần nhập liệu cho gọn code
const AssessmentInputSection = ({ icon, title, value, onChange, placeholder, suggestions = [] }) => {
    const handleAddSuggestion = (text) => {
        const newValue = value ? `${value}, ${text}` : text;
        onChange(newValue);
    };

    return (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.50', color: 'primary.main' }}>{icon}</Avatar>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    {title}
                </Typography>
            </Box>

            {/* Gợi ý nhanh */}
            {suggestions.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }} useFlexGap>
                    {suggestions.map((s) => (
                        <Chip
                            key={s}
                            label={s}
                            size="small"
                            onClick={() => handleAddSuggestion(s)}
                            clickable
                            sx={{ borderRadius: 1, bgcolor: 'action.hover' }}
                        />
                    ))}
                </Stack>
            )}

            <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                variant="outlined"
                size="small"
                inputProps={{ spellCheck: 'false' }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                    },
                }}
            />
        </Paper>
    );
};

function ChildrenAssessmentDialog({
    open,
    studentInfo,
    classId,
    academicYearId,
    date,
    existingAssessment,
    onClose,
    onSuccess,
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        healthStatus: '',
        emotionalBehavior: '',
        skillsKnowledge: '',
        notes: '',
    });

    const isEditMode = !!existingAssessment;

    // ✅ Initialize form data
    useEffect(() => {
        if (open) {
            if (existingAssessment) {
                setFormData({
                    healthStatus: existingAssessment.healthStatus || '',
                    emotionalBehavior: existingAssessment.emotionalBehavior || '',
                    skillsKnowledge: existingAssessment.skillsKnowledge || '',
                    notes: existingAssessment.notes || '',
                });
            } else {
                setFormData({
                    healthStatus: '',
                    emotionalBehavior: '',
                    skillsKnowledge: '',
                    notes: '',
                });
            }
        }
    }, [open, existingAssessment]);

    // ✅ Handle submit
    const handleSubmit = async () => {
        if (!formData.healthStatus.trim()) return toast.warning('Vui lòng nhập tình trạng sức khỏe!');
        if (!formData.emotionalBehavior.trim()) return toast.warning('Vui lòng nhập cảm xúc/hành vi!');
        if (!formData.skillsKnowledge.trim()) return toast.warning('Vui lòng nhập kiến thức/kỹ năng!');

        try {
            setLoading(true);
            const payload = {
                academicYearId,
                classId,
                studentId: studentInfo.studentId,
                date: dayjs(date).format('YYYY-MM-DD'),
                ...formData,
            };

            if (isEditMode) {
                await childrenDailyAssessmentApi.update(existingAssessment._id, formData);
                toast.success('Cập nhật đánh giá thành công!');
            } else {
                await childrenDailyAssessmentApi.create(payload);
                toast.success('Thêm đánh giá thành công!');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving assessment:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi lưu đánh giá!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle delete
    const handleDelete = async () => {
        if (!existingAssessment?._id) return;
        // if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return;

        try {
            setLoading(true);
            await childrenDailyAssessmentApi.delete(existingAssessment._id);
            toast.success('Xóa đánh giá thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Lỗi khi xóa đánh giá!');
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
                sx: { borderRadius: 3, overflow: 'hidden' },
            }}
        >
            {/* 1. Header hiện đại */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                        {isEditMode ? <EditIcon /> : <NoteAltIcon />}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                            {isEditMode ? 'Cập nhật đánh giá' : 'Đánh giá hằng ngày'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            Ghi nhận quá trình phát triển của trẻ
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent
                sx={{
                    p: 0,
                    bgcolor: '#f4f6f8',

                    // --- STYLE THANH CUỘN (SCROLLBAR) ---
                    '&::-webkit-scrollbar': {
                        width: '8px', // Độ rộng của thanh cuộn
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f1f1f1', // Màu nền rãnh trượt (xám nhạt)
                        borderLeft: '1px solid #e0e0e0',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'primary.main', // ✅ Màu chính đồng bộ với Header
                        borderRadius: '4px', // Bo tròn góc
                        border: '2px solid #f1f1f1', // Viền trắng tạo khoảng cách giúp thanh cuộn đẹp hơn
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: 'primary.dark', // Màu đậm hơn khi rê chuột vào
                    },
                    // Dành cho Firefox (nếu cần hỗ trợ)
                    scrollbarWidth: 'thin',
                    scrollbarColor: (theme) => `${theme.palette.primary.main} #f1f1f1`,
                }}
            >
                {/* 2. Thông tin học sinh & Ngày tháng */}
                <Box sx={{ bgcolor: 'white', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', width: 36, height: 36 }}>
                                    <PersonIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Học sinh
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {studentInfo?.fullName}{' '}
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            ({studentInfo?.studentCode})
                                        </Typography>
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                justifyContent={{ sm: 'flex-end' }}
                            >
                                <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', width: 36, height: 36 }}>
                                    <CalendarTodayOutlinedIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Thời gian
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {dayjs(date).format('DD/MM/YYYY')} - {dayjs(date).format('dddd')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                {/* 3. Khu vực Form nhập liệu */}
                <Box sx={{ p: 3 }}>
                    <AssessmentInputSection
                        icon={<HealthAndSafetyIcon fontSize="small" />}
                        title="1. Tình trạng sức khỏe"
                        placeholder="Nhập tình trạng ăn, ngủ, sức khỏe của trẻ..."
                        value={formData.healthStatus}
                        onChange={(val) => setFormData({ ...formData, healthStatus: val })}
                        suggestions={SUGGESTIONS.health}
                    />

                    <AssessmentInputSection
                        icon={<SentimentSatisfiedAltIcon fontSize="small" />}
                        title="2. Cảm xúc & Hành vi"
                        placeholder="Nhập thái độ, cảm xúc, mức độ hòa đồng..."
                        value={formData.emotionalBehavior}
                        onChange={(val) => setFormData({ ...formData, emotionalBehavior: val })}
                        suggestions={SUGGESTIONS.emotion}
                    />

                    <AssessmentInputSection
                        icon={<SchoolIcon fontSize="small" />}
                        title="3. Kiến thức & Kỹ năng"
                        placeholder="Nhập khả năng tiếp thu bài học, kỹ năng vận động..."
                        value={formData.skillsKnowledge}
                        onChange={(val) => setFormData({ ...formData, skillsKnowledge: val })}
                        suggestions={SUGGESTIONS.skills}
                    />

                    <AssessmentInputSection
                        icon={<NoteAltIcon fontSize="small" />}
                        title="4. Ghi chú thêm (Nếu có)"
                        placeholder="Lưu ý riêng cho phụ huynh..."
                        value={formData.notes}
                        onChange={(val) => setFormData({ ...formData, notes: val })}
                    />
                </Box>
            </DialogContent>

            {/* 4. Actions Footer */}
            <DialogActions sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
                {isEditMode && existingAssessment?._id && (
                    <Button
                        onClick={handleDelete}
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        disabled={loading}
                        sx={{ mr: 'auto', borderRadius: 2, textTransform: 'none' }}
                    >
                        Xóa
                    </Button>
                )}

                <Button
                    onClick={onClose}
                    variant="text"
                    color="inherit"
                    disabled={loading}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
                >
                    Hủy bỏ
                </Button>

                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 4,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                >
                    {isEditMode ? 'Cập nhật' : 'Lưu lại'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenAssessmentDialog;

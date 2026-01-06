// client/src/pages/School/Nutrition/MenuApply/MenuApplyCopyDialog.jsx

import { useState } from 'react';
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
    Alert,
    Grid,
    Paper,
    CircularProgress,
    alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CalendarMonthTwoToneIcon from '@mui/icons-material/CalendarMonthTwoTone';
import Filter1TwoToneIcon from '@mui/icons-material/Filter1TwoTone';
import Filter2TwoToneIcon from '@mui/icons-material/Filter2TwoTone';
import EventRepeatTwoToneIcon from '@mui/icons-material/EventRepeatTwoTone';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { toast } from 'react-toastify';

// Component thẻ chọn tùy chỉnh
const SelectionCard = ({ selected, onClick, title, description, icon, color }) => {
    return (
        <Paper
            elevation={selected ? 2 : 0}
            onClick={onClick}
            sx={{
                p: 1.5,
                cursor: 'pointer',
                borderRadius: 2.5,
                border: '2px solid',
                borderColor: selected ? color : 'transparent',
                bgcolor: selected ? alpha(color, 0.05) : '#f8f9fa',
                transition: 'all 0.2s ease-in-out',
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                    bgcolor: alpha(color, 0.08),
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Avatar
                    variant="rounded"
                    sx={{
                        bgcolor: alpha(color, 0.15),
                        color: color,
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                    }}
                >
                    {icon}
                </Avatar>
                {selected ? (
                    <CheckCircleRoundedIcon sx={{ color: color, fontSize: 20 }} />
                ) : (
                    <RadioButtonUncheckedRoundedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                )}
            </Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2d3748' }}>
                {title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3, mt: 0.5, display: 'block' }}>
                {description}
            </Typography>
        </Paper>
    );
};

function MenuApplyCopyDialog({ open, copyInfo, onClose, onConfirm }) {
    // Đã xóa const theme = useTheme(); vì không dùng tới
    const [selectedOption, setSelectedOption] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        if (isSubmitting) return;
        setSelectedOption('all');
        onClose();
    };

    const handleConfirm = async () => {
        if (!selectedOption) {
            toast.warning('Vui lòng chọn phạm vi nhân bản!');
            return;
        }

        try {
            setIsSubmitting(true);
            await onConfirm(selectedOption);
            handleClose();
        } catch (error) {
            console.error('❌ Error copying menu applies:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate target weeks info
    const getTargetWeeksInfo = () => {
        if (!copyInfo) return { count: 0, weeks: [] };

        // Đã xóa totalWeeks khỏi destructuring vì không dùng trong logic này
        const { currentWeek, weeks } = copyInfo;
        const remainingWeeks = weeks.filter((w) => w.weekNumber > currentWeek);

        let targetWeeks = [];
        switch (selectedOption) {
            case 'all':
                targetWeeks = remainingWeeks;
                break;
            case 'odd':
                targetWeeks = remainingWeeks.filter((w) => w.weekNumber % 2 !== 0);
                break;
            case 'even':
                targetWeeks = remainingWeeks.filter((w) => w.weekNumber % 2 === 0);
                break;
            default:
                targetWeeks = [];
        }

        return {
            count: targetWeeks.length,
            weeks: targetWeeks,
        };
    };

    const targetInfo = getTargetWeeksInfo();
    const primaryColor = '#667eea';

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
                },
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            width: 36,
                            height: 36,
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        <ContentCopyIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} fontSize="1.1rem">
                        Nhân bản thực đơn
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    disabled={isSubmitting}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                >
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2.5, bgcolor: '#fff', mt: 2 }}>
                {/* 1. COMPACT Source Info Banner */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: '#f1f5f9',
                        borderRadius: 2,
                        p: 1.5,
                        mb: 2.5,
                        border: '1px solid #e2e8f0',
                        flexWrap: 'wrap',
                        gap: 1,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoOutlinedIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                            Nguồn gốc: <strong style={{ color: '#2d3748' }}>Tuần {copyInfo?.currentWeek}</strong>
                        </Typography>
                    </Box>

                    {/* <Box sx={{ width: 1, height: 16, bgcolor: '#cbd5e0', display: { xs: 'none', sm: 'block' } }} /> */}

                    <Typography variant="body2" color="text.secondary">
                        Nhóm tuổi: <strong style={{ color: '#2d3748' }}>{copyInfo?.ageGroup || '—'}</strong>
                    </Typography>

                    {/* <Box sx={{ width: 1, height: 16, bgcolor: '#cbd5e0', display: { xs: 'none', sm: 'block' } }} /> */}

                    <Typography variant="body2" color="text.secondary">
                        Tổng số tuần trong năm:{' '}
                        <strong style={{ color: '#2d3748' }}>{copyInfo?.totalWeeks} tuần</strong>
                    </Typography>
                </Box>

                {/* 2. Selection Options */}
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#4a5568' }}>
                    Chọn phạm vi áp dụng
                </Typography>

                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    <Grid item xs={12} sm={4}>
                        <SelectionCard
                            selected={selectedOption === 'all'}
                            onClick={() => setSelectedOption('all')}
                            title="Tất cả tuần sau"
                            description={`Sao chép liên tiếp sang ${
                                copyInfo?.totalWeeks - copyInfo?.currentWeek
                            } tuần còn lại.`}
                            icon={<EventRepeatTwoToneIcon fontSize="small" />}
                            color={primaryColor}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <SelectionCard
                            selected={selectedOption === 'odd'}
                            onClick={() => setSelectedOption('odd')}
                            title="Chỉ tuần Lẻ"
                            description="Chỉ áp dụng cho tuần số lẻ (VD: 21, 23...)"
                            icon={<Filter1TwoToneIcon fontSize="small" />}
                            color="#ed8936"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <SelectionCard
                            selected={selectedOption === 'even'}
                            onClick={() => setSelectedOption('even')}
                            title="Chỉ tuần Chẵn"
                            description="Chỉ áp dụng cho tuần số chẵn (VD: 22, 24...)"
                            icon={<Filter2TwoToneIcon fontSize="small" />}
                            color="#48bb78"
                        />
                    </Grid>
                </Grid>

                {/* 3. Result Preview & Warning */}
                {selectedOption && (
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: alpha(primaryColor, 0.05),
                            borderRadius: 2,
                            border: `1px dashed ${alpha(primaryColor, 0.3)}`,
                            display: 'flex',
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        <Avatar
                            sx={{
                                bgcolor: 'white',
                                color: primaryColor,
                                width: 40,
                                height: 40,
                                border: `1px solid ${alpha(primaryColor, 0.2)}`,
                            }}
                        >
                            <CalendarMonthTwoToneIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1, minHeight: 80 }}>
                            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                                Sẽ sao chép sang {targetInfo.count} tuần
                            </Typography>
                            {targetInfo.weeks.length > 0 ? (
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    <strong>Chi tiết các Tuần áp dụng:</strong>{' '}
                                    {targetInfo.weeks.map((w) => w.weekNumber).join(', ')}
                                </Typography>
                            ) : (
                                <Typography variant="caption" color="error.main">
                                    Không tìm thấy tuần phù hợp nào tiếp theo.
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}

                <Alert
                    icon={<WarningAmberRoundedIcon />}
                    severity="warning"
                    sx={{
                        py: 0,
                        alignItems: 'center',
                        borderRadius: 2,
                        bgcolor: '#fffaf0',
                        color: '#9c4221',
                        border: '1px solid #feebc8',
                        '& .MuiAlert-message': { fontSize: '1rem' },
                    }}
                >
                    - Dữ liệu thực đơn tại các Tuần áp dụng sẽ bị ghi đè (nếu có). <br />- Các Ngày nghỉ sẽ tự động được
                    bỏ qua.
                </Alert>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
                <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{ borderRadius: 1.5, px: 2.5, textTransform: 'none', fontWeight: 600 }}
                >
                    Hủy bỏ
                </Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={isSubmitting || targetInfo.count === 0}
                    size="small"
                    startIcon={
                        isSubmitting ? <CircularProgress size={16} color="inherit" /> : <ContentCopyIcon size="small" />
                    }
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
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận nhân bản'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default MenuApplyCopyDialog;

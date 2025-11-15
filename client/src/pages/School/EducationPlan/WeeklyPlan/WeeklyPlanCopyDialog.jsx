import { useState } from 'react';
import {
    Dialog,
    DialogActions,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    Alert,
    Button,
    IconButton,
    Divider,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function WeeklyPlanCopyDialog({ open, onClose, onConfirm, copyInfo }) {
    const selectedWeek = Number(copyInfo?.selectedWeek) || 0;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        try {
            setIsSubmitting(true);
            // onConfirm có thể là async hoặc sync, await đều xử lý được
            await onConfirm();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return; // đang copy thì không cho đóng
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    p: 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 6,
                },
            }}
        >
            {/* Nút đóng */}
            <IconButton
                onClick={handleClose}
                size="small"
                disabled={isSubmitting}
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: 'white',
                    '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                    zIndex: 1,
                }}
            >
                <CloseIcon sx={{ color: 'red' }} />
            </IconButton>

            {/* Tiêu đề */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: 'white',
                    py: 1,
                    mb: 2,
                    position: 'relative',
                }}
            >
                <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                    Copy kế hoạch tuần
                </Typography>
            </DialogTitle>

            {/* Nội dung */}
            <DialogContent sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
                <Typography variant="body2" sx={{ mb: 2 }} component="span" fontWeight={600}>
                    Bạn có chắc chắn muốn copy kế hoạch giáo dục
                </Typography>

                {/* Khung thông tin */}
                <Box
                    sx={{
                        bgcolor: '#f9fafb',
                        borderRadius: 1.5,
                        border: '1px solid #e0e7ff',
                        mt: 2,
                        px: 2,
                        py: 1.5,
                        mb: 1.8,
                    }}
                >
                    <Box sx={{ display: 'flex', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80 }}>
                            Lớp:
                        </Typography>
                        <Typography variant="body2">{copyInfo?.className || '—'}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80 }}>
                            Tuần:
                        </Typography>
                        <Typography variant="body2">Tuần {copyInfo?.selectedWeek}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80 }}>
                            Copy tới:
                        </Typography>
                        <Typography variant="body2">
                            {copyInfo?.remainingWeeks} tuần tiếp theo (tuần {selectedWeek + 1} – tuần{' '}
                            {copyInfo?.totalWeeks})
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 1.8 }} />

                {/* Cảnh báo */}
                <Alert
                    severity="warning"
                    sx={{
                        borderRadius: 1.5,
                        fontSize: '0.85rem',
                        '& .MuiAlert-icon': { mt: '2px' },
                    }}
                >
                    <Typography variant="body2">
                        <strong>Lưu ý:</strong> Dữ liệu kế hoạch hiện tại của các tuần sau sẽ{' '}
                        <Typography component="span" fontWeight={700}>
                            bị ghi đè
                        </Typography>
                        . Hãy chắc chắn trước khi tiếp tục.
                    </Typography>
                </Alert>
            </DialogContent>

            {/* Nút hành động */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    disabled={isSubmitting}
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
                    onClick={handleConfirm}
                    variant="contained"
                    size="small"
                    disabled={isSubmitting}
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
                    {isSubmitting ? (
                        <>
                            <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
                            Đang copy...
                        </>
                    ) : (
                        'Xác nhận copy'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default WeeklyPlanCopyDialog;

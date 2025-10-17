import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, IconButton } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

const SEVERITY_CONFIG = {
    warning: {
        icon: WarningAmberIcon,
        color: '#ff9800',
        bgColor: '#fff3e0',
    },
    error: {
        icon: ErrorOutlineIcon,
        color: '#f44336',
        bgColor: '#ffebee',
    },
    info: {
        icon: InfoOutlinedIcon,
        color: '#2196f3',
        bgColor: '#e3f2fd',
    },
};

function ConfirmDialog({
    open,
    title = 'Xác nhận',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    severity = 'warning',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    onConfirm,
    onCancel,
    loading = false,
}) {
    const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.warning;
    const Icon = config.icon;

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: 3,
                },
            }}
        >
            {/* Close button */}
            <IconButton
                onClick={onCancel}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'grey.500',
                }}
            >
                <CloseIcon />
            </IconButton>

            <DialogTitle sx={{ pb: 1, pr: 5 }}>
                <Typography variant="h6" fontWeight={600}>
                    {title}
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                    }}
                >
                    {/* Icon */}
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: config.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Icon sx={{ fontSize: 28, color: config.color }} />
                    </Box>

                    {/* Message */}
                    <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
                        {message}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={onCancel} disabled={loading} variant="outlined" color="inherit">
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    color={severity === 'error' ? 'error' : 'primary'}
                    autoFocus
                >
                    {loading ? 'Đang xử lý...' : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;

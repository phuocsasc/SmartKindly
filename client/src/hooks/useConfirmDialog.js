import { useState } from 'react';

export const useConfirmDialog = () => {
    const [dialogState, setDialogState] = useState({
        open: false,
        title: 'Xác nhận',
        message: '',
        severity: 'warning',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        onConfirm: null,
        loading: false,
    });

    const showConfirm = ({
        title = 'Xác nhận',
        message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
        severity = 'warning',
        confirmText = 'Xác nhận',
        cancelText = 'Hủy',
        onConfirm,
    }) => {
        return new Promise((resolve) => {
            setDialogState({
                open: true,
                title,
                message,
                severity,
                confirmText,
                cancelText,
                onConfirm: async () => {
                    setDialogState((prev) => ({ ...prev, loading: true }));
                    try {
                        if (onConfirm) {
                            await onConfirm();
                        }
                        resolve(true);
                    } catch (error) {
                        resolve(false);
                        throw error;
                    } finally {
                        setDialogState((prev) => ({ ...prev, open: false, loading: false }));
                    }
                },
                loading: false,
            });
        });
    };

    const handleCancel = () => {
        setDialogState((prev) => ({ ...prev, open: false }));
    };

    return {
        dialogState,
        showConfirm,
        handleCancel,
    };
};

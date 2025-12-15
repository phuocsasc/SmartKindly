// client/src/pages/Admin/DataBank/Food/ImportFoodDialog.jsx

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
    Alert,
    LinearProgress,
    // Chip,
    Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import * as XLSX from 'xlsx';
import { foodApi } from '~/apis/foodApi';
import { exportFoodsToExcel } from '~/utils/foodExcelExport';
import { toast } from 'react-toastify';

// const CATEGORY_MAP = {
//     category_dongvat: 'Động vật',
//     category_thucvat: 'Thực vật',
//     category_kho: 'Thực phẩm Khô',
//     category_tuoi: 'Thực phẩm tươi',
//     category_anlien: 'Thực phẩm ăn liền',
// };

function ImportFoodDialog({ open, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);

    // ✅ Download template
    const handleDownloadTemplate = async () => {
        try {
            await exportFoodsToExcel([]);
            toast.success('Tải file Excel mẫu thành công!');
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Lỗi khi tải file mẫu!');
        }
    };

    // ✅ Handle file selection
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error('Vui lòng chọn file Excel (.xlsx, .xls)!');
            return;
        }

        setFile(selectedFile);
        parseExcelFile(selectedFile);
    };

    // ✅ Parse Excel file
    const parseExcelFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Parse from row 6 (header ở row 6, data từ row 7)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    range: 5,
                    header: 1,
                    defval: '',
                });

                console.log('📊 Raw Excel Data:', jsonData.slice(0, 3));

                if (jsonData.length <= 1) {
                    toast.error('File Excel không có dữ liệu!');
                    return;
                }

                // Map data từ row 7
                const mappedData = jsonData
                    .slice(1)
                    .map((row, index) => {
                        const excelRowNumber = index + 7;

                        // ✅ Parse categories (5 cột riêng)
                        const categories = [];
                        if (
                            String(row[5] || '')
                                .toLowerCase()
                                .trim() === 'x'
                        )
                            categories.push('Động vật');
                        if (
                            String(row[6] || '')
                                .toLowerCase()
                                .trim() === 'x'
                        )
                            categories.push('Thực vật');
                        if (
                            String(row[7] || '')
                                .toLowerCase()
                                .trim() === 'x'
                        )
                            categories.push('Thực phẩm Khô');
                        if (
                            String(row[8] || '')
                                .toLowerCase()
                                .trim() === 'x'
                        )
                            categories.push('Thực phẩm tươi');
                        if (
                            String(row[9] || '')
                                .toLowerCase()
                                .trim() === 'x'
                        )
                            categories.push('Thực phẩm ăn liền');

                        return {
                            rowNumber: excelRowNumber,
                            name: String(row[1] || '').trim(),
                            unitPrice: parseInt(row[2]) || 0, // ✅ THÊM (Cột C, index 2)
                            unit: String(row[3] || 'Kg').trim(), // ✅ Dịch từ cột 2 → 3
                            gramConversion: Number(row[4]) || 0, // ✅ Dịch từ cột 3 → 4
                            categories,
                            wastePercentage: Number(row[10]) || 0, // ✅ Dịch từ 9 → 10
                            protein: Number(row[11]) || 0, // ✅ Dịch từ 10 → 11
                            lipid: Number(row[12]) || 0, // ✅ Dịch từ 11 → 12
                            glucid: Number(row[13]) || 0, // ✅ Dịch từ 12 → 13
                        };
                    })
                    .filter((row) => row.name !== '');

                console.log('✅ Mapped Data (chỉ dòng có tên):', mappedData.slice(0, 3));

                if (mappedData.length === 0) {
                    toast.error('File Excel không có thực phẩm nào hợp lệ (thiếu tên)!');
                    return;
                }

                // Validate
                const errors = validateImportData(mappedData);
                setValidationErrors(errors);
                setPreviewData(mappedData);

                if (errors.length > 0) {
                    toast.error(`Phát hiện ${errors.length} dòng dữ liệu không hợp lệ!`);
                } else {
                    toast.success(`✅ Phát hiện ${mappedData.length} thực phẩm hợp lệ!`);
                }
            } catch (error) {
                console.error('❌ Error parsing Excel:', error);
                toast.error('Lỗi khi đọc file Excel!');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // ✅ Validate data
    const validateImportData = (data) => {
        const errors = [];

        data.forEach((row) => {
            const rowErrors = [];

            // Required fields (CHỈ VALIDATE CÁC DÒNG ĐÃ CÓ TÊN)
            if (!row.name || row.name.trim() === '') {
                rowErrors.push('Thiếu tên thực phẩm');
            }
            if (row.unitPrice < 0) {
                rowErrors.push('Đơn giá phải ≥ 0');
            }
            if (!row.unit || row.unit.trim() === '') {
                rowErrors.push('Thiếu đơn vị tính');
            }
            if (!row.gramConversion || row.gramConversion < 1 || row.gramConversion > 1000) {
                rowErrors.push('Quy đổi sang gam phải từ 1 đến 1000');
            }
            if (!row.categories || row.categories.length === 0) {
                rowErrors.push('Phải chọn ít nhất 1 loại thực phẩm (đánh dấu x)');
            }
            if (row.wastePercentage < 0 || row.wastePercentage > 99) {
                rowErrors.push('Hệ số thái bỏ phải từ 0 đến 99');
            }
            if (row.protein < 0) {
                rowErrors.push('Protein phải ≥ 0');
            }
            if (row.lipid < 0) {
                rowErrors.push('Lipid phải ≥ 0');
            }
            if (row.glucid < 0) {
                rowErrors.push('Glucid phải ≥ 0');
            }

            if (rowErrors.length > 0) {
                errors.push({
                    row: row.rowNumber,
                    name: row.name || '(Chưa có tên)',
                    errors: rowErrors,
                });
            }
        });

        return errors;
    };

    // ✅ Upload
    const handleUpload = async () => {
        if (!previewData || previewData.length === 0) {
            toast.error('Vui lòng chọn file Excel có dữ liệu!');
            return;
        }

        if (validationErrors.length > 0) {
            toast.error('Dữ liệu không hợp lệ, vui lòng kiểm tra lại!');
            return;
        }

        try {
            setLoading(true);

            // eslint-disable-next-line no-unused-vars
            const dataToSubmit = previewData.map(({ rowNumber, ...rest }) => rest);

            const res = await foodApi.importBulk(dataToSubmit);
            const { created, errors } = res.data.data;

            if (errors && errors.length > 0) {
                setValidationErrors(
                    errors.map((e) => ({
                        row: e.row,
                        name: e.name,
                        errors: [e.error],
                    })),
                );
                toast.warning(`Import thành công ${created.length} thực phẩm, ${errors.length} lỗi`);
            } else {
                toast.success(`Import thành công ${created.length} thực phẩm!`);
                handleClose();
                onSuccess();
            }
        } catch (error) {
            console.error('Error uploading:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải lên!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreviewData(null);
        setValidationErrors([]);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: '#fff',
                    py: 1,
                    position: 'relative',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <CloudUploadIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Nhập danh sách thực phẩm từ Excel
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                >
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ px: 3, py: 2.5 }}>
                {/* Step 1: Download template */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Bước 1: Tải file Excel mẫu
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleDownloadTemplate}
                        sx={{ borderRadius: 1.5, borderColor: '#0071bc', color: '#0071bc' }}
                    >
                        Tải file Excel mẫu
                    </Button>
                </Box>

                {/* Step 2: Upload */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Bước 2: Chọn file Excel đã nhập dữ liệu
                    </Typography>
                    <Box
                        sx={{
                            border: '2px dashed #667eea',
                            borderRadius: 2,
                            p: 3,
                            textAlign: 'center',
                            bgcolor: '#f5f5ff',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#ebebff' },
                        }}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <CloudUploadIcon sx={{ fontSize: 48, color: '#667eea', mb: 1 }} />
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                            {file ? file.name : 'Chọn file Excel'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Hoặc kéo thả file vào đây
                        </Typography>
                    </Box>
                </Box>

                {/* Preview & Validation */}
                {previewData && (
                    <Box>
                        <Alert
                            severity={validationErrors.length === 0 ? 'success' : 'error'}
                            icon={validationErrors.length === 0 ? <CheckCircleIcon /> : <ErrorIcon />}
                            sx={{ mb: 2 }}
                        >
                            {validationErrors.length === 0 ? (
                                <Typography variant="body2">
                                    Phát hiện <strong>{previewData.length}</strong> thực phẩm hợp lệ
                                </Typography>
                            ) : (
                                <Typography variant="body2">
                                    ❌ Có <strong>{validationErrors.length}</strong> dòng dữ liệu không hợp lệ
                                </Typography>
                            )}
                        </Alert>

                        {/* Show errors */}
                        {validationErrors.length > 0 && (
                            <Box
                                sx={{
                                    maxHeight: 200,
                                    overflowY: 'auto',
                                    border: '1px solid #f44336',
                                    borderRadius: 1,
                                    p: 1,
                                    bgcolor: '#ffebee',
                                }}
                            >
                                {validationErrors.map((error, idx) => (
                                    <Box key={idx} sx={{ mb: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            Dòng {error.row}: {error.name}
                                        </Typography>
                                        {error.errors.map((err, i) => (
                                            <Typography key={i} variant="caption" color="error" sx={{ ml: 2 }}>
                                                • {err}
                                            </Typography>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Show preview */}
                        {/* {validationErrors.length === 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                    Xem trước dữ liệu:
                                </Typography>
                                <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', p: 1 }}>
                                    {previewData.slice(0, 5).map((item, idx) => (
                                        <Box key={idx} sx={{ mb: 1, pb: 1, borderBottom: '1px solid #eee' }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.name}
                                            </Typography>
                                            <Typography variant="caption">
                                                Đơn vị: {item.unit} | Quy đổi: {item.gramConversion}g | Loại:{' '}
                                                {item.categories.map((c, i) => (
                                                    <Chip key={i} label={c} size="small" sx={{ ml: 0.5 }} />
                                                ))}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {previewData.length > 5 && (
                                        <Typography variant="caption" color="text.secondary">
                                            ... và {previewData.length - 5} thực phẩm khác
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        )} */}
                    </Box>
                )}

                {/* Loading */}
                {loading && <LinearProgress sx={{ mt: 2 }} />}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{ borderRadius: 1.5, px: 2.5, textTransform: 'none', fontWeight: 600 }}
                >
                    Hủy bỏ
                </Button>
                <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={loading || !previewData || validationErrors.length > 0}
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
                    {loading ? 'Đang tải lên...' : 'Tải lên'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ImportFoodDialog;

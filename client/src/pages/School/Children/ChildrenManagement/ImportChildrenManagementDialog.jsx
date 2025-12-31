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
    Chip,
    Alert,
    Avatar,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import * as XLSX from 'xlsx';
import { childrenManagementApi } from '~/apis';
import { schoolApi } from '~/apis/schoolApi';
import { exportChildrenManagementToExcel } from '~/utils/childrenManagementExcelExport';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

function ImportChildrenManagementDialog({ open, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [schoolName, setSchoolName] = useState('');

    // ✅ Fetch school name
    useEffect(() => {
        if (open) {
            fetchSchoolInfo();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const fetchSchoolInfo = async () => {
        try {
            const res = await schoolApi.getSchoolInfo();
            setSchoolName(res.data.data.name || 'Trường Mầm Non');
        } catch (error) {
            console.error('Error fetching school info:', error);
        }
    };

    // ✅ Download template
    const handleDownloadTemplate = async () => {
        try {
            await exportChildrenManagementToExcel([], schoolName);
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

    // ✅ Parse Excel date
    const parseExcelDate = (excelDate) => {
        if (!excelDate) return null;

        // If already string in dd/mm/yyyy format
        if (typeof excelDate === 'string') {
            const parts = excelDate.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                return dayjs(`${year}-${month}-${day}`).toISOString();
            }
        }

        // If Excel serial number
        if (typeof excelDate === 'number') {
            const date = XLSX.SSF.parse_date_code(excelDate);
            return dayjs(new Date(date.y, date.m - 1, date.d)).toISOString();
        }

        return null;
    };

    // ✅ Parse year
    const parseYear = (value) => {
        if (!value) return null;
        const year = parseInt(value, 10);
        if (isNaN(year)) return null;
        return year;
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

                // ✅ Parse from row 6 (index 5) - header ở row 6, data từ row 7
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

                // ✅ Map data từ row 7 (bỏ qua header row 6)
                const mappedData = jsonData
                    .slice(1)
                    .map((row, index) => {
                        const excelRowNumber = index + 7;

                        return {
                            rowNumber: excelRowNumber,
                            studentCode: String(row[1] || '').trim(),
                            fullName: String(row[2] || '').trim(),
                            birthDate: parseExcelDate(row[3]),
                            gender: String(row[4] || '').trim(),
                            ethnicity: String(row[5] || '').trim(),
                            enrollmentDate: parseExcelDate(row[6]),
                            status: String(row[7] || '').trim(),
                            permanentAddress: String(row[8] || '').trim(),
                            currentAddress: String(row[9] || '').trim(),
                            motherName: String(row[10] || '').trim(),
                            motherBirthYear: parseYear(row[11]),
                            motherPhone: String(row[12] || '').trim(),
                            motherEmail: String(row[13] || '').trim(),
                            fatherName: String(row[14] || '').trim(),
                            fatherBirthYear: parseYear(row[15]),
                            fatherPhone: String(row[16] || '').trim(),
                            fatherEmail: String(row[17] || '').trim(),
                        };
                    })
                    .filter((row) => {
                        // ✅ Chỉ lấy dòng có họ tên
                        const hasData = row.fullName !== '';
                        if (hasData) {
                            console.log(`✅ Row ${row.rowNumber} HAS DATA:`, {
                                fullName: row.fullName,
                                studentCode: row.studentCode,
                            });
                        }
                        return hasData;
                    });

                console.log('✅ Final Filtered Data:', mappedData);

                if (mappedData.length === 0) {
                    toast.error('File Excel không có dữ liệu hợp lệ!');
                    return;
                }

                // ✅ Validate
                const errors = validateImportData(mappedData);
                setValidationErrors(errors);
                setPreviewData(mappedData);

                if (errors.length > 0) {
                    toast.error(`Phát hiện ${errors.length} dòng dữ liệu không hợp lệ! Vui lòng kiểm tra lại.`);
                } else {
                    toast.success(`✅ Phát hiện ${mappedData.length} trẻ hợp lệ!`);
                }
            } catch (error) {
                console.error('❌ Error parsing Excel:', error);
                toast.error('Lỗi khi đọc file Excel! Vui lòng kiểm tra định dạng file.');
            }
        };

        reader.readAsArrayBuffer(file);
    };

    // ✅ Validate data
    const validateImportData = (data) => {
        const errors = [];

        data.forEach((row) => {
            const rowErrors = [];

            // Required fields
            if (!row.fullName || row.fullName.trim() === '') {
                rowErrors.push('Thiếu họ và tên');
            }
            if (!row.birthDate) {
                rowErrors.push('Thiếu ngày sinh');
            }
            if (!row.gender || row.gender.trim() === '') {
                rowErrors.push('Thiếu giới tính');
            }
            if (!row.ethnicity || row.ethnicity.trim() === '') {
                rowErrors.push('Thiếu dân tộc');
            }
            if (!row.enrollmentDate) {
                rowErrors.push('Thiếu ngày nhập học');
            }
            if (!row.permanentAddress || row.permanentAddress.trim() === '') {
                rowErrors.push('Thiếu địa chỉ thường trú');
            }
            if (!row.currentAddress || row.currentAddress.trim() === '') {
                rowErrors.push('Thiếu địa chỉ hiện tại');
            }

            // Validate phone numbers (if provided)
            if (row.motherPhone && !/^[0-9]{10}$/.test(row.motherPhone)) {
                rowErrors.push('SĐT mẹ phải có đúng 10 chữ số');
            }
            if (row.fatherPhone && !/^[0-9]{10}$/.test(row.fatherPhone)) {
                rowErrors.push('SĐT bố phải có đúng 10 chữ số');
            }

            // Validate emails (if provided)
            if (row.motherEmail && !/^\S+@\S+\.\S+$/.test(row.motherEmail)) {
                rowErrors.push('Email mẹ không hợp lệ');
            }
            if (row.fatherEmail && !/^\S+@\S+\.\S+$/.test(row.fatherEmail)) {
                rowErrors.push('Email bố không hợp lệ');
            }

            if (rowErrors.length > 0) {
                errors.push({
                    row: row.rowNumber,
                    fullName: row.fullName || '(Chưa có tên)',
                    errors: rowErrors,
                });
            }
        });

        return errors;
    };

    // ✅ Handle upload
    const handleUpload = async () => {
        if (!previewData || previewData.length === 0) {
            toast.error('Vui lòng chọn file Excel có dữ liệu!');
            return;
        }

        if (validationErrors.length > 0) {
            toast.error('Vui lòng sửa các lỗi trong file Excel trước khi tải lên!');
            return;
        }

        try {
            setLoading(true);

            // ✅ Remove rowNumber before submit
            // eslint-disable-next-line no-unused-vars
            const dataToSubmit = previewData.map(({ rowNumber, ...rest }) => rest);

            const res = await childrenManagementApi.importBulk(dataToSubmit);
            const { created, updated, errors } = res.data.data;

            if (errors && errors.length > 0) {
                setValidationErrors(
                    errors.map((e) => ({
                        row: e.row,
                        fullName: e.fullName,
                        errors: [e.error],
                    })),
                );
                toast.warning(`Import thành công ${created.length + updated.length} trẻ, ${errors.length} lỗi`);
            } else {
                toast.success(`Import thành công! Thêm mới: ${created.length}, Cập nhật: ${updated.length}`);
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
                        Nhập danh sách trẻ toàn trường từ Excel
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

                {/* Step 2: Upload file */}
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
                    <br />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        • Dòng nào có "Họ và tên học sinh" thì mới được xử lý
                        <br />
                        • Mã học sinh rỗng: Thêm mới (Hệ thống tự tạo mã)
                        <br />• Mã học sinh có sẵn: Cập nhật thông tin
                    </Typography>
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
                                    ✅ Phát hiện <strong>{previewData.length}</strong> trẻ hợp lệ, sẵn sàng tải lên!
                                </Typography>
                            ) : (
                                <Typography variant="body2">
                                    ❌ Có <strong>{validationErrors.length}</strong> dòng dữ liệu không hợp lệ. Vui lòng
                                    sửa các lỗi bên dưới trước khi tải lên.
                                </Typography>
                            )}
                        </Alert>

                        {/* Show validation errors */}
                        {validationErrors.length > 0 && (
                            <Box
                                sx={{
                                    maxHeight: 300,
                                    overflowY: 'auto',
                                    border: '1px solid #f44336',
                                    borderRadius: 1,
                                    p: 2,
                                    bgcolor: '#ffebee',
                                }}
                            >
                                {validationErrors.map((error, idx) => (
                                    <Box key={idx} sx={{ mb: 2 }}>
                                        <Typography variant="body2" fontWeight={600} color="error">
                                            ❌ Dòng {error.row}: {error.fullName}
                                        </Typography>
                                        <Box sx={{ pl: 2, mt: 0.5 }}>
                                            {error.errors.map((err, i) => (
                                                <Typography key={i} variant="caption" color="error" display="block">
                                                    • {err}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Show success preview */}
                        {validationErrors.length === 0 && (
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Chip label={`Tổng: ${previewData.length} trẻ`} color="primary" />
                                <Chip
                                    label={`Thêm mới: ${previewData.filter((r) => !r.studentCode).length}`}
                                    color="success"
                                />
                                <Chip
                                    label={`Cập nhật: ${previewData.filter((r) => r.studentCode).length}`}
                                    color="info"
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                    }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    size="small"
                    disabled={!previewData || validationErrors.length > 0 || loading}
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
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Tải lên'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ImportChildrenManagementDialog;

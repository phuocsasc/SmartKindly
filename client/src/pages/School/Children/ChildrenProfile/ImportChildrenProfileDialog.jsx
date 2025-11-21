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
import { childrenProfileApi, classApi } from '~/apis';
import { schoolApi } from '~/apis/schoolApi';
import { exportChildrenProfilesToExcel } from '~/utils/childrenProfileExcelExport';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useUser } from '~/contexts/UserContext';

function ImportChildrenProfileDialog({ open, onClose, onSuccess, academicYearId }) {
    const { user } = useUser();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [schoolName, setSchoolName] = useState('');
    const [classesData, setClassesData] = useState({});

    // ✅ Fetch school name và classes data
    useEffect(() => {
        if (open) {
            fetchSchoolInfo();
            fetchClassesData();
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

    const fetchClassesData = async () => {
        try {
            const res = await classApi.getAll({
                page: 1,
                limit: 1000,
                academicYearId,
            });

            // Group classes by ageGroup
            const grouped = {};
            res.data.data.classes.forEach((cls) => {
                if (!grouped[cls.ageGroup]) {
                    grouped[cls.ageGroup] = [];
                }
                grouped[cls.ageGroup].push(cls.name);
            });

            setClassesData(grouped);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    // ✅ Download template
    const handleDownloadTemplate = async () => {
        try {
            await exportChildrenProfilesToExcel([], schoolName, user?.role, classesData);
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
                    range: 5, // ✅ Bắt đầu từ row 6 (index 5 - header)
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
                    .slice(1) // Bỏ header row
                    .map((row, index) => ({
                        rowNumber: index + 7, // ✅ Row thực tế trong Excel (data bắt đầu từ row 7)
                        studentCode: String(row[1] || '').trim(),
                        fullName: String(row[2] || '').trim(),
                        birthDate: parseExcelDate(row[3]),
                        gender: String(row[4] || '').trim(),
                        ageGroup: String(row[5] || '').trim(),
                        className: String(row[6] || '').trim(),
                        status: String(row[7] || 'Đang học').trim(),
                        enrollmentDate: parseExcelDate(row[8]),
                        enrollmentForm: String(row[9] || '').trim(),
                        birthPlace: String(row[10] || '').trim(),
                        hometown: String(row[11] || '').trim(),
                        permanentAddress: String(row[12] || '').trim(),
                        temporaryAddress: String(row[13] || '').trim(),
                        ethnicity: String(row[14] || '').trim(),
                        religion: String(row[15] || '').trim(),
                        swimmingLevel: String(row[16] || '').trim(),
                        bloodType: String(row[17] || '').trim(),
                        hasComputer: String(row[18] || '').trim(),
                        hasSmartphone: String(row[19] || '').trim(),
                        familyComponent: String(row[20] || '').trim(),
                        fatherName: String(row[21] || '').trim(),
                        fatherBirthYear: String(row[22] || '').trim(),
                        fatherOccupation: String(row[23] || '').trim(),
                        fatherPhone: String(row[24] || '').trim(),
                        fatherEmail: String(row[25] || '').trim(),
                        motherName: String(row[26] || '').trim(),
                        motherBirthYear: String(row[27] || '').trim(),
                        motherOccupation: String(row[28] || '').trim(),
                        motherPhone: String(row[29] || '').trim(),
                        motherEmail: String(row[30] || '').trim(),
                        guardianName: String(row[31] || '').trim(),
                        guardianBirthYear: String(row[32] || '').trim(),
                        guardianOccupation: String(row[33] || '').trim(),
                        guardianPhone: String(row[34] || '').trim(),
                        guardianEmail: String(row[35] || '').trim(),
                    }))
                    // ✅ Chỉ lấy các dòng có dữ liệu (ít nhất phải có họ tên)
                    .filter((row) => {
                        const hasData = row.fullName !== '' || row.studentCode !== '';

                        if (hasData) {
                            console.log(`✅ Row ${row.rowNumber} HAS DATA:`, {
                                fullName: row.fullName,
                                studentCode: row.studentCode,
                            });
                        }

                        return hasData;
                    });

                console.log('✅ Final Filtered Data:', mappedData);

                // ✅ Validate
                const errors = [];
                mappedData.forEach((row) => {
                    const rowErrors = [];

                    if (!row.fullName) rowErrors.push('Thiếu họ tên');
                    if (!row.birthDate) rowErrors.push('Thiếu ngày sinh');
                    if (!row.gender) rowErrors.push('Thiếu giới tính');
                    if (!row.ageGroup) rowErrors.push('Thiếu khối');
                    if (!row.className) rowErrors.push('Thiếu tên lớp');
                    if (!row.enrollmentDate) rowErrors.push('Thiếu ngày nhập học');
                    if (!row.permanentAddress) rowErrors.push('Thiếu địa chỉ thường trú');
                    if (!row.temporaryAddress) rowErrors.push('Thiếu địa chỉ tạm trú');
                    if (!row.ethnicity) rowErrors.push('Thiếu dân tộc');

                    if (rowErrors.length > 0) {
                        errors.push({
                            row: row.rowNumber,
                            studentCode: row.studentCode,
                            fullName: row.fullName,
                            errors: rowErrors,
                        });
                    }
                });

                setValidationErrors(errors);
                setPreviewData(mappedData);

                if (mappedData.length === 0) {
                    toast.warning('File Excel không có dữ liệu hợp lệ!');
                }
            } catch (error) {
                console.error('Error parsing Excel:', error);
                toast.error('Lỗi khi đọc file Excel!');
            }
        };
        reader.readAsArrayBuffer(file);
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

            const res = await childrenProfileApi.importBulk(previewData);
            const { created, updated, errors } = res.data.data;

            if (errors && errors.length > 0) {
                setValidationErrors(
                    errors.map((e) => ({
                        row: e.row,
                        studentCode: e.studentCode,
                        fullName: e.fullName,
                        errors: [e.error],
                    })),
                );
                toast.warning(`Import thành công ${created.length + updated.length} hồ sơ, ${errors.length} lỗi`);
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
                        Nhập hồ sơ trẻ em từ Excel
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
                                    ✅ Phát hiện <strong>{previewData.length}</strong> hồ sơ hợp lệ
                                </Typography>
                            ) : (
                                <Typography variant="body2">
                                    ❌ Có <strong>{validationErrors.length}</strong> hàng dữ liệu không hợp lệ
                                </Typography>
                            )}
                        </Alert>

                        {/* Show validation errors */}
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
                                            ❌ Dòng {error.row}: {error.fullName || error.studentCode}
                                        </Typography>
                                        <Box sx={{ pl: 2 }}>
                                            {error.errors.map((err, i) => (
                                                <Typography key={i} variant="caption" color="error">
                                                    • {err}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Loading */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress />
                    </Box>
                )}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    disabled={loading}
                    sx={{ borderRadius: 1.5 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={!previewData || validationErrors.length > 0 || loading}
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        background: 'linear-gradient(135deg, #0071bc 0%, #00b4d8 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #005a94 0%, #0096c7 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang tải lên...' : 'Tải lên'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ImportChildrenProfileDialog;

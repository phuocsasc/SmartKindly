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
                        };
                    })
                    .filter((row) => {
                        const hasData = row.fullName !== '' || row.studentCode !== '';

                        if (hasData) {
                            console.log(`✅ Row ${row.rowNumber} HAS DATA:`, {
                                fullName: row.fullName,
                                studentCode: row.studentCode,
                                className: row.className,
                                ageGroup: row.ageGroup,
                            });
                        }

                        return hasData;
                    });

                console.log('✅ Final Filtered Data:', mappedData);

                // ✅ Validate TỪNG DÒNG (bao gồm cả validate tên lớp)
                const errors = [];
                mappedData.forEach((row) => {
                    const rowErrors = [];

                    // Required fields validation
                    if (!row.fullName || row.fullName.trim() === '') {
                        rowErrors.push('Thiếu họ tên');
                    }
                    if (!row.birthDate) {
                        rowErrors.push('Thiếu ngày sinh');
                    }
                    if (!row.gender || row.gender.trim() === '') {
                        rowErrors.push('Thiếu giới tính');
                    }
                    if (!row.ageGroup || row.ageGroup.trim() === '') {
                        rowErrors.push('Thiếu khối');
                    }
                    if (!row.className || row.className.trim() === '') {
                        rowErrors.push('Thiếu tên lớp');
                    } else {
                        // ✅ FIX: Validate tên lớp có tồn tại trong khối không
                        const ageGroupClasses = classesData[row.ageGroup] || [];
                        if (!ageGroupClasses.includes(row.className)) {
                            rowErrors.push(`Không tìm thấy lớp "${row.className}" trong khối "${row.ageGroup}".`);
                        }
                    }
                    if (!row.enrollmentDate) {
                        rowErrors.push('Thiếu ngày nhập học');
                    }
                    if (!row.permanentAddress || row.permanentAddress.trim() === '') {
                        rowErrors.push('Thiếu địa chỉ thường trú');
                    }
                    if (!row.temporaryAddress || row.temporaryAddress.trim() === '') {
                        rowErrors.push('Thiếu địa chỉ tạm trú');
                    }
                    if (!row.ethnicity || row.ethnicity.trim() === '') {
                        rowErrors.push('Thiếu dân tộc');
                    }

                    // ✅ Nếu có lỗi, thêm vào danh sách errors
                    if (rowErrors.length > 0) {
                        errors.push({
                            row: row.rowNumber,
                            fullName: row.fullName || '(Chưa có tên)',
                            errors: rowErrors,
                        });
                    }
                });

                setValidationErrors(errors);
                setPreviewData(mappedData);

                // ✅ Hiển thị thông báo
                if (errors.length > 0) {
                    toast.error(`Phát hiện ${errors.length} dòng dữ liệu không hợp lệ! Vui lòng kiểm tra lại.`);
                } else if (mappedData.length === 0) {
                    toast.warning('File Excel không có dữ liệu hợp lệ!');
                } else {
                    toast.success(`✅ Phát hiện ${mappedData.length} hồ sơ hợp lệ!`);
                }
            } catch (error) {
                console.error('❌ Error parsing Excel:', error);
                toast.error('Lỗi khi đọc file Excel! Vui lòng kiểm tra định dạng file.');
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
                    <br />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        • Mã học sinh rỗng: Tạo mã mới tự động
                        <br />
                        • Có Mã học sinh cũ: Tái sử dụng mã từ năm học trước
                        <br />• Mã học sinh trùng năm hiện tại: Cập nhật hồ sơ
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
                                    ✅ Phát hiện <strong>{previewData.length}</strong> hồ sơ hợp lệ, sẵn sàng tải lên!
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
                                <Chip
                                    label={`${previewData.filter((r) => !r.studentCode).length} hồ sơ mới`}
                                    color="success"
                                    size="small"
                                />
                                <Chip
                                    label={`${previewData.filter((r) => r.studentCode).length} hồ sơ cập nhật`}
                                    color="info"
                                    size="small"
                                />
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
            <DialogActions sx={{ px: 2, py: 1, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="contained"
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
                    {loading ? 'Đang tải lên...' : 'Tải lên'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ImportChildrenProfileDialog;

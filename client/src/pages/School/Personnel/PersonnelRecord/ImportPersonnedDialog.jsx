// client/src/pages/School/Personnel/PersonnelRecord/ImportPersonnelDialog.jsx
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
    Chip,
    Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import * as XLSX from 'xlsx';
import { personnelRecordApi } from '~/apis/personnelRecordApi';
import { exportPersonnelRecordsToExcel } from '~/utils/personnelRecordExcelExport';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

function ImportPersonnelDialog({ open, onClose, onSuccess, schoolName }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);

    // ✅ Handler: Download file Excel mẫu
    const handleDownloadTemplate = async () => {
        try {
            // Tạo file mẫu với 0 records (chỉ có header)
            await exportPersonnelRecordsToExcel([], schoolName);
            toast.success('Tải file Excel mẫu thành công!');
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Lỗi khi tải file mẫu!');
        }
    };

    // ✅ Handler: Chọn file
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        // Validate file type
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

                // ✅ FIX: Parse từ row 5 (header thực tế), bỏ qua 4 dòng tiêu đề
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    range: 4, // ✅ Bắt đầu từ row 5 (index 4)
                    header: 1, // ✅ Dùng array thay vì object
                    defval: '',
                });

                console.log('📊 Raw Excel Data:', jsonData.slice(0, 3));

                if (jsonData.length <= 1) {
                    // Chỉ có header
                    toast.error('File Excel không có dữ liệu!');
                    return;
                }

                // ✅ Lấy header từ row đầu tiên
                const headers = jsonData[0];
                console.log('📋 Headers:', headers);

                // ✅ Parse data từ row thứ 2 trở đi
                const mappedData = jsonData
                    .slice(1) // Bỏ qua header
                    .map((row, index) => {
                        // ✅ Map theo index thay vì tên column
                        const mapped = {
                            rowNumber: index + 6, // Row number thực tế trong Excel
                            personnelCode: String(row[1] || '').trim(), // Column B: Mã cán bộ
                            fullName: String(row[2] || '').trim(), // Column C: Họ và tên
                            department: String(row[3] || '').trim(), // Column D: Tổ bộ môn
                            identificationNumber: String(row[4] || '').trim(), // Column E: Mã định danh
                            gender: String(row[5] || '').trim(), // Column F: Giới tính
                            dateOfBirth: parseExcelDate(row[6]), // Column G: Ngày sinh
                            workStatus: String(row[7] || '').trim(), // Column H: Trạng thái
                            placeOfBirth: String(row[8] || '').trim(), // Column I: Nơi sinh
                            dateJoinedSchool: parseExcelDate(row[9]), // Column J: Ngày vào trường
                            email: String(row[10] || '').trim(), // Column K: Email
                            workPosition: String(row[11] || '').trim(), // Column L: Vị trí làm việc
                            positionGroup: String(row[12] || '').trim(), // Column M: Nhóm chức vụ
                            ethnicity: String(row[13] || 'Kinh').trim(), // Column N: Dân tộc
                            religion: String(row[14] || '').trim(), // Column O: Tôn giáo
                            mainTeachingLevel: String(row[15] || '').trim(), // Column P: Cấp dạy chính
                            contractType: String(row[16] || '').trim(), // Column Q: Hình thức hợp đồng
                            teachingSubject: String(row[17] || '').trim(), // Column R: Môn dạy
                            rankLevel: String(row[18] || '').trim(), // Column S: Ngạch/hạng
                            salaryCoefficient: parseNumber(row[19]), // Column T: Hệ số lương
                            salaryGrade: String(row[20] || '').trim(), // Column U: Bậc lương
                            salaryEffectiveDate: parseExcelDate(row[21]), // Column V: Ngày hưởng lương
                            professionalAllowance: parseNumber(row[22]), // Column W: Mức phụ cấp ưu đãi nghề
                            leadershipAllowance: parseNumber(row[23]), // Column X: Mức phụ cấp chức vụ lãnh đạo
                            idCardNumber: String(row[24] || '').trim(), // Column Y: Số CMND
                            idCardIssueDate: parseExcelDate(row[25]), // Column Z: Ngày cấp
                            idCardIssuePlace: String(row[26] || '').trim(), // Column AA: Nơi cấp
                            phone: String(row[27] || '').trim(), // Column AB: Số điện thoại
                            socialInsuranceNumber: String(row[28] || '').trim(), // Column AC: Số sổ BHXH
                            detailedAddress: String(row[29] || '').trim(), // Column AD: Địa chỉ
                            healthStatus: String(row[30] || '').trim(), // Column AE: Sức khỏe
                            isYouthUnionMember: String(row[31] || '').trim(), // Column AF: Đoàn viên
                            isPartyMember: String(row[32] || '').trim(), // Column AG: Đảng viên
                            isTradeUnionMember: String(row[33] || '').trim(), // Column AH: Công đoàn viên
                            familyBackground: String(row[34] || '').trim(), // Column AI: Thành phần gia đình
                            fatherName: String(row[35] || '').trim(), // Column AJ: Họ tên bố
                            fatherBirthYear: parseYear(row[36]), // Column AK: Năm sinh bố
                            fatherOccupation: String(row[37] || '').trim(), // Column AL: Nghề nghiệp bố
                            fatherWorkplace: String(row[38] || '').trim(), // Column AM: Nơi làm việc của bố
                            motherName: String(row[39] || '').trim(), // Column AN: Họ tên mẹ
                            motherBirthYear: parseYear(row[40]), // Column AO: Năm sinh mẹ
                            motherOccupation: String(row[41] || '').trim(), // Column AP: Nghề nghiệp mẹ
                            motherWorkplace: String(row[42] || '').trim(), // Column AQ: Nơi làm việc của mẹ
                            spouseName: String(row[43] || '').trim(), // Column AR: Họ tên vợ/chồng
                            spouseBirthYear: parseYear(row[44]), // Column AS: Năm sinh vợ/chồng
                            spouseOccupation: String(row[45] || '').trim(), // Column AT: Nghề nghiệp vợ/chồng
                            spouseWorkplace: String(row[46] || '').trim(), // Column AU: Nơi làm việc của vợ/chồng
                            highestProfessionalDegree: String(row[47] || '').trim(), // Column AV: Trình độ CMNV
                            mainMajor: String(row[48] || '').trim(), // Column AW: Chuyên ngành chính
                            majorDegreeLevel: String(row[49] || '').trim(), // Column AX: Trình độ chuyên ngành
                            mainForeignLanguage: String(row[50] || '').trim(), // Column AY: Ngoại ngữ chính
                            foreignLanguageLevel: String(row[51] || '').trim(), // Column AZ: Trình độ ngoại ngữ
                            languageCertificateGroup: String(row[52] || '').trim(), // Column BA: Nhóm chứng chỉ
                            itLevel: String(row[53] || '').trim(), // Column BB: Trình độ tin học
                            politicalTheoryLevel: String(row[54] || '').trim(), // Column BC: Trình độ lý luận
                            recruitmentDate: parseExcelDate(row[55]), // Column BD: Ngày tuyển dụng
                        };

                        // ✅ Debug: Log row đầu tiên
                        if (index < 2) {
                            console.log(`📝 Mapped Row ${mapped.rowNumber}:`, mapped);
                        }

                        return mapped;
                    })
                    // ✅ Lọc bỏ các dòng trống
                    .filter((row) => {
                        const hasData =
                            row.fullName !== '' ||
                            row.email !== '' ||
                            row.phone !== '' ||
                            row.idCardNumber !== '' ||
                            row.department !== '' ||
                            row.gender !== '';

                        if (hasData) {
                            console.log(`✅ Row ${row.rowNumber} HAS DATA:`, {
                                fullName: row.fullName,
                                department: row.department,
                                email: row.email,
                            });
                        }

                        return hasData;
                    });

                console.log('✅ Final Filtered Data:', mappedData);

                // ✅ Kiểm tra sau khi lọc
                if (mappedData.length === 0) {
                    toast.error('File Excel không có dữ liệu hợp lệ!');
                    return;
                }

                // Validate data
                const errors = validateImportData(mappedData);
                setValidationErrors(errors);
                setPreviewData(mappedData);
            } catch (error) {
                console.error('❌ Error parsing Excel:', error);
                toast.error('Lỗi khi đọc file Excel!');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // ✅ Helper: Parse Excel date (Excel stores dates as numbers)
    const parseExcelDate = (value) => {
        if (!value) return null;

        // If already a date string
        if (typeof value === 'string' && value.includes('/')) {
            const parts = value.split('/');
            if (parts.length === 3) {
                return dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
            }
        }

        // If Excel serial date
        if (typeof value === 'number') {
            const date = XLSX.SSF.parse_date_code(value);
            return dayjs(`${date.y}-${date.m}-${date.d}`).toISOString();
        }

        return null;
    };

    // ✅ Helper: Parse number
    const parseNumber = (value) => {
        if (!value || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
    };

    // ✅ Helper: Parse year
    const parseYear = (value) => {
        if (!value || value === '') return null;
        const year = parseInt(value, 10);
        return isNaN(year) ? null : year;
    };

    // ✅ Validate import data
    const validateImportData = (data) => {
        const errors = [];

        data.forEach((row) => {
            const rowErrors = [];

            // Required fields
            if (!row.fullName.trim()) rowErrors.push('Thiếu họ tên');
            if (!row.department) rowErrors.push('Thiếu tổ bộ môn');
            if (!row.gender) rowErrors.push('Thiếu giới tính');
            if (!row.dateOfBirth) rowErrors.push('Thiếu ngày sinh');
            if (!row.dateJoinedSchool) rowErrors.push('Thiếu ngày vào trường');
            if (!row.email.trim()) rowErrors.push('Thiếu email');
            if (!row.workPosition) rowErrors.push('Thiếu vị trí làm việc');
            if (!row.positionGroup) rowErrors.push('Thiếu nhóm chức vụ');
            if (!row.mainTeachingLevel) rowErrors.push('Thiếu cấp dạy chính');
            if (!row.contractType) rowErrors.push('Thiếu hình thức hợp đồng');
            if (!row.idCardNumber.trim()) rowErrors.push('Thiếu số CMND');
            if (!row.phone.trim()) rowErrors.push('Thiếu số điện thoại');
            if (!row.majorDegreeLevel) rowErrors.push('Thiếu trình độ chuyên ngành chính');

            if (rowErrors.length > 0) {
                errors.push({
                    row: row.rowNumber,
                    errors: rowErrors,
                });
            }
        });

        return errors;
    };

    // ✅ Handler: Upload data
    const handleUpload = async () => {
        if (!previewData || previewData.length === 0) {
            toast.error('Vui lòng chọn file Excel!');
            return;
        }

        if (validationErrors.length > 0) {
            toast.error('Dữ liệu không hợp lệ, vui lòng kiểm tra lại!');
            return;
        }

        try {
            setLoading(true);

            // ✅ Helper: Convert empty string to null
            // const cleanValue = (value) => {
            //     if (value === '' || value === null || value === undefined) {
            //         return null;
            //     }
            //     return value;
            // };

            // Những enum chấp nhận rỗng: phải gửi '' (không gửi null)
            const ENUM_EMPTY_STRING_FIELDS = new Set([
                'isYouthUnionMember',
                'isPartyMember',
                'isTradeUnionMember',
                'familyBackground',
                'highestProfessionalDegree',
                'languageCertificateGroup',
                'politicalTheoryLevel',
            ]);

            // Enum không bắt buộc nhưng không nên gửi ''/null khi trống => bỏ hẳn key
            const OPTIONAL_ENUM_UNDEFINED_IF_EMPTY = new Set([
                'teachingSubject', // Nhà trẻ / Mẫu giáo; nếu trống thì xóa field
            ]);

            const normalizeDigits = (v) => String(v ?? '').replace(/\D/g, '');

            const normalizePhone = (v) => {
                let s = String(v ?? '').trim();
                s = s.replace(/\D/g, ''); // chỉ giữ số
                if (s.startsWith('84') && s.length >= 11) {
                    s = '0' + s.slice(2); // 84xxxxxxxx -> 0xxxxxxxx
                }
                if (s.length === 9) s = '0' + s; // bù 0 đầu nếu Excel làm rơi
                return s;
            };

            // ✅ Prepare data: Convert ALL empty strings to null
            const dataToSubmit = previewData.map((row) => {
                // eslint-disable-next-line no-unused-vars
                const { rowNumber, ...raw } = row; // bỏ số dòng excel
                const obj = { ...raw };

                // Chuẩn hoá một số trường số/phone
                obj.phone = normalizePhone(obj.phone);
                obj.idCardNumber = normalizeDigits(obj.idCardNumber);

                // Duyệt mọi key để xử lý '' / null / undefined cho đúng luật
                for (const [k, v] of Object.entries(obj)) {
                    const isEmpty = v === '' || v === null || v === undefined;

                    if (isEmpty) {
                        if (ENUM_EMPTY_STRING_FIELDS.has(k)) {
                            obj[k] = ''; // enum cho phép rỗng => giữ ''
                        } else if (OPTIONAL_ENUM_UNDEFINED_IF_EMPTY.has(k)) {
                            delete obj[k]; // enum không bắt buộc => xóa key
                        } else {
                            obj[k] = null; // các field thường => null
                        }
                    }
                }

                return obj;
            });

            console.log('📤 Data to submit:', dataToSubmit.slice(0, 2));

            // Call API import
            const res = await personnelRecordApi.importBulk(dataToSubmit);

            const { created, updated, errors } = res.data.data;

            if (errors && errors.length > 0) {
                toast.warning(`Hoàn thành với ${errors.length} lỗi. Đã thêm ${created}, cập nhật ${updated}.`);
                setValidationErrors(errors.map((err, idx) => ({ row: idx + 6, errors: [err.message] })));
            } else {
                toast.success(`Import thành công! Đã thêm ${created} và cập nhật ${updated} hồ sơ.`);
                onSuccess();
                handleClose();
            }
        } catch (error) {
            console.error('Error importing data:', error);
            toast.error(error?.response?.data?.message || 'Lỗi khi import dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handler: Close dialog
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <CloudUploadIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Nhập thông tin cán bộ từ Excel
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
                    <CloseIcon />
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
                        sx={{ borderRadius: 1.5 }}
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
                                        <Chip label={`Dòng ${error.row}`} size="small" color="error" sx={{ mr: 1 }} />
                                        <Typography variant="body2" component="span">
                                            {error.errors.join(', ')}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Show success stats */}
                        {validationErrors.length === 0 && (
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`${previewData.filter((r) => !r.personnelCode).length} hồ sơ mới`}
                                    color="success"
                                    size="small"
                                />
                                <Chip
                                    label={`${previewData.filter((r) => r.personnelCode).length} hồ sơ cập nhật`}
                                    color="info"
                                    size="small"
                                />
                            </Box>
                        )}
                    </Box>
                )}

                {/* Loading */}
                {loading && <LinearProgress sx={{ mt: 2 }} />}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={handleClose} variant="outlined" color="inherit" sx={{ borderRadius: 1.5 }}>
                    Hủy
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={!previewData || validationErrors.length > 0 || loading}
                    sx={{ borderRadius: 1.5, px: 3 }}
                >
                    {loading ? 'Đang tải lên...' : 'Tải lên'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ImportPersonnelDialog;

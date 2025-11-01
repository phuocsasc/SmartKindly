// client/src/pages/School/Personnel/PersonnelRecord/PersonnelRecordDialog.jsx
import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    IconButton,
    Divider,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { personnelRecordApi } from '~/apis/personnelRecordApi';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// ✅ Constants
const DEPARTMENTS = [
    'CBQL',
    'Tổ cấp dưỡng',
    'Khối Nhà Trẻ',
    'Khối Mầm',
    'Khối Chồi',
    'Khối Lá',
    'Tổ Văn Phòng',
    'Tổ Bảo Mẫu',
];

const WORK_STATUS = ['Đang làm việc', 'Chuyển công tác', 'Nghỉ hưu', 'Nghỉ việc', 'Tạm nghỉ'];

const WORK_POSITIONS = ['Cán bộ quản lý', 'Nhân Viên', 'Giáo viên'];

const POSITION_GROUPS = [
    'Hiệu trưởng',
    'Hiệu phó',
    'Tổ trưởng',
    'Tổ phó',
    'Giáo viên',
    'Bảo mẫu',
    'Nấu ăn',
    'Kế toán',
    'Giáo vụ',
];

const TEACHING_LEVELS = ['Nhà trẻ', 'Mẫu giáo', 'Khác'];
const SUBJECTS = ['Nhà trẻ', 'Mẫu giáo'];

const CONTRACT_TYPES = [
    'Hợp đồng theo nghị định 68',
    'Hợp đồng lao động trên 1 năm',
    'Hợp đồng lao động dưới 1 năm',
    'Viên chức HĐLV không xác định thời hạn',
    'Viên chức HĐLV xác định thời hạn',
];

const SALARY_GRADES = Array.from({ length: 12 }, (_, i) => `Bậc ${i + 1}`);

const PROFESSIONAL_DEGREES = [
    'Thạc sĩ',
    'Tiến sĩ',
    'Trình độ khác',
    'Trung cấp',
    'Trung cấp sư phạm',
    'Trung cấp và có chứng chỉ BDNVSP',
    'Đại học',
    'Đại học sư phạm',
    'Đại học và có chứng chỉ BDNVSP',
];

const DEGREE_LEVELS = ['Trung cấp', 'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ'];

const POLITICAL_THEORY_LEVELS = ['Cử nhân', 'Sơ cấp', 'Trung cấp', 'Cao cấp'];

const LANGUAGE_CERTIFICATE_GROUPS = ['Chứng chỉ trong nước', 'Chứng chỉ quốc tế'];

const FAMILY_BACKGROUNDS = ['Công nhân', 'Nông dân', 'Thành phần khác'];

function PersonnelRecordDialog({ open, mode, record, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Thông tin cơ bản
        fullName: '',
        department: '',
        identificationNumber: '',
        gender: '',
        dateOfBirth: null,
        workStatus: 'Đang làm việc',
        placeOfBirth: '',
        dateJoinedSchool: null,
        email: '',
        workPosition: '',
        positionGroup: '',
        ethnicity: 'Kinh',
        religion: '',
        mainTeachingLevel: '',
        contractType: '',
        teachingSubject: '',

        // Thông tin lương
        rankLevel: '',
        salaryCoefficient: '',
        salaryGrade: '',
        salaryEffectiveDate: null,
        professionalAllowance: '',
        leadershipAllowance: '',

        // Thông tin CMND
        idCardNumber: '',
        idCardIssueDate: null,
        idCardIssuePlace: '',
        phone: '',
        socialInsuranceNumber: '',
        detailedAddress: '',

        // Thông tin khác
        healthStatus: '',
        isYouthUnionMember: '',
        isPartyMember: '',
        isTradeUnionMember: '',
        familyBackground: '',

        // Thông tin gia đình - Bố
        fatherName: '',
        fatherBirthYear: '',
        fatherOccupation: '',
        fatherWorkplace: '',

        // Thông tin gia đình - Mẹ
        motherName: '',
        motherBirthYear: '',
        motherOccupation: '',
        motherWorkplace: '',

        // Thông tin gia đình - Vợ/Chồng
        spouseName: '',
        spouseBirthYear: '',
        spouseOccupation: '',
        spouseWorkplace: '',

        // Trình độ học vấn
        highestProfessionalDegree: '',
        mainMajor: '',
        majorDegreeLevel: '',
        mainForeignLanguage: '',
        foreignLanguageLevel: '',
        languageCertificateGroup: '',
        itLevel: '',
        politicalTheoryLevel: '',
        recruitmentDate: null,
    });

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    useEffect(() => {
        if (mode === 'edit' && record) {
            setFormData({
                fullName: record.fullName || '',
                department: record.department || '',
                identificationNumber: record.identificationNumber || '',
                gender: record.gender || '',
                dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
                workStatus: record.workStatus || 'Đang làm việc',
                placeOfBirth: record.placeOfBirth || '',
                dateJoinedSchool: record.dateJoinedSchool ? dayjs(record.dateJoinedSchool) : null,
                email: record.email || '',
                workPosition: record.workPosition || '',
                positionGroup: record.positionGroup || '',
                ethnicity: record.ethnicity || 'Kinh',
                religion: record.religion || '',
                mainTeachingLevel: record.mainTeachingLevel || '',
                contractType: record.contractType || '',
                teachingSubject: record.teachingSubject || '',
                rankLevel: record.rankLevel || '',
                salaryCoefficient: record.salaryCoefficient || '',
                salaryGrade: record.salaryGrade || '',
                salaryEffectiveDate: record.salaryEffectiveDate ? dayjs(record.salaryEffectiveDate) : null,
                professionalAllowance: record.professionalAllowance || '',
                leadershipAllowance: record.leadershipAllowance || '',
                idCardNumber: record.idCardNumber || '',
                idCardIssueDate: record.idCardIssueDate ? dayjs(record.idCardIssueDate) : null,
                idCardIssuePlace: record.idCardIssuePlace || '',
                phone: record.phone || '',
                socialInsuranceNumber: record.socialInsuranceNumber || '',
                detailedAddress: record.detailedAddress || '',
                healthStatus: record.healthStatus || '',
                isYouthUnionMember: record.isYouthUnionMember || '',
                isPartyMember: record.isPartyMember || '',
                isTradeUnionMember: record.isTradeUnionMember || '',
                familyBackground: record.familyBackground || '',
                fatherName: record.fatherName || '',
                fatherBirthYear: record.fatherBirthYear || '',
                fatherOccupation: record.fatherOccupation || '',
                fatherWorkplace: record.fatherWorkplace || '',
                motherName: record.motherName || '',
                motherBirthYear: record.motherBirthYear || '',
                motherOccupation: record.motherOccupation || '',
                motherWorkplace: record.motherWorkplace || '',
                spouseName: record.spouseName || '',
                spouseBirthYear: record.spouseBirthYear || '',
                spouseOccupation: record.spouseOccupation || '',
                spouseWorkplace: record.spouseWorkplace || '',
                highestProfessionalDegree: record.highestProfessionalDegree || '',
                mainMajor: record.mainMajor || '',
                majorDegreeLevel: record.majorDegreeLevel || '',
                mainForeignLanguage: record.mainForeignLanguage || '',
                foreignLanguageLevel: record.foreignLanguageLevel || '',
                languageCertificateGroup: record.languageCertificateGroup || '',
                itLevel: record.itLevel || '',
                politicalTheoryLevel: record.politicalTheoryLevel || '',
                recruitmentDate: record.recruitmentDate ? dayjs(record.recruitmentDate) : null,
            });
        } else if (mode === 'view' && record) {
            // View mode: load from API
            loadRecordDetails(record._id);
        } else {
            // Reset form
            setFormData({
                fullName: '',
                department: '',
                identificationNumber: '',
                gender: '',
                dateOfBirth: null,
                workStatus: 'Đang làm việc',
                placeOfBirth: '',
                dateJoinedSchool: null,
                email: '',
                workPosition: '',
                positionGroup: '',
                ethnicity: 'Kinh',
                religion: '',
                mainTeachingLevel: '',
                contractType: '',
                teachingSubject: '',
                rankLevel: '',
                salaryCoefficient: '',
                salaryGrade: '',
                salaryEffectiveDate: null,
                professionalAllowance: '',
                leadershipAllowance: '',
                idCardNumber: '',
                idCardIssueDate: null,
                idCardIssuePlace: '',
                phone: '',
                socialInsuranceNumber: '',
                detailedAddress: '',
                healthStatus: '',
                isYouthUnionMember: '',
                isPartyMember: '',
                isTradeUnionMember: '',
                familyBackground: '',
                fatherName: '',
                fatherBirthYear: '',
                fatherOccupation: '',
                fatherWorkplace: '',
                motherName: '',
                motherBirthYear: '',
                motherOccupation: '',
                motherWorkplace: '',
                spouseName: '',
                spouseBirthYear: '',
                spouseOccupation: '',
                spouseWorkplace: '',
                highestProfessionalDegree: '',
                mainMajor: '',
                majorDegreeLevel: '',
                mainForeignLanguage: '',
                foreignLanguageLevel: '',
                languageCertificateGroup: '',
                itLevel: '',
                politicalTheoryLevel: '',
                recruitmentDate: null,
            });
        }
    }, [mode, record, open]);

    const loadRecordDetails = async (id) => {
        try {
            const res = await personnelRecordApi.getDetails(id);
            const data = res.data.data;
            setFormData({
                fullName: data.fullName || '',
                department: data.department || '',
                identificationNumber: data.identificationNumber || '',
                gender: data.gender || '',
                dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : null,
                workStatus: data.workStatus || 'Đang làm việc',
                placeOfBirth: data.placeOfBirth || '',
                dateJoinedSchool: data.dateJoinedSchool ? dayjs(data.dateJoinedSchool) : null,
                email: data.email || '',
                workPosition: data.workPosition || '',
                positionGroup: data.positionGroup || '',
                ethnicity: data.ethnicity || 'Kinh',
                religion: data.religion || '',
                mainTeachingLevel: data.mainTeachingLevel || '',
                contractType: data.contractType || '',
                teachingSubject: data.teachingSubject || '',
                rankLevel: data.rankLevel || '',
                salaryCoefficient: data.salaryCoefficient || '',
                salaryGrade: data.salaryGrade || '',
                salaryEffectiveDate: data.salaryEffectiveDate ? dayjs(data.salaryEffectiveDate) : null,
                professionalAllowance: data.professionalAllowance || '',
                leadershipAllowance: data.leadershipAllowance || '',
                idCardNumber: data.idCardNumber || '',
                idCardIssueDate: data.idCardIssueDate ? dayjs(data.idCardIssueDate) : null,
                idCardIssuePlace: data.idCardIssuePlace || '',
                phone: data.phone || '',
                socialInsuranceNumber: data.socialInsuranceNumber || '',
                detailedAddress: data.detailedAddress || '',
                healthStatus: data.healthStatus || '',
                isYouthUnionMember: data.isYouthUnionMember || '',
                isPartyMember: data.isPartyMember || '',
                isTradeUnionMember: data.isTradeUnionMember || '',
                familyBackground: data.familyBackground || '',
                fatherName: data.fatherName || '',
                fatherBirthYear: data.fatherBirthYear || '',
                fatherOccupation: data.fatherOccupation || '',
                fatherWorkplace: data.fatherWorkplace || '',
                motherName: data.motherName || '',
                motherBirthYear: data.motherBirthYear || '',
                motherOccupation: data.motherOccupation || '',
                motherWorkplace: data.motherWorkplace || '',
                spouseName: data.spouseName || '',
                spouseBirthYear: data.spouseBirthYear || '',
                spouseOccupation: data.spouseOccupation || '',
                spouseWorkplace: data.spouseWorkplace || '',
                highestProfessionalDegree: data.highestProfessionalDegree || '',
                mainMajor: data.mainMajor || '',
                majorDegreeLevel: data.majorDegreeLevel || '',
                mainForeignLanguage: data.mainForeignLanguage || '',
                foreignLanguageLevel: data.foreignLanguageLevel || '',
                languageCertificateGroup: data.languageCertificateGroup || '',
                itLevel: data.itLevel || '',
                politicalTheoryLevel: data.politicalTheoryLevel || '',
                recruitmentDate: data.recruitmentDate ? dayjs(data.recruitmentDate) : null,
            });
        } catch (error) {
            console.error('Error loading record details:', error);
            toast.error('Lỗi khi tải thông tin hồ sơ!');
        }
    };

    const handleSubmit = async () => {
        const requiredFields = [
            ['fullName', 'Vui lòng nhập họ tên!'],
            ['department', 'Vui lòng chọn tổ bộ môn!'],
            ['gender', 'Vui lòng chọn giới tính!'],
            ['dateOfBirth', 'Vui lòng chọn ngày sinh!'],
            ['dateJoinedSchool', 'Vui lòng chọn ngày vào trường!'],
            ['email', 'Vui lòng nhập email!'],
            ['workPosition', 'Vui lòng chọn vị trí làm việc!'],
            ['positionGroup', 'Vui lòng chọn nhóm chức vụ!'],
            ['contractType', 'Vui lòng chọn hình thức hợp đồng!'],
            ['idCardNumber', 'Vui lòng nhập số CMND!'],
            ['phone', 'Vui lòng nhập số điện thoại!'],
            ['majorDegreeLevel', 'Vui lòng chọn trình độ chuyên ngành chính!'],
        ];

        // ✅ Kiểm tra ràng buộc tối thiểu
        for (const [field, message] of requiredFields) {
            const value = formData[field];
            if (!value || (typeof value === 'string' && !value.trim())) {
                toast.error(message);
                return;
            }
        }

        try {
            setLoading(true);

            // ✅ Hàm helper gọn hơn
            const normalizeValue = (v) => (v === '' ? null : v);
            const normalizeNumber = (v) => (v === '' || v == null ? null : isNaN(Number(v)) ? null : Number(v));
            const normalizeDate = (d) => (d ? d.toISOString() : null);

            // ✅ Chuẩn hóa toàn bộ formData
            const cleanedData = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, normalizeValue(v)]));

            // ✅ Chuẩn hóa các field đặc biệt
            const dataToSubmit = {
                ...cleanedData,
                salaryCoefficient: normalizeNumber(formData.salaryCoefficient),
                professionalAllowance: normalizeNumber(formData.professionalAllowance),
                leadershipAllowance: normalizeNumber(formData.leadershipAllowance),
                fatherBirthYear: normalizeNumber(formData.fatherBirthYear),
                motherBirthYear: normalizeNumber(formData.motherBirthYear),
                spouseBirthYear: normalizeNumber(formData.spouseBirthYear),

                dateOfBirth: normalizeDate(formData.dateOfBirth),
                dateJoinedSchool: normalizeDate(formData.dateJoinedSchool),
                salaryEffectiveDate: normalizeDate(formData.salaryEffectiveDate),
                idCardIssueDate: normalizeDate(formData.idCardIssueDate),
                recruitmentDate: normalizeDate(formData.recruitmentDate),
            };

            // ✅ Gỡ bỏ field null (gọn gàng hơn)
            // eslint-disable-next-line no-unused-vars
            const finalData = Object.fromEntries(Object.entries(dataToSubmit).filter(([_, v]) => v != null));

            // ✅ Gọi API
            await (isCreateMode
                ? personnelRecordApi.create(finalData)
                : personnelRecordApi.update(record._id, finalData));

            toast.success(isCreateMode ? 'Tạo hồ sơ cán bộ thành công!' : 'Cập nhật hồ sơ cán bộ thành công!');
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    const ModeIcon = isViewMode ? VisibilityIcon : isCreateMode ? AddCircleOutlineIcon : EditIcon;
    const modeTitle = isViewMode ? 'Xem chi tiết hồ sơ' : isCreateMode ? 'Thêm hồ sơ cán bộ mới' : 'Chỉnh sửa hồ sơ';

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    },
                }}
            >
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
                        <ModeIcon sx={{ fontSize: 28 }} />
                        <Typography variant="h6" fontWeight={600}>
                            {modeTitle}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                            },
                        }}
                    >
                        <CloseIcon sx={{ color: 'red' }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    sx={{
                        px: 3,
                        py: 2.5,
                        maxHeight: '75vh',
                        overflowY: 'auto',
                        mt: -2,
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                        '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                        '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            '&:hover fieldset': { borderColor: '#667eea' },
                            '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                        },
                        '& label.Mui-focused': { color: '#667eea' },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* ===== ACCORDION 1: THÔNG TIN CƠ BẢN ===== */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="primary">
                                    📋 Thông tin cơ bản
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Họ tên */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Họ và tên"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            required
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Tổ bộ môn */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small" required>
                                            <InputLabel>Tổ bộ môn</InputLabel>
                                            <Select
                                                value={formData.department}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, department: e.target.value })
                                                }
                                                label="Tổ bộ môn"
                                                disabled={isViewMode}
                                            >
                                                {DEPARTMENTS.map((dept) => (
                                                    <MenuItem key={dept} value={dept}>
                                                        {dept}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Mã định danh */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Mã định danh"
                                            value={formData.identificationNumber}
                                            onChange={(e) =>
                                                setFormData({ ...formData, identificationNumber: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Giới tính */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small" required>
                                            <InputLabel>Giới tính</InputLabel>
                                            <Select
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                label="Giới tính"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="Nam">Nam</MenuItem>
                                                <MenuItem value="Nữ">Nữ</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Ngày sinh */}
                                    <Grid item xs={12} md={6}>
                                        <DatePicker
                                            label="Ngày sinh"
                                            value={formData.dateOfBirth}
                                            onChange={(newValue) => setFormData({ ...formData, dateOfBirth: newValue })}
                                            format="DD/MM/YYYY"
                                            disabled={isViewMode}
                                            slotProps={{
                                                textField: {
                                                    required: true,
                                                    fullWidth: true,
                                                    size: 'small',
                                                },
                                            }}
                                        />
                                    </Grid>

                                    {/* Trạng thái */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small" required>
                                            <InputLabel>Trạng thái</InputLabel>
                                            <Select
                                                value={formData.workStatus}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, workStatus: e.target.value })
                                                }
                                                label="Trạng thái"
                                                disabled={isViewMode}
                                            >
                                                {WORK_STATUS.map((status) => (
                                                    <MenuItem key={status} value={status}>
                                                        {status}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Nơi sinh */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nơi sinh"
                                            value={formData.placeOfBirth}
                                            onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Ngày vào trường */}
                                    <Grid item xs={12} md={6}>
                                        <DatePicker
                                            label="Ngày vào trường"
                                            value={formData.dateJoinedSchool}
                                            onChange={(newValue) =>
                                                setFormData({ ...formData, dateJoinedSchool: newValue })
                                            }
                                            format="DD/MM/YYYY"
                                            disabled={isViewMode}
                                            slotProps={{
                                                textField: {
                                                    required: true,
                                                    fullWidth: true,
                                                    size: 'small',
                                                },
                                            }}
                                        />
                                    </Grid>

                                    {/* Email */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Vị trí làm việc */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small" required>
                                            <InputLabel>Vị trí làm việc</InputLabel>
                                            <Select
                                                value={formData.workPosition}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, workPosition: e.target.value })
                                                }
                                                label="Vị trí làm việc"
                                                disabled={isViewMode}
                                            >
                                                {WORK_POSITIONS.map((pos) => (
                                                    <MenuItem key={pos} value={pos}>
                                                        {pos}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Nhóm chức vụ */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small" required>
                                            <InputLabel>Nhóm chức vụ</InputLabel>
                                            <Select
                                                value={formData.positionGroup}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, positionGroup: e.target.value })
                                                }
                                                label="Nhóm chức vụ"
                                                disabled={isViewMode}
                                            >
                                                {POSITION_GROUPS.map((pos) => (
                                                    <MenuItem key={pos} value={pos}>
                                                        {pos}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Dân tộc */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Dân tộc"
                                            value={formData.ethnicity}
                                            onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                                            required
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Tôn giáo */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Tôn giáo"
                                            value={formData.religion}
                                            onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Cấp dạy chính */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Cấp dạy chính</InputLabel>
                                            <Select
                                                value={formData.mainTeachingLevel}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, mainTeachingLevel: e.target.value })
                                                }
                                                label="Cấp dạy chính"
                                                disabled={isViewMode}
                                            >
                                                {TEACHING_LEVELS.map((level) => (
                                                    <MenuItem key={level} value={level}>
                                                        {level}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Hình thức hợp đồng */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small" required>
                                            <InputLabel>Hình thức hợp đồng</InputLabel>
                                            <Select
                                                value={formData.contractType}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, contractType: e.target.value })
                                                }
                                                label="Hình thức hợp đồng"
                                                disabled={isViewMode}
                                            >
                                                {CONTRACT_TYPES.map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Môn dạy */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Môn dạy</InputLabel>
                                            <Select
                                                value={formData.teachingSubject}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, teachingSubject: e.target.value })
                                                }
                                                label="Môn dạy"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn môn dạy --</MenuItem>
                                                {SUBJECTS.map((subject) => (
                                                    <MenuItem key={subject} value={subject}>
                                                        {subject}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* ===== ACCORDION 2: THÔNG TIN LƯƠNG ===== */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="success.main">
                                    💰 Thông tin lương
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Ngạch/hạng */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Ngạch/hạng"
                                            value={formData.rankLevel}
                                            onChange={(e) => setFormData({ ...formData, rankLevel: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Hệ số lương */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Hệ số lương"
                                            type="number"
                                            value={formData.salaryCoefficient}
                                            onChange={(e) =>
                                                setFormData({ ...formData, salaryCoefficient: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                            inputProps={{ step: '0.01', min: '0' }}
                                        />
                                    </Grid>

                                    {/* Bậc lương */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Bậc lương</InputLabel>
                                            <Select
                                                value={formData.salaryGrade}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, salaryGrade: e.target.value })
                                                }
                                                label="Bậc lương"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn bậc lương --</MenuItem>
                                                {SALARY_GRADES.map((grade) => (
                                                    <MenuItem key={grade} value={grade}>
                                                        {grade}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Ngày hưởng lương */}
                                    <Grid item xs={12} md={6}>
                                        <DatePicker
                                            label="Ngày hưởng lương"
                                            value={formData.salaryEffectiveDate}
                                            onChange={(newValue) =>
                                                setFormData({ ...formData, salaryEffectiveDate: newValue })
                                            }
                                            format="DD/MM/YYYY"
                                            disabled={isViewMode}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                },
                                            }}
                                        />
                                    </Grid>

                                    {/* Phụ cấp ưu đãi nghề */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Phụ cấp ưu đãi nghề (%)"
                                            type="number"
                                            value={formData.professionalAllowance}
                                            onChange={(e) =>
                                                setFormData({ ...formData, professionalAllowance: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                            inputProps={{ min: '0' }}
                                        />
                                    </Grid>

                                    {/* Phụ cấp chức vụ lãnh đạo */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Phụ cấp chức vụ lãnh đạo (%)"
                                            type="number"
                                            value={formData.leadershipAllowance}
                                            onChange={(e) =>
                                                setFormData({ ...formData, leadershipAllowance: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                            inputProps={{ min: '0' }}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* ===== ACCORDION 3: THÔNG TIN CMND & LIÊN HỆ ===== */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="error.main">
                                    📇 Thông tin CMND & Liên hệ
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Số CMND */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Số CMND/CCCD"
                                            value={formData.idCardNumber}
                                            onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                                            required
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Ngày cấp */}
                                    <Grid item xs={12} md={6}>
                                        <DatePicker
                                            label="Ngày cấp"
                                            value={formData.idCardIssueDate}
                                            onChange={(newValue) =>
                                                setFormData({ ...formData, idCardIssueDate: newValue })
                                            }
                                            format="DD/MM/YYYY"
                                            disabled={isViewMode}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                },
                                            }}
                                        />
                                    </Grid>

                                    {/* Nơi cấp */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nơi cấp"
                                            value={formData.idCardIssuePlace}
                                            onChange={(e) =>
                                                setFormData({ ...formData, idCardIssuePlace: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Số điện thoại */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Số điện thoại"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Số sổ BHXH */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Số sổ BHXH"
                                            value={formData.socialInsuranceNumber}
                                            onChange={(e) =>
                                                setFormData({ ...formData, socialInsuranceNumber: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Địa chỉ */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Địa chỉ quản lý chi tiết"
                                            value={formData.detailedAddress}
                                            onChange={(e) =>
                                                setFormData({ ...formData, detailedAddress: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            multiline
                                            rows={2}
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* ===== ACCORDION 4: THÔNG TIN KHÁC ===== */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="warning.main">
                                    📌 Thông tin khác
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Sức khỏe */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Sức khỏe"
                                            value={formData.healthStatus}
                                            onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Đoàn viên */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Đoàn viên</InputLabel>
                                            <Select
                                                value={formData.isYouthUnionMember}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, isYouthUnionMember: e.target.value })
                                                }
                                                label="Đoàn viên"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                <MenuItem value="Có">Có</MenuItem>
                                                <MenuItem value="Không">Không</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Đảng viên */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Đảng viên</InputLabel>
                                            <Select
                                                value={formData.isPartyMember}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, isPartyMember: e.target.value })
                                                }
                                                label="Đảng viên"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                <MenuItem value="Có">Có</MenuItem>
                                                <MenuItem value="Không">Không</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Công đoàn viên */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Công đoàn viên</InputLabel>
                                            <Select
                                                value={formData.isTradeUnionMember}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, isTradeUnionMember: e.target.value })
                                                }
                                                label="Công đoàn viên"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                <MenuItem value="Có">Có</MenuItem>
                                                <MenuItem value="Không">Không</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Thành phần gia đình */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Thành phần gia đình</InputLabel>
                                            <Select
                                                value={formData.familyBackground}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, familyBackground: e.target.value })
                                                }
                                                label="Thành phần gia đình"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {FAMILY_BACKGROUNDS.map((bg) => (
                                                    <MenuItem key={bg} value={bg}>
                                                        {bg}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* ===== ACCORDION 5: THÔNG TIN GIA ĐÌNH ===== */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="secondary.main">
                                    👨‍👩‍👧‍👦 Thông tin gia đình
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Thông tin bố */}
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            color="text.secondary"
                                            sx={{ mb: 1 }}
                                        >
                                            Thông tin về Bố
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Họ tên bố"
                                            value={formData.fatherName}
                                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Năm sinh bố"
                                            type="number"
                                            value={formData.fatherBirthYear}
                                            onChange={(e) =>
                                                setFormData({ ...formData, fatherBirthYear: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nghề nghiệp bố"
                                            value={formData.fatherOccupation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, fatherOccupation: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nơi làm việc của bố"
                                            value={formData.fatherWorkplace}
                                            onChange={(e) =>
                                                setFormData({ ...formData, fatherWorkplace: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                    </Grid>

                                    {/* Thông tin mẹ */}
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            color="text.secondary"
                                            sx={{ mb: 1 }}
                                        >
                                            Thông tin về Mẹ
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Họ tên mẹ"
                                            value={formData.motherName}
                                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Năm sinh mẹ"
                                            type="number"
                                            value={formData.motherBirthYear}
                                            onChange={(e) =>
                                                setFormData({ ...formData, motherBirthYear: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nghề nghiệp mẹ"
                                            value={formData.motherOccupation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, motherOccupation: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nơi làm việc của mẹ"
                                            value={formData.motherWorkplace}
                                            onChange={(e) =>
                                                setFormData({ ...formData, motherWorkplace: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                    </Grid>

                                    {/* Thông tin vợ/chồng */}
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            color="text.secondary"
                                            sx={{ mb: 1 }}
                                        >
                                            Thông tin về Vợ/Chồng
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Họ tên vợ/chồng"
                                            value={formData.spouseName}
                                            onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Năm sinh vợ/chồng"
                                            type="number"
                                            value={formData.spouseBirthYear}
                                            onChange={(e) =>
                                                setFormData({ ...formData, spouseBirthYear: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nghề nghiệp vợ/chồng"
                                            value={formData.spouseOccupation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, spouseOccupation: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nơi làm việc của vợ/chồng"
                                            value={formData.spouseWorkplace}
                                            onChange={(e) =>
                                                setFormData({ ...formData, spouseWorkplace: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* ===== ACCORDION 6: TRÌNH ĐỘ HỌC VẤN ===== */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="info.main">
                                    🎓 Trình độ học vấn
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Trình độ CMNV cao nhất */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Trình độ CMNV cao nhất</InputLabel>
                                            <Select
                                                value={formData.highestProfessionalDegree}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        highestProfessionalDegree: e.target.value,
                                                    })
                                                }
                                                label="Trình độ CMNV cao nhất"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {PROFESSIONAL_DEGREES.map((degree) => (
                                                    <MenuItem key={degree} value={degree}>
                                                        {degree}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Chuyên ngành chính */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Chuyên ngành chính"
                                            value={formData.mainMajor}
                                            onChange={(e) => setFormData({ ...formData, mainMajor: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Trình độ chuyên ngành chính */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small" required>
                                            <InputLabel>Trình độ chuyên ngành chính</InputLabel>
                                            <Select
                                                value={formData.majorDegreeLevel}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, majorDegreeLevel: e.target.value })
                                                }
                                                label="Trình độ chuyên ngành chính"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {DEGREE_LEVELS.map((level) => (
                                                    <MenuItem key={level} value={level}>
                                                        {level}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Ngoại ngữ chính */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Ngoại ngữ chính"
                                            value={formData.mainForeignLanguage}
                                            onChange={(e) =>
                                                setFormData({ ...formData, mainForeignLanguage: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Trình độ ngoại ngữ */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Trình độ ngoại ngữ"
                                            value={formData.foreignLanguageLevel}
                                            onChange={(e) =>
                                                setFormData({ ...formData, foreignLanguageLevel: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Nhóm chứng chỉ ngoại ngữ */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Nhóm chứng chỉ ngoại ngữ</InputLabel>
                                            <Select
                                                value={formData.languageCertificateGroup}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        languageCertificateGroup: e.target.value,
                                                    })
                                                }
                                                label="Nhóm chứng chỉ ngoại ngữ"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {LANGUAGE_CERTIFICATE_GROUPS.map((group) => (
                                                    <MenuItem key={group} value={group}>
                                                        {group}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Trình độ tin học */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Trình độ tin học"
                                            value={formData.itLevel}
                                            onChange={(e) => setFormData({ ...formData, itLevel: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Trình độ lý luận chính trị */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Trình độ lý luận chính trị</InputLabel>
                                            <Select
                                                value={formData.politicalTheoryLevel}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, politicalTheoryLevel: e.target.value })
                                                }
                                                label="Trình độ lý luận chính trị"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {POLITICAL_THEORY_LEVELS.map((level) => (
                                                    <MenuItem key={level} value={level}>
                                                        {level}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Ngày tuyển dụng */}
                                    <Grid item xs={12} md={6}>
                                        <DatePicker
                                            label="Ngày tuyển dụng"
                                            value={formData.recruitmentDate}
                                            onChange={(newValue) =>
                                                setFormData({ ...formData, recruitmentDate: newValue })
                                            }
                                            format="DD/MM/YYYY"
                                            disabled={isViewMode}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                },
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            px: 2.5,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {isViewMode ? 'Đóng' : 'Hủy'}
                    </Button>
                    {!isViewMode && (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
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
                            {loading ? (
                                <CircularProgress size={20} sx={{ color: '#fff' }} />
                            ) : isCreateMode ? (
                                'Tạo mới'
                            ) : (
                                'Cập nhật'
                            )}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}

export default PersonnelRecordDialog;

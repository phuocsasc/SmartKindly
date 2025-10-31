// client/src/utils/personnelRecordExcelExport.js
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * ✅ Định nghĩa các giá trị enum cho dropdown
 */
const DROPDOWN_VALUES = {
    department: [
        'CBQL',
        'Tổ cấp dưỡng',
        'Khối Nhà Trẻ',
        'Khối Mầm',
        'Khối Chồi',
        'Khối Lá',
        'Tổ Văn Phòng',
        'Tổ Bảo Mẫu',
    ],
    gender: ['Nam', 'Nữ'],
    workStatus: ['Đang làm việc', 'Chuyển công tác', 'Nghỉ hưu', 'Nghỉ việc', 'Tạm nghỉ'],
    workPosition: ['Cán bộ quản lý', 'Nhân Viên', 'Giáo viên'],
    positionGroup: [
        'Hiệu trưởng',
        'Hiệu phó',
        'Tổ trưởng',
        'Tổ phó',
        'Giáo viên',
        'Bảo mẫu',
        'Nấu ăn',
        'Kế toán',
        'Giáo vụ',
    ],
    mainTeachingLevel: ['Nhà trẻ', 'Mẫu giáo', 'Khác'],
    contractType: [
        'Hợp đồng theo nghị định 68',
        'Hợp đồng lao động trên 1 năm',
        'Hợp đồng lao động dưới 1 năm',
        'Viên chức HĐLV không xác định thời hạn',
        'Viên chức HĐLV xác định thời hạn',
    ],
    teachingSubject: ['Nhà trẻ', 'Mẫu giáo'],
    salaryGrade: Array.from({ length: 12 }, (_, i) => `Bậc ${i + 1}`),
    isYouthUnionMember: ['Có', 'Không'],
    isPartyMember: ['Có', 'Không'],
    isTradeUnionMember: ['Có', 'Không'],
    familyBackground: ['Công nhân', 'Nông dân', 'Thành phần khác'],
    highestProfessionalDegree: [
        'Thạc sĩ',
        'Tiến sĩ',
        'Trình độ khác',
        'Trung cấp',
        'Trung cấp sư phạm',
        'Trung cấp và có chứng chỉ BDNVSP',
        'Đại học',
        'Đại học sư phạm',
        'Đại học và có chứng chỉ BDNVSP',
    ],
    majorDegreeLevel: ['Trung cấp', 'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ'],
    languageCertificateGroup: ['Chứng chỉ trong nước', 'Chứng chỉ quốc tế'],
    politicalTheoryLevel: ['Cử nhân', 'Sơ cấp', 'Trung cấp', 'Cao cấp'],
};

/**
 * ✅ Định nghĩa cấu trúc columns (header + required + validation)
 */
const COLUMNS_CONFIG = [
    { key: 'stt', header: 'STT', width: 8, required: true },
    { key: 'personnelCode', header: 'Mã cán bộ', width: 15, required: true },
    { key: 'fullName', header: 'Họ và tên', width: 25, required: true, note: 'Họ tên phải có ít nhất 3 ký tự' },
    { key: 'department', header: 'Tổ bộ môn', width: 20, required: true, dropdown: DROPDOWN_VALUES.department },
    { key: 'identificationNumber', header: 'Mã định danh', width: 15, note: 'Tối đa 12 ký tự' },
    { key: 'gender', header: 'Giới tính', width: 12, required: true, dropdown: DROPDOWN_VALUES.gender },
    {
        key: 'dateOfBirth',
        header: 'Ngày sinh',
        width: 15,
        required: true,
        format: 'date',
        note: 'Định dạng: dd/mm/yyyy',
    },
    { key: 'workStatus', header: 'Trạng thái', width: 18, required: true, dropdown: DROPDOWN_VALUES.workStatus },
    { key: 'placeOfBirth', header: 'Nơi sinh', width: 30, note: 'Tối đa 200 ký tự' },
    {
        key: 'dateJoinedSchool',
        header: 'Ngày vào trường',
        width: 18,
        required: true,
        format: 'date',
        note: 'Định dạng: dd/mm/yyyy',
    },
    { key: 'email', header: 'Email', width: 30, required: true, note: 'Email hợp lệ' },
    {
        key: 'workPosition',
        header: 'Vị trí làm việc',
        width: 18,
        required: true,
        dropdown: DROPDOWN_VALUES.workPosition,
    },
    {
        key: 'positionGroup',
        header: 'Nhóm chức vụ',
        width: 18,
        required: true,
        dropdown: DROPDOWN_VALUES.positionGroup,
    },
    { key: 'ethnicity', header: 'Dân tộc', width: 15, required: true },
    { key: 'religion', header: 'Tôn giáo', width: 15 },
    {
        key: 'mainTeachingLevel',
        header: 'Cấp dạy chính',
        width: 18,
        required: true,
        dropdown: DROPDOWN_VALUES.mainTeachingLevel,
    },
    {
        key: 'contractType',
        header: 'Hình thức hợp đồng',
        width: 35,
        required: true,
        dropdown: DROPDOWN_VALUES.contractType,
    },
    { key: 'teachingSubject', header: 'Môn dạy', width: 15, dropdown: DROPDOWN_VALUES.teachingSubject },
    { key: 'rankLevel', header: 'Ngạch/hạng', width: 15 },
    { key: 'salaryCoefficient', header: 'Hệ số lương', width: 15, format: 'number', note: 'Số thập phân, VD: 2.34' },
    { key: 'salaryGrade', header: 'Bậc lương', width: 12, dropdown: DROPDOWN_VALUES.salaryGrade },
    { key: 'salaryEffectiveDate', header: 'Ngày hưởng lương', width: 18, format: 'date' },
    {
        key: 'professionalAllowance',
        header: 'Mức phụ cấp ưu đãi nghề (%)',
        width: 25,
        format: 'number',
        note: 'Số nguyên, VD: 25',
    },
    {
        key: 'leadershipAllowance',
        header: 'Mức phụ cấp chức vụ lãnh đạo (%)',
        width: 30,
        format: 'number',
        note: 'Số nguyên, VD: 15',
    },
    { key: 'idCardNumber', header: 'Số CMND', width: 15, required: true, note: '9-12 chữ số' },
    { key: 'idCardIssueDate', header: 'Ngày cấp', width: 15, format: 'date' },
    { key: 'idCardIssuePlace', header: 'Nơi cấp', width: 30 },
    { key: 'phone', header: 'Số điện thoại', width: 15, required: true, note: '10-11 chữ số' },
    { key: 'socialInsuranceNumber', header: 'Số sổ BHXH', width: 15 },
    { key: 'detailedAddress', header: 'Địa chỉ quản lý chi tiết', width: 40, note: 'Tối đa 300 ký tự' },
    { key: 'healthStatus', header: 'Sức khỏe', width: 15 },
    { key: 'isYouthUnionMember', header: 'Đoàn viên', width: 12, dropdown: DROPDOWN_VALUES.isYouthUnionMember },
    { key: 'isPartyMember', header: 'Đảng viên', width: 12, dropdown: DROPDOWN_VALUES.isPartyMember },
    { key: 'isTradeUnionMember', header: 'Công đoàn viên', width: 15, dropdown: DROPDOWN_VALUES.isTradeUnionMember },
    { key: 'familyBackground', header: 'Thành phần gia đình', width: 20, dropdown: DROPDOWN_VALUES.familyBackground },
    { key: 'fatherName', header: 'Họ tên bố', width: 25 },
    { key: 'fatherBirthYear', header: 'Năm sinh bố', width: 15, format: 'number', note: 'Năm, VD: 1970' },
    { key: 'fatherOccupation', header: 'Nghề nghiệp bố', width: 20 },
    { key: 'fatherWorkplace', header: 'Nơi làm việc của bố', width: 30 },
    { key: 'motherName', header: 'Họ tên mẹ', width: 25 },
    { key: 'motherBirthYear', header: 'Năm sinh mẹ', width: 15, format: 'number', note: 'Năm, VD: 1972' },
    { key: 'motherOccupation', header: 'Nghề nghiệp mẹ', width: 20 },
    { key: 'motherWorkplace', header: 'Nơi làm việc của mẹ', width: 30 },
    { key: 'spouseName', header: 'Họ tên vợ/chồng', width: 25 },
    { key: 'spouseBirthYear', header: 'Năm sinh vợ/chồng', width: 18, format: 'number', note: 'Năm, VD: 1990' },
    { key: 'spouseOccupation', header: 'Nghề nghiệp vợ/chồng', width: 20 },
    { key: 'spouseWorkplace', header: 'Nơi làm việc của vợ/chồng', width: 30 },
    {
        key: 'highestProfessionalDegree',
        header: 'Trình độ CMNV cao nhất',
        width: 35,
        dropdown: DROPDOWN_VALUES.highestProfessionalDegree,
    },
    { key: 'mainMajor', header: 'Chuyên ngành chính', width: 25 },
    {
        key: 'majorDegreeLevel',
        header: 'Trình độ chuyên ngành chính',
        width: 28,
        required: true,
        dropdown: DROPDOWN_VALUES.majorDegreeLevel,
    },
    { key: 'mainForeignLanguage', header: 'Ngoại ngữ chính', width: 20 },
    { key: 'foreignLanguageLevel', header: 'Trình độ ngoại ngữ', width: 20 },
    {
        key: 'languageCertificateGroup',
        header: 'Nhóm chứng chỉ ngoại ngữ',
        width: 25,
        dropdown: DROPDOWN_VALUES.languageCertificateGroup,
    },
    { key: 'itLevel', header: 'Trình độ tin học', width: 20 },
    {
        key: 'politicalTheoryLevel',
        header: 'Trình độ lý luận chính trị',
        width: 28,
        dropdown: DROPDOWN_VALUES.politicalTheoryLevel,
    },
    { key: 'recruitmentDate', header: 'Ngày tuyển dụng', width: 18, format: 'date' },
];

/**
 * ✅ Format giá trị theo kiểu dữ liệu
 */
const formatValue = (value, format) => {
    if (value === null || value === undefined || value === '') return '';

    if (format === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    if (format === 'number') {
        return Number(value) || '';
    }

    return value;
};

/**
 * ✅ Helper: Chuyển column index (0-based) thành Excel column letter (A, B, C, ..., Z, AA, AB, ...)
 */
const getColumnLetter = (colNumber) => {
    let letter = '';
    while (colNumber >= 0) {
        letter = String.fromCharCode((colNumber % 26) + 65) + letter;
        colNumber = Math.floor(colNumber / 26) - 1;
    }
    return letter;
};

/**
 * ✅ Xuất Excel với định dạng đầy đủ
 */
export const exportPersonnelRecordsToExcel = async (records, schoolName) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách cán bộ', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // ========== HEADER: Tên trường + Tuyên ngôn ==========
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'BỘ GIÁO DỤC VÀ ĐÀO TẠO';
    worksheet.getCell('A1').font = { bold: true, size: 12 };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('F1:J1');
    worksheet.getCell('F1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
    worksheet.getCell('F1').font = { bold: true, size: 12 };
    worksheet.getCell('F1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = schoolName || 'Mầm non Huynh Kim Phụng';
    worksheet.getCell('A2').font = { bold: true, size: 11, underline: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('F2:J2');
    worksheet.getCell('F2').value = 'Độc Lập - Tự Do - Hạnh Phúc';
    worksheet.getCell('F2').font = { bold: true, size: 11, underline: true };
    worksheet.getCell('F2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells(`B3`);
    worksheet.getCell('B3').value = 'DANH SÁCH CÁN BỘ';
    worksheet.getCell('B3').font = { bold: true, size: 16 };
    worksheet.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([]); // Row 4: trống

    // ========== HEADER COLUMNS (Row 5) ==========
    const headerRow = worksheet.addRow(COLUMNS_CONFIG.map((col) => col.header));

    headerRow.eachCell((cell, colNumber) => {
        const col = COLUMNS_CONFIG[colNumber - 1];

        // Style chung
        cell.font = { bold: true, size: 11, color: col.required ? { argb: 'FFFF0000' } : { argb: 'FF000000' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        // Set width
        worksheet.getColumn(colNumber).width = col.width || 15;

        // Add comment (note)
        if (col.note) {
            cell.note = col.note;
        }
    });

    // ========== DATA ROWS ==========
    // eslint-disable-next-line no-unused-vars
    const startRow = 6; // Dữ liệu bắt đầu từ row 6
    const maxRows = Math.max(records.length, 100); // Tối thiểu 100 dòng để apply validation

    for (let i = 0; i < maxRows; i++) {
        const record = records[i] || {}; // Nếu không có data, dùng object rỗng

        // eslint-disable-next-line no-unused-vars
        const rowValues = COLUMNS_CONFIG.map((col, colIndex) => {
            if (col.key === 'stt') {
                return i < records.length ? i + 1 : ''; // STT chỉ hiển thị nếu có data
            }
            return formatValue(record[col.key], col.format);
        });

        const row = worksheet.addRow(rowValues);

        row.eachCell((cell, colNumber) => {
            const col = COLUMNS_CONFIG[colNumber - 1];

            // Style
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = {
                horizontal: col.key === 'stt' || col.format === 'number' ? 'center' : 'left',
                vertical: 'middle',
                wrapText: true,
            };
        });
    }

    // ========== ✅ APPLY DATA VALIDATION CHO TOÀN BỘ COLUMN (Row 6 đến 10000) ==========
    COLUMNS_CONFIG.forEach((col, colIndex) => {
        if (col.key !== 'stt' && col.dropdown && col.dropdown.length > 0) {
            const columnLetter = getColumnLetter(colIndex);
            // eslint-disable-next-line no-unused-vars
            const range = `${columnLetter}6:${columnLetter}10000`; // Apply từ row 6 đến 10000

            worksheet.getCell(`${columnLetter}6`).dataValidation = {
                type: 'list',
                allowBlank: !col.required,
                formulae: [`"${col.dropdown.join(',')}"`],
                showErrorMessage: true,
                errorTitle: 'Lỗi nhập liệu',
                error: `Vui lòng chọn một trong các giá trị: ${col.dropdown.join(', ')}`,
            };

            // Copy validation sang tất cả các cell trong column
            for (let row = 6; row <= 10000; row++) {
                const cell = worksheet.getCell(`${columnLetter}${row}`);
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: !col.required,
                    formulae: [`"${col.dropdown.join(',')}"`],
                    showErrorMessage: true,
                    errorTitle: 'Lỗi nhập liệu',
                    error: `Vui lòng chọn một trong các giá trị: ${col.dropdown.join(', ')}`,
                };
            }
        }
    });

    // ========== Freeze header ==========
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

    // ========== Export file ==========
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Danh_sach_can_bo_${new Date().getTime()}.xlsx`);
};

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { VIETNAM_ETHNICITIES } from '~/utils/vietnamEthnicities';

/**
 * ===============================
 * DROPDOWN VALUES
 * ===============================
 */
const DROPDOWN_VALUES = {
    gender: ['Nam', 'Nữ'],
    status: ['Đang học', 'Nghỉ học'],
    ageGroup: ['12-24 tháng', '24-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi'], // ✅ THÊM
    ethnicity: VIETNAM_ETHNICITIES.map((e) => e.name),
};

/**
 * Thứ tự dropdown (QUAN TRỌNG – không được đổi lung tung)
 */
const DROPDOWN_KEYS = ['gender', 'status', 'ethnicity', 'ageGroup'];

/**
 * ===============================
 * COLUMN CONFIG
 * ===============================
 */
const COLUMNS_CONFIG = [
    { key: 'stt', header: 'STT', width: 8 },
    { key: 'studentCode', header: 'Mã học sinh', width: 18 },
    { key: 'fullName', header: 'Họ và tên học sinh', width: 25, required: true },
    { key: 'birthDate', header: 'Ngày sinh', width: 15, required: true, format: 'date' },
    { key: 'gender', header: 'Giới tính', width: 12, required: true, dropdown: true },
    { key: 'ethnicity', header: 'Dân tộc', width: 15, required: true, dropdown: true },
    { key: 'enrollmentDate', header: 'Ngày nhập học', width: 15, required: true, format: 'date' },
    {
        key: 'currentAgeGroup',
        header: 'Nhóm tuổi hiện tại',
        width: 18,
        required: true,
        dropdown: true,
    },
    { key: 'status', header: 'Trạng thái', width: 15, required: true, dropdown: true },
    { key: 'permanentAddress', header: 'Địa chỉ thường trú', width: 40, required: true },
    { key: 'currentAddress', header: 'Địa chỉ hiện tại', width: 40, required: true },
    { key: 'motherName', header: 'Họ và tên mẹ', width: 25 },
    { key: 'motherBirthYear', header: 'Năm sinh mẹ', width: 15, format: 'number' },
    { key: 'motherPhone', header: 'SĐT mẹ', width: 15 },
    { key: 'motherEmail', header: 'Email mẹ', width: 30 },
    { key: 'fatherName', header: 'Họ và tên bố', width: 25 },
    { key: 'fatherBirthYear', header: 'Năm sinh bố', width: 15, format: 'number' },
    { key: 'fatherPhone', header: 'SĐT bố', width: 15 },
    { key: 'fatherEmail', header: 'Email bố', width: 30 },
];

/**
 * ===============================
 * HELPERS
 * ===============================
 */
const formatValue = (value, format) => {
    if (value === null || value === undefined || value === '') return '';
    if (format === 'date') return dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : '';
    if (format === 'number') return Number(value) || '';
    return value;
};

const getColumnLetter = (index) => {
    let letter = '';
    while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
};

// Vẽ full border cho toàn bộ bảng
const applyFullBorder = (worksheet, startRow, endRow, startCol, endCol) => {
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            worksheet.getCell(r, c).border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        }
    }
};

/**
 * ===============================
 * MAIN EXPORT FUNCTION
 * ===============================
 */
export const exportChildrenManagementToExcel = async (children = [], schoolName = '') => {
    const workbook = new ExcelJS.Workbook();

    /**
     * ===============================
     * MAIN WORKSHEET (PHẢI TẠO TRƯỚC)
     * ===============================
     */
    const worksheet = workbook.addWorksheet('Danh sách trẻ', {
        views: [{ state: 'frozen', ySplit: 6 }],
    });

    // ===== Header quốc hiệu =====
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'BỘ GIÁO DỤC VÀ ĐÀO TẠO';
    worksheet.getCell('A1').font = { bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('F1:J1');
    worksheet.getCell('F1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
    worksheet.getCell('F1').font = { bold: true };
    worksheet.getCell('F1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = schoolName.toUpperCase() || 'TRƯỜNG MẦM NON';
    worksheet.getCell('A2').font = { bold: true, underline: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('F2:J2');
    worksheet.getCell('F2').value = 'Độc Lập - Tự Do - Hạnh Phúc';
    worksheet.getCell('F2').font = { bold: true, underline: true };
    worksheet.getCell('F2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('B3:H3');
    worksheet.getCell('B3').value = 'DANH SÁCH TRẺ TOÀN TRƯỜNG';
    worksheet.getCell('B3').font = { bold: true, size: 16 };
    worksheet.getCell('B3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:S4');
    worksheet.getCell('A4').value = `📌 LƯU Ý:\n• Các cột có tiêu đề màu ĐỎ là BẮT BUỘC phải nhập
• Cột "Mã học sinh": Để trống = Thêm mới (Hệ thống tự tạo mã theo công thức mã trường-HS0001)
• Cột "Mã học sinh": Có mã học sinh = Cập nhật thông tin trẻ có mã học sinh đó
• Dòng nào có "Họ và tên học sinh" thì mới được xử lý (thêm mới hoặc cập nhật)
• Các cột có dropdown (▼): Click chọn giá trị, không nhập tay
• Định dạng ngày: dd/mm/yyyy (VD: 15/05/2020)`;
    worksheet.getCell('A4').font = { size: 10, color: { argb: 'FF0066CC' } };
    worksheet.getCell('A4').alignment = { wrapText: true, vertical: 'top' };
    worksheet.getRow(4).height = 100;

    worksheet.addRow([]);

    /**
     * ===============================
     * HEADER TABLE
     * ===============================
     */
    const headerRow = worksheet.addRow(COLUMNS_CONFIG.map((c) => c.header));
    headerRow.height = 40;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    headerRow.eachCell((cell, colIndex) => {
        const col = COLUMNS_CONFIG[colIndex - 1];
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: col.required ? 'FFFF0000' : 'FF4472C4' },
        };
    });

    COLUMNS_CONFIG.forEach((c, i) => {
        worksheet.getColumn(i + 1).width = c.width;
    });

    /**
     * ===============================
     * DATA ROWS
     * ===============================
     */
    const DATA_START_ROW = 7;

    if (children.length > 0) {
        children.forEach((child, index) => {
            worksheet.addRow(
                COLUMNS_CONFIG.map((c) => (c.key === 'stt' ? index + 1 : formatValue(child[c.key], c.format))),
            );
        });
    } else {
        for (let i = 0; i < 1000; i++) {
            worksheet.addRow(new Array(COLUMNS_CONFIG.length).fill(''));
        }
    }

    const LAST_ROW = worksheet.rowCount;
    const LAST_COL = COLUMNS_CONFIG.length;

    // ✅ Full border cho toàn bảng
    applyFullBorder(worksheet, 6, LAST_ROW, 1, LAST_COL);

    /**
     * ===============================
     * DROPDOWN SHEET (TẠO SAU – ẨN)
     * ===============================
     */
    const dropdownSheet = workbook.addWorksheet('_dropdowns');
    dropdownSheet.state = 'hidden';

    DROPDOWN_KEYS.forEach((key, colIndex) => {
        const values = DROPDOWN_VALUES[key];
        values.forEach((v, rowIndex) => {
            dropdownSheet.getCell(rowIndex + 1, colIndex + 1).value = v;
        });
        dropdownSheet.getColumn(colIndex + 1).width = 30;
    });

    const DROPDOWN_RANGES = {
        gender: '_dropdowns!$A$1:$A$2',
        status: '_dropdowns!$B$1:$B$2',
        ethnicity: `_dropdowns!$C$1:$C$${DROPDOWN_VALUES.ethnicity.length}`,
        currentAgeGroup: `_dropdowns!$D$1:$D$${DROPDOWN_VALUES.ageGroup.length}`,
    };

    // Active sheet chính
    workbook.views = [{ activeTab: 0 }];

    /**
     * ===============================
     * DATA VALIDATION
     * ===============================
     */
    COLUMNS_CONFIG.forEach((col, colIndex) => {
        if (!col.required) return;

        if (!col.dropdown) return;
        const columnLetter = getColumnLetter(colIndex);

        for (let row = DATA_START_ROW; row <= LAST_ROW; row++) {
            worksheet.getCell(`${columnLetter}${row}`).dataValidation = {
                type: 'list',
                allowBlank: !col.required,
                formulae: [DROPDOWN_RANGES[col.key]],
                showErrorMessage: true,
                errorTitle: 'Lỗi nhập liệu',
                error: 'Vui lòng chọn giá trị trong danh sách',
            };
        }
    });

    /**
     * ===============================
     * EXPORT
     * ===============================
     */
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename =
        children.length === 0
            ? `Template_DanhSachTreEm_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
            : `DanhSach_TreEm_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;

    saveAs(blob, filename);
};

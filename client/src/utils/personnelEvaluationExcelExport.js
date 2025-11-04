// client/src/utils/personnelEvaluationExcelExport.js

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * ✅ Định nghĩa các giá trị enum cho dropdown
 */
const DROPDOWN_VALUES = {
    officialEvaluation: ['Xuất sắc', 'Hoàn thành tốt', 'Hoàn thành (hạn chế về NL)', 'Không hoàn thành nhiệm vụ'],
    regularTraining: ['Tốt', 'Khá', 'Đạt', 'Chưa hoàn thành'],
    excellentTeacher: ['Cấp Tỉnh', 'Cấp Huyện', 'Cấp trường'],
    emulationTitle: [
        'Chiến sĩ thi đua toàn quốc',
        'Chiến sĩ thi đua cấp tỉnh',
        'Chiến sĩ thi đua cơ sở',
        'Lao động tiên tiến',
    ],
};

/**
 * ✅ Định nghĩa cấu trúc columns
 */
const COLUMNS_CONFIG = [
    { key: 'stt', header: 'STT', width: 8 },
    { key: 'fullName', header: 'Họ tên cán bộ', width: 25, required: true },
    { key: 'personnelCode', header: 'Mã cán bộ', width: 15, required: true },
    { key: 'department', header: 'Tổ bộ môn', width: 18 },
    { key: 'positionGroup', header: 'Nhóm chức vụ', width: 18 },
    { key: 'workStatus', header: 'Trạng thái', width: 18 },
    {
        key: 'officialEvaluation',
        header: 'Đánh giá viên chức',
        width: 25,
        dropdown: DROPDOWN_VALUES.officialEvaluation,
    },
    {
        key: 'regularTraining',
        header: 'Bồi dưỡng thường xuyên',
        width: 25,
        dropdown: DROPDOWN_VALUES.regularTraining,
    },
    {
        key: 'excellentTeacher',
        header: 'Giáo viên dạy giỏi',
        width: 20,
        dropdown: DROPDOWN_VALUES.excellentTeacher,
    },
    {
        key: 'emulationTitle',
        header: 'Danh hiệu thi đua',
        width: 30,
        dropdown: DROPDOWN_VALUES.emulationTitle,
    },
    { key: 'notes', header: 'Ghi chú', width: 40 },
];

/**
 * ✅ Helper: Chuyển column index thành Excel column letter (A, B, C, ..., Z, AA, AB, ...)
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
 * ✅ Xuất Excel Danh sách đánh giá xếp loại
 */
export const exportPersonnelEvaluationToExcel = async (records, schoolName, academicYear) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Đánh giá xếp loại', {
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

    worksheet.mergeCells('A3:K3');
    worksheet.getCell('A3').value = `DANH SÁCH ĐÁNH GIÁ XẾP LOẠI CÁN BỘ - NĂM HỌC ${academicYear || ''}`;
    worksheet.getCell('A3').font = { bold: true, size: 16 };
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

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
    });

    // ========== DATA ROWS ==========
    const maxRows = Math.max(records.length, 50); // Tối thiểu 50 dòng

    for (let i = 0; i < maxRows; i++) {
        const record = records[i] || {};

        const rowValues = COLUMNS_CONFIG.map((col) => {
            if (col.key === 'stt') {
                return i < records.length ? i + 1 : '';
            }

            // Lấy dữ liệu từ nested object
            if (col.key === 'department' && record.personnelRecordId) {
                return record.personnelRecordId.department || '';
            }
            if (col.key === 'positionGroup' && record.personnelRecordId) {
                return record.personnelRecordId.positionGroup || '';
            }
            if (col.key === 'workStatus' && record.personnelRecordId) {
                return record.personnelRecordId.workStatus || '';
            }

            return record[col.key] || '';
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
                horizontal: col.key === 'stt' ? 'center' : 'left',
                vertical: 'middle',
                wrapText: true,
            };
        });
    }

    // ========== APPLY DATA VALIDATION CHO TOÀN BỘ COLUMN ==========
    COLUMNS_CONFIG.forEach((col, colIndex) => {
        if (col.dropdown && col.dropdown.length > 0) {
            const columnLetter = getColumnLetter(colIndex);

            worksheet.getCell(`${columnLetter}6`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`"${col.dropdown.join(',')}"`],
                showErrorMessage: true,
                errorTitle: 'Lỗi nhập liệu',
                error: `Vui lòng chọn một trong các giá trị: ${col.dropdown.join(', ')}`,
            };

            // Copy validation sang tất cả các cell
            for (let row = 6; row <= maxRows + 5; row++) {
                const cell = worksheet.getCell(`${columnLetter}${row}`);
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: true,
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
    saveAs(blob, `Danh_gia_xep_loai_${academicYear || ''}_${new Date().getTime()}.xlsx`);
};
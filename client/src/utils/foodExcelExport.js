// client/src/utils/foodExcelExport.js

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

/**
 * ✅ Định nghĩa các giá trị enum cho dropdown
 */
const DROPDOWN_VALUES = {
    unit: [
        'Kg',
        'Hộp',
        'Miếng',
        'Cốc',
        'Quả',
        'Trứng',
        'Chén',
        'Gói',
        'Chai',
        'Hũ',
        'Cái',
        'Ổ',
        'Bát',
        'Tô',
        'Lon',
        'Túi',
        'Bịch',
        'Bao',
        'Trái',
        'Củ',
        'Cây',
        'Bắp',
        'Tép',
        'Lát',
        'Khoanh',
        'Khúc',
        'Bó',
        'Mớ',
        'Chùm',
        'Nải',
        'Lá',
        'Con',
        'Viên',
        'Hạt',
    ],
};

/**
 * ✅ Định nghĩa cấu trúc columns
 */
const COLUMNS_CONFIG = [
    { key: 'stt', header: 'STT', width: 8 },
    {
        key: 'name',
        header: 'Tên thực phẩm',
        width: 30,
        required: true,
        note: 'Bắt buộc nhập\nVD: Thịt gà, Cà rốt...',
    },
    {
        key: 'unit',
        header: 'Đơn vị tính',
        width: 15,
        required: true,
        dropdown: DROPDOWN_VALUES.unit,
        note: 'Bắt buộc\nMặc định: Kg',
    },
    {
        key: 'gramConversion',
        header: 'Quy đổi sang gam',
        width: 18,
        required: true,
        format: 'number',
        note: 'Bắt buộc\nTừ 1 đến 1000 gam',
    },
    {
        key: 'category_dongvat',
        header: 'Động vật',
        width: 12,
        note: 'Đánh dấu x nếu có',
    },
    {
        key: 'category_thucvat',
        header: 'Thực vật',
        width: 12,
        note: 'Đánh dấu x nếu có',
    },
    {
        key: 'category_kho',
        header: 'Thực phẩm Khô',
        width: 18,
        note: 'Đánh dấu x nếu có',
    },
    {
        key: 'category_tuoi',
        header: 'Thực phẩm tươi',
        width: 18,
        note: 'Đánh dấu x nếu có',
    },
    {
        key: 'category_anlien',
        header: 'Thực phẩm ăn liền',
        width: 20,
        note: 'Đánh dấu x nếu có',
    },
    {
        key: 'wastePercentage',
        header: 'Hệ số thái bỏ (%)',
        width: 18,
        required: true,
        format: 'number',
        note: 'Bắt buộc\nTừ 0 đến 99\nMặc định: 0',
    },
    {
        key: 'protein',
        header: 'Protein (Đạm)',
        width: 18,
        required: true,
        format: 'number',
        note: 'Bắt buộc\nSố thập phân ≥ 0\nVD: 0.005, 9.026',
    },
    {
        key: 'lipid',
        header: 'Lipid (Béo)',
        width: 18,
        required: true,
        format: 'number',
        note: 'Bắt buộc\nSố thập phân ≥ 0\nVD: 0.005, 9.026',
    },
    {
        key: 'glucid',
        header: 'Glucid (Đường)',
        width: 18,
        required: true,
        format: 'number',
        note: 'Bắt buộc\nSố thập phân ≥ 0\nVD: 0.005, 9.026',
    },
];

/**
 * ✅ Helper: Get column letter from index (A, B, C, ...)
 */
const getColumnLetter = (colIndex) => {
    let letter = '';
    let index = colIndex;
    while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
};

/**
 * ✅ Format giá trị theo kiểu dữ liệu
 */
const formatValue = (value, format) => {
    if (value === null || value === undefined || value === '') return '';

    if (format === 'number') {
        return Number(value);
    }

    return value;
};

/**
 * ✅ Export template hoặc data
 */
export const exportFoodsToExcel = async (foods = []) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách thực phẩm', {
            pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
        });

        // ========== HEADER: Tên hệ thống + Tuyên ngôn ==========
        worksheet.mergeCells('A1:E1');
        worksheet.getCell('A1').value = 'HỆ THỐNG QUẢN LÝ MẦM NON';
        worksheet.getCell('A1').font = { bold: true, size: 12 };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('F1:J1');
        worksheet.getCell('F1').value = 'NGÂN HÀNG DỮ LIỆU THỰC PHẨM';
        worksheet.getCell('F1').font = { bold: true, size: 12 };
        worksheet.getCell('F1').alignment = { horizontal: 'center', vertical: 'middle' };

        // ========== TITLE ==========
        worksheet.mergeCells('B2:H2');
        worksheet.getCell('B2').value = 'DANH SÁCH THỰC PHẨM';
        worksheet.getCell('B2').font = { bold: true, size: 16 };
        worksheet.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.addRow([]); // Row 3: trống

        // ========== LƯU Ý ==========
        let noteText = '📌 LƯU Ý:\n';
        noteText += '• Các cột có tiêu đề màu ĐỎ là BẮT BUỘC phải nhập\n';
        noteText += '• Cột "Loại thực phẩm": Đánh dấu "x" vào cột tương ứng (1 thực phẩm có thể có nhiều loại)\n';
        noteText += '• Quy đổi sang gam: Nhập số từ 1 đến 1000\n';
        noteText += '• Hệ số thái bỏ: Nhập số từ 0 đến 99 (%)\n';
        noteText += '• Protein, Lipid, Glucid: Nhập số thập phân ≥ 0 (VD: 0.005, 9.026)\n';

        worksheet.mergeCells('A4:M4');
        worksheet.getCell('A4').value = noteText;
        worksheet.getCell('A4').font = { size: 10, color: { argb: 'FF0066CC' } };
        worksheet.getCell('A4').alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        worksheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        worksheet.getCell('A4').border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
        worksheet.getRow(4).height = 100;

        worksheet.addRow([]); // Row 5: trống

        // ========== HEADER COLUMNS (Row 6) ==========
        const headerRow = worksheet.addRow(COLUMNS_CONFIG.map((col) => col.header));

        headerRow.eachCell((cell, colNumber) => {
            const col = COLUMNS_CONFIG[colNumber - 1];

            cell.font = {
                bold: true,
                size: 11,
                color: col.required ? { argb: 'FFFF0000' } : { argb: 'FF000000' },
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE3F2FD' },
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

            worksheet.getColumn(colNumber).width = col.width || 15;

            if (col.note) {
                cell.note = col.note;
            }
        });

        // ========== DATA ROWS ==========
        const maxRows = Math.max(foods.length, 3000);

        for (let i = 0; i < maxRows; i++) {
            const food = foods[i];

            const rowValues = COLUMNS_CONFIG.map((col) => {
                if (col.key === 'stt') {
                    return food ? i + 1 : '';
                }

                if (!food) return col.key.startsWith('category_') ? '' : col.format === 'number' ? 0 : '';

                // ✅ Handle categories (5 cột riêng)
                if (col.key === 'category_dongvat') return food.categories?.includes('Động vật') ? 'x' : '';
                if (col.key === 'category_thucvat') return food.categories?.includes('Thực vật') ? 'x' : '';
                if (col.key === 'category_kho') return food.categories?.includes('Thực phẩm Khô') ? 'x' : '';
                if (col.key === 'category_tuoi') return food.categories?.includes('Thực phẩm tươi') ? 'x' : '';
                if (col.key === 'category_anlien') return food.categories?.includes('Thực phẩm ăn liền') ? 'x' : '';

                return formatValue(food[col.key], col.format);
            });

            const row = worksheet.addRow(rowValues);

            row.eachCell((cell, colNumber) => {
                const col = COLUMNS_CONFIG[colNumber - 1];

                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                cell.alignment = {
                    horizontal:
                        col.key === 'stt' || col.format === 'number' || col.key.startsWith('category_')
                            ? 'center'
                            : 'left',
                    vertical: 'middle',
                    wrapText: true,
                };
            });
        }

        // ========== APPLY DATA VALIDATION ==========
        COLUMNS_CONFIG.forEach((col, colIndex) => {
            if (col.dropdown && col.dropdown.length > 0) {
                const columnLetter = getColumnLetter(colIndex);

                worksheet.getCell(`${columnLetter}7`).dataValidation = {
                    type: 'list',
                    allowBlank: !col.required,
                    formulae: [`"${col.dropdown.join(',')}"`],
                    showErrorMessage: true,
                    errorTitle: 'Lỗi nhập liệu',
                    error: `Vui lòng chọn: ${col.dropdown.join(', ')}`,
                };

                for (let row = 7; row <= maxRows + 6; row++) {
                    const cell = worksheet.getCell(`${columnLetter}${row}`);
                    cell.dataValidation = {
                        type: 'list',
                        allowBlank: !col.required,
                        formulae: [`"${col.dropdown.join(',')}"`],
                        showErrorMessage: true,
                        errorTitle: 'Lỗi nhập liệu',
                        error: `Vui lòng chọn: ${col.dropdown.join(', ')}`,
                    };
                }
            }
        });

        // ========== Freeze header ==========
        worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }];

        // ========== Export file ==========
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const timestamp = dayjs().format('YYYYMMDD_HHmmss');
        const filename =
            foods.length === 0 ? `Template_ThucPham_${timestamp}.xlsx` : `DanhSach_ThucPham_${timestamp}.xlsx`;

        saveAs(blob, filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
};

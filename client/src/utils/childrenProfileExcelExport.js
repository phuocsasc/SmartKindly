import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

/**
 * ✅ Định nghĩa các giá trị enum cho dropdown
 */
const DROPDOWN_VALUES = {
    gender: ['Nam', 'Nữ'],
    ageGroup: ['3-12 tháng', '12-24 tháng', '24-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi'],
    status: ['Đang học', 'Nghỉ học'],
    enrollmentForm: ['Xét tuyển', 'Trúng tuyển', 'Chuyển đến từ trường khác'],
    swimmingLevel: ['Chưa biết', 'Biết sơ cấp', 'Biết bơi thành thạo'],
    bloodType: ['A', 'B', 'AB', 'O', 'Không rõ'],
    yesNo: ['Có', 'Không'],
    familyComponent: ['Công nhân', 'Nông dân', 'Khác'],
};

/**
 * ✅ Định nghĩa cấu trúc columns
 */
const COLUMNS_CONFIG = [
    { key: 'stt', header: 'STT', width: 8 },
    {
        key: 'studentCode',
        header: 'Mã học sinh',
        width: 18,
        note: 'Để trống = Thêm mới\nCó mã = Cập nhật',
    },
    {
        key: 'fullName',
        header: 'Họ và tên',
        width: 25,
        required: true,
        note: 'Bắt buộc nhập',
    },
    {
        key: 'birthDate',
        header: 'Ngày sinh',
        width: 15,
        required: true,
        format: 'date',
        note: 'Bắt buộc\nĐịnh dạng: dd/mm/yyyy',
    },
    {
        key: 'gender',
        header: 'Giới tính',
        width: 12,
        required: true,
        dropdown: DROPDOWN_VALUES.gender,
        note: 'Bắt buộc\nChọn: Nam hoặc Nữ',
    },
    {
        key: 'ageGroup',
        header: 'Khối',
        width: 18,
        required: true,
        dropdown: DROPDOWN_VALUES.ageGroup,
        note: 'Bắt buộc\nChọn khối phù hợp',
    },
    {
        key: 'className',
        header: 'Tên lớp',
        width: 20,
        required: true,
        note: 'Bắt buộc\nChọn lớp đã tạo trong năm học',
    },
    {
        key: 'status',
        header: 'Trạng thái',
        width: 15,
        required: true,
        dropdown: DROPDOWN_VALUES.status,
        note: 'Bắt buộc\nMặc định: Đang học',
    },
    {
        key: 'enrollmentDate',
        header: 'Ngày nhập học',
        width: 15,
        required: true,
        format: 'date',
        note: 'Bắt buộc\nĐịnh dạng: dd/mm/yyyy',
    },
    {
        key: 'enrollmentForm',
        header: 'Hình thức',
        width: 30,
        dropdown: DROPDOWN_VALUES.enrollmentForm,
        note: 'Không bắt buộc',
    },
    { key: 'birthPlace', header: 'Nơi sinh', width: 30, note: 'Không bắt buộc' },
    { key: 'hometown', header: 'Quê quán', width: 40, note: 'Không bắt buộc' },
    {
        key: 'permanentAddress',
        header: 'Địa chỉ thường trú',
        width: 40,
        required: true,
        note: 'Bắt buộc',
    },
    {
        key: 'temporaryAddress',
        header: 'Địa chỉ tạm trú',
        width: 40,
        required: true,
        note: 'Bắt buộc',
    },
    {
        key: 'ethnicity',
        header: 'Dân tộc',
        width: 15,
        required: true,
        note: 'Bắt buộc\nVD: Kinh',
    },
    { key: 'religion', header: 'Tôn giáo', width: 15, note: 'Không bắt buộc' },
    {
        key: 'swimmingLevel',
        header: 'Biết bơi',
        width: 20,
        dropdown: DROPDOWN_VALUES.swimmingLevel,
        note: 'Không bắt buộc',
    },
    {
        key: 'bloodType',
        header: 'Nhóm máu',
        width: 12,
        dropdown: DROPDOWN_VALUES.bloodType,
        note: 'Không bắt buộc',
    },
    {
        key: 'hasComputer',
        header: 'Phụ huynh có máy tính',
        width: 22,
        dropdown: DROPDOWN_VALUES.yesNo,
        note: 'Không bắt buộc',
    },
    {
        key: 'hasSmartphone',
        header: 'Phụ huynh có smartphone',
        width: 25,
        dropdown: DROPDOWN_VALUES.yesNo,
        note: 'Không bắt buộc',
    },
    {
        key: 'familyComponent',
        header: 'Thành phần gia đình',
        width: 20,
        dropdown: DROPDOWN_VALUES.familyComponent,
        note: 'Không bắt buộc',
    },
    { key: 'fatherName', header: 'Tên bố', width: 25, note: 'Không bắt buộc' },
    {
        key: 'fatherBirthYear',
        header: 'Năm sinh bố',
        width: 15,
        format: 'number',
        note: 'VD: 1980',
    },
    { key: 'fatherOccupation', header: 'Nghề nghiệp bố', width: 20, note: 'Không bắt buộc' },
    {
        key: 'fatherPhone',
        header: 'SĐT bố',
        width: 15,
        note: '10-11 chữ số',
    },
    {
        key: 'fatherEmail',
        header: 'Email bố',
        width: 30,
        note: 'Email hợp lệ',
    },
    { key: 'motherName', header: 'Tên mẹ', width: 25, note: 'Không bắt buộc' },
    {
        key: 'motherBirthYear',
        header: 'Năm sinh mẹ',
        width: 15,
        format: 'number',
        note: 'VD: 1982',
    },
    { key: 'motherOccupation', header: 'Nghề nghiệp mẹ', width: 20, note: 'Không bắt buộc' },
    {
        key: 'motherPhone',
        header: 'SĐT mẹ',
        width: 15,
        note: '10-11 chữ số',
    },
    {
        key: 'motherEmail',
        header: 'Email mẹ',
        width: 30,
        note: 'Email hợp lệ',
    },
    { key: 'guardianName', header: 'Tên người giám hộ', width: 25, note: 'Không bắt buộc' },
    {
        key: 'guardianBirthYear',
        header: 'Năm sinh người giám hộ',
        width: 25,
        format: 'number',
        note: 'VD: 1975',
    },
    { key: 'guardianOccupation', header: 'Nghề nghiệp người giám hộ', width: 25, note: 'Không bắt buộc' },
    {
        key: 'guardianPhone',
        header: 'SĐT người giám hộ',
        width: 20,
        note: '10-11 chữ số',
    },
    {
        key: 'guardianEmail',
        header: 'Email người giám hộ',
        width: 30,
        note: 'Email hợp lệ',
    },
];

/**
 * ✅ Format giá trị theo kiểu dữ liệu
 */
const formatValue = (value, format) => {
    if (value === null || value === undefined || value === '') return '';

    if (format === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        return dayjs(date).format('DD/MM/YYYY');
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
 * ✅ Export children profiles to Excel với style giống personnelRecordExcelExport
 */
export const exportChildrenProfilesToExcel = async (
    profiles = [],
    schoolName = '',
    userRole = '',
    classesData = {},
) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Hồ sơ trẻ em', {
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
        worksheet.getCell('A2').value = schoolName.toUpperCase() || 'TRƯỜNG MẦM NON';
        worksheet.getCell('A2').font = { bold: true, size: 11, underline: true };
        worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('F2:J2');
        worksheet.getCell('F2').value = 'Độc Lập - Tự Do - Hạnh Phúc';
        worksheet.getCell('F2').font = { bold: true, size: 11, underline: true };
        worksheet.getCell('F2').alignment = { horizontal: 'center', vertical: 'middle' };

        // ========== TITLE ==========
        let titleText = '';
        if (userRole === 'ban_giam_hieu') {
            titleText = 'DANH SÁCH HỒ SƠ TRẺ EM TOÀN TRƯỜNG';
        } else if (userRole === 'to_truong') {
            titleText = 'DANH SÁCH HỒ SƠ TRẺ EM THEO KHỐI';
        } else if (userRole === 'giao_vien') {
            titleText = 'DANH SÁCH HỒ SƠ TRẺ EM THEO LỚP';
        } else {
            titleText = 'DANH SÁCH HỒ SƠ TRẺ EM';
        }

        worksheet.mergeCells('B3:H3');
        worksheet.getCell('B3').value = titleText;
        worksheet.getCell('B3').font = { bold: true, size: 16 };
        worksheet.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };

        // ========== LƯU Ý ==========
        let noteText = '📌 LƯU Ý:\n';
        noteText += '• Các cột có tiêu đề màu ĐỎ là BẮT BUỘC phải nhập\n';
        noteText += '• Cột "Mã học sinh": Để trống = Thêm mới (Hệ thống tự tạo mã theo công thức schoolId-HS000001)\n';
        noteText += '• Cột "Mã học sinh": Có mã học sinh giống trong năm học "đang hoạt động" = Cập nhật\n';
        noteText +=
            '• Cột "Mã học sinh": Có mã học sinh giống trong năm học "đã qua" = Thêm mới (Với mã học sinh cũ)\n';
        noteText += '• Chọn đúng "Khối" và nhập đúng "Tên lớp" đã khởi tạo trong năm học đang hoạt động\n';

        if (classesData && Object.keys(classesData).length > 0) {
            noteText += '\n📚 DANH SÁCH LỚP THEO KHỐI:\n';
            Object.entries(classesData).forEach(([ageGroup, classes]) => {
                noteText += `  • Khối: ${ageGroup}:  ${classes.join(', ')}\n`;
            });
        }

        worksheet.mergeCells('A4:AK4');
        worksheet.getCell('A4').value = noteText;
        worksheet.getCell('A4').font = { size: 10, color: { argb: 'FF0066CC' } };
        worksheet.getCell('A4').alignment = {
            horizontal: 'left',
            vertical: 'top',
            wrapText: true,
        };
        worksheet.getCell('A4').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' },
        };
        worksheet.getCell('A4').border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
        worksheet.getRow(4).height = 160; // Tăng chiều cao row

        worksheet.addRow([]); // Row 5: trống

        // ========== HEADER COLUMNS (Row 6) ==========
        const headerRow = worksheet.addRow(COLUMNS_CONFIG.map((col) => col.header));

        headerRow.eachCell((cell, colNumber) => {
            const col = COLUMNS_CONFIG[colNumber - 1];

            // Style chung
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

            // Set width
            worksheet.getColumn(colNumber).width = col.width || 15;

            // Add comment (note)
            if (col.note) {
                cell.note = {
                    texts: [{ text: col.note }],
                };
            }
        });

        // ========== DATA ROWS ==========
        const maxRows = Math.max(profiles.length, 50); // Tối thiểu 50 dòng

        for (let i = 0; i < maxRows; i++) {
            const profile = profiles[i] || {};

            const rowValues = COLUMNS_CONFIG.map((col) => {
                if (col.key === 'stt') {
                    return i < profiles.length ? i + 1 : '';
                }

                // Handle nested objects
                if (col.key === 'className' && profile.classId) {
                    return profile.classId.name || '';
                }

                return formatValue(profile[col.key], col.format);
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

        // ========== APPLY DATA VALIDATION ==========
        COLUMNS_CONFIG.forEach((col, colIndex) => {
            if (col.key !== 'stt' && col.dropdown && col.dropdown.length > 0) {
                const columnLetter = getColumnLetter(colIndex);

                worksheet.getCell(`${columnLetter}7`).dataValidation = {
                    type: 'list',
                    allowBlank: !col.required,
                    formulae: [`"${col.dropdown.join(',')}"`],
                    showErrorMessage: true,
                    errorTitle: 'Lỗi nhập liệu',
                    error: `Vui lòng chọn: ${col.dropdown.join(', ')}`,
                };

                // Apply cho tất cả rows
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
            profiles.length === 0 ? `Template_HoSoTreEm_${timestamp}.xlsx` : `DanhSach_HoSoTreEm_${timestamp}.xlsx`;

        saveAs(blob, filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
};

/**
 * ✅ Export children profiles to Excel with data
 */
export const exportChildrenProfilesToExcelWithData = async (profiles = [], schoolName = '', academicYearName = '') => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Hồ sơ trẻ em', {
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
        worksheet.getCell('A2').value = schoolName.toUpperCase() || 'TRƯỜNG MẦM NON';
        worksheet.getCell('A2').font = { bold: true, size: 11, underline: true };
        worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('F2:J2');
        worksheet.getCell('F2').value = 'Độc Lập - Tự Do - Hạnh Phúc';
        worksheet.getCell('F2').font = { bold: true, size: 11, underline: true };
        worksheet.getCell('F2').alignment = { horizontal: 'center', vertical: 'middle' };

        // ========== TITLE ==========
        worksheet.mergeCells('B3:H3');
        worksheet.getCell('B3').value = `DANH SÁCH HỒ SƠ TRẺ EM - NĂM HỌC ${academicYearName || ''}`;
        worksheet.getCell('B3').font = { bold: true, size: 16 };
        worksheet.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.addRow([]); // Row 4: trống

        // ========== HEADER COLUMNS (Row 5) ==========
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
        });

        // ========== DATA ROWS ==========
        profiles.forEach((profile, index) => {
            const rowValues = COLUMNS_CONFIG.map((col) => {
                if (col.key === 'stt') {
                    return index + 1;
                }

                if (col.key === 'className' && profile.classId) {
                    return profile.classId.name || '';
                }

                return formatValue(profile[col.key], col.format);
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
                    horizontal: col.key === 'stt' || col.format === 'number' ? 'center' : 'left',
                    vertical: 'middle',
                    wrapText: true,
                };
            });
        });

        // ========== Freeze header ==========
        worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

        // ========== Export file ==========
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const timestamp = dayjs().format('YYYYMMDD_HHmmss');
        const filename = `DanhSach_HoSoTreEm_${timestamp}.xlsx`;

        saveAs(blob, filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
};

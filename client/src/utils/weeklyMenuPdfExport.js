// client/src/utils/weeklyMenuPdfExport.js

import html2pdf from 'html2pdf.js';
import dayjs from 'dayjs';

/**
 * ✅ Export thực đơn tuần ra PDF - Style Hiện đại kết hợp Lịch sự
 */
export const exportWeeklyMenuToPdf = async (weeklyMenuData) => {
    try {
        const {
            schoolName,
            ageGroup,
            weekNumber,
            weekStartDate,
            weekEndDate,
            menuApplies = [],
            holidays = [],
            nutritionalStandard,
        } = weeklyMenuData;

        const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
        const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];

        // --- Helpers ---
        const isHoliday = (date) => {
            const dateStr = dayjs(date).format('YYYY-MM-DD');
            return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
        };

        const getMealContent = (dayOfWeek, session, date) => {
            // 1. Kiểm tra ngày nghỉ
            if (isHoliday(date)) {
                return '<div class="holiday-mark">NGÀY NGHỈ</div>';
            }

            const menuApply = menuApplies.find((m) => m.dayOfWeek === dayOfWeek);
            const meals = menuApply?.menuSnapshot?.meals?.[session] || [];

            // 2. Kiểm tra chưa có thực đơn
            if (meals.length === 0) {
                return '<div class="empty-menu">Chưa có thực đơn</div>';
            }

            // 3. Hiển thị danh sách món ăn
            return `
                <ul class="meal-list">
                    ${meals.map((meal) => `<li>${meal.name}</li>`).join('')}
                </ul>
            `;
        };

        // --- Template HTML ---
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap');
                    
                    :root {
                        --primary-color: #1a3c5e; /* Xanh than lịch sự */
                        --accent-color: #f4f6f8;  /* Nền nhạt */
                        --border-color: #d1d8dc;
                        --text-color: #2d3436;
                        --holiday-color: #c0392b; /* Đỏ đô trầm */
                    }

                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    
                    body {
                        font-family: 'Roboto', sans-serif; /* Dùng Roboto cho bảng dễ đọc */
                        color: var(--text-color);
                        background: #fff;
                        font-size: 10pt;
                        line-height: 1.3;
                    }

                    .container {
                        width: 100%;
                        padding: 10mm;
                    }

                    /* --- Header Section --- */
                    .header-table {
                        width: 100%;
                        margin-bottom: 10px;
                        border-bottom: 2px solid var(--primary-color);
                        padding-bottom: 10px;
                    }
                    
                    .school-info h1 {
                        font-family: 'Times New Roman', serif; /* Font tiêu đề trang trọng */
                        font-size: 14pt;
                        text-transform: uppercase;
                        color: var(--primary-color);
                        font-weight: 700;
                        margin-bottom: 4px;
                    }
                    
                    .school-info p {
                        font-size: 10pt;
                        color: #555;
                    }

                    .menu-title {
                        text-align: right;
                        vertical-align: bottom;
                    }

                    .menu-title h2 {
                        font-family: 'Times New Roman', serif;
                        font-size: 16pt;
                        text-transform: uppercase;
                        color: var(--primary-color);
                        font-weight: 700;
                        margin: 0;
                    }

                    .date-range {
                        font-size: 10pt;
                        color: #555;
                        font-style: italic;
                        margin-top: 5px;
                    }

                    /* --- Main Menu Table --- */
                    .menu-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 10px;
                    }

                    .menu-table th {
                        background-color: var(--primary-color);
                        color: #fff;
                        padding: 8px;
                        font-weight: 500;
                        font-size: 10pt;
                        text-transform: uppercase;
                        border: 1px solid var(--primary-color);
                    }

                    .menu-table td {
                        border: 1px solid var(--border-color);
                        padding: 8px;
                        vertical-align: top;
                    }

                    /* Session Column */
                    .session-col {
                        background-color: var(--accent-color);
                        font-weight: 700;
                        color: var(--primary-color);
                        width: 90px;
                        text-align: center;
                        vertical-align: middle !important;
                        text-transform: uppercase;
                        font-size: 9pt;
                    }

                    .th-date {
                        display: block;
                        font-size: 8pt;
                        font-weight: 400;
                        opacity: 0.9;
                        margin-top: 2px;
                    }

                    /* Content Styling */
                    .meal-list {
                        list-style: none;
                        padding-left: 0;
                    }
                    
                    .meal-list li {
                        position: relative;
                        padding-left: 12px;
                        margin-bottom: 3px;
                        font-size: 9.5pt;
                    }

                    .meal-list li::before {
                        content: "•";
                        color: var(--primary-color);
                        font-weight: bold;
                        position: absolute;
                        left: 0;
                        top: 0px;
                    }

                    .holiday-mark {
                        color: var(--holiday-color);
                        font-weight: bold;
                        text-align: center;
                        background: #fdf2f2;
                        padding: 8px;
                        border-radius: 4px;
                        text-transform: uppercase;
                        font-size: 9pt;
                        margin-top: 5px;
                    }

                    .empty-menu {
                        color: #95a5a6;
                        font-style: italic;
                        font-size: 9pt;
                        text-align: center;
                        padding-top: 5px;
                    }

                    /* --- Footer Section (Formal Style) --- */
                    .footer-container {
                        width: 100%;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-top: 15px;
                        font-family: 'Times New Roman', serif; /* Footer dùng Times New Roman cho lịch sự */
                    }

                    /* Nutrition Notes (Left) */
                    .notes-box {
                        width: 60%;
                        font-size: 11pt;
                        color: #000;
                    }

                    .notes-box ul {
                        list-style: none;
                        padding: 0;
                    }

                    .notes-box li {
                        margin-bottom: 6px;
                        position: relative;
                        padding-left: 15px;
                        line-height: 1.4;
                    }

                    .notes-box li::before {
                        content: "○";
                        position: absolute;
                        left: 0;
                        font-weight: bold;
                    }

                    .note-highlight {
                        font-weight: bold;
                    }

                    /* Signature (Right) */
                    .signature-box {
                        width: 35%;
                        text-align: center;
                    }

                    .sign-title {
                        font-weight: bold;
                        text-transform: uppercase;
                        font-size: 11pt;
                        margin-bottom: 5px;
                    }

                    .sign-note {
                        font-style: italic;
                        font-size: 10pt;
                    }

                </style>
            </head>
            <body>
                <div class="container">
                    
                    <table class="header-table">
                        <tr>
                            <td class="school-info">
                                <h1>${schoolName}</h1>
                                <p>Nhóm trẻ: <strong>${ageGroup}</strong></p>
                            </td>
                            <td class="menu-title">
                                <h2>THỰC ĐƠN TUẦN ${weekNumber}</h2>
                                <div class="date-range">
                                    Từ ngày ${dayjs(weekStartDate).format('DD/MM/YYYY')} 
                                    đến ngày ${dayjs(weekEndDate).format('DD/MM/YYYY')}
                                </div>
                            </td>
                        </tr>
                    </table>

                    <table class="menu-table">
                        <thead>
                            <tr>
                                <th style="width: 90px;">Bữa ăn</th>
                                ${WEEKDAYS.map((day, index) => {
                                    const date = dayjs(weekStartDate).add(index, 'day');
                                    return `
                                        <th>
                                            ${day}
                                            <span class="th-date">${date.format('DD/MM')}</span>
                                        </th>
                                    `;
                                }).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${MEAL_SESSIONS.map(
                                (session) => `
                                <tr>
                                    <td class="session-col">${session}</td>
                                    ${WEEKDAYS.map((day, index) => {
                                        const date = dayjs(weekStartDate).add(index, 'day');
                                        return `<td>${getMealContent(day, session, date)}</td>`;
                                    }).join('')}
                                </tr>
                            `,
                            ).join('')}
                        </tbody>
                    </table>

                    <div class="footer-container">
                        <div class="notes-box">
                            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 5px;">Ghi chú:</div>
                            <ul>
                                <li>
                                    Nhu cầu năng lượng cần có của 1 trẻ trong ngày là 
                                    <span class="note-highlight">${nutritionalStandard?.totalCalories || '...'} Calo</span>.
                                </li>
                                <li>
                                    Tại trường đã cung cấp năng lượng khoảng 
                                    <span class="note-highlight">
                                        ${nutritionalStandard?.recommendedCaloriesMin || '...'} - ${nutritionalStandard?.recommendedCaloriesMax || '...'} Calo
                                    </span>.
                                </li>
                                <li>
                                    Về nhà phụ huynh cho bé ăn thêm (tương đương 1 bữa ăn tối).
                                </li>
                            </ul>
                        </div>

                        <div class="signature-box">
                            <div class="sign-title">HIỆU TRƯỞNG</div>
                            <div class="sign-note">(Ký tên, đóng dấu)</div>
                        </div>
                    </div>

                </div>
            </body>
            </html>
        `;

        // ✅ PDF Options
        const options = {
            margin: [10, 10, 10, 10],
            filename: `Thuc-don-tuan-${weekNumber}-${ageGroup.replace(/\s+/g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale: 3,
                useCORS: true,
                letterRendering: true,
                scrollY: 0,
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'landscape',
            },
            pagebreak: { mode: ['avoid-all'] },
        };

        await html2pdf().set(options).from(htmlContent).save();

        return { success: true };
    } catch (error) {
        console.error('❌ Error exporting weekly menu to PDF:', error);
        throw error;
    }
};

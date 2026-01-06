// client/src/utils/menuPdfExport.js

import html2pdf from 'html2pdf.js';
import dayjs from 'dayjs';

/**
 * ✅ Export thực đơn ra PDF - Phiếu Yêu Cầu Thực Phẩm (Compact Version)
 */
export const exportMenuToPdf = async (menuDetails, schoolName) => {
    try {
        const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];

        // Helper format số liệu
        const formatNumber = (num) => {
            return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
        };

        // ✅ Tạo HTML content
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thực đơn - ${menuDetails.menuName}</title>
                <style>
                    :root {
                        --primary-color: #2c3e50;
                        --border-color: #bdc3c7;
                        --bg-light: #f8f9fa;
                    }
                    
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 13px;
                        line-height: 1.3;
                        color: #2c3e50;
                        background: #fff;
                        padding: 15px; /* Giảm padding body chút để rộng đất diễn hơn */
                    }

                    .container { width: 100%; max-width: 100%; margin: 0 auto; }

                    /* --- HEADER --- */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end; /* Canh đáy cho đẹp */
                        border-bottom: 2px solid var(--primary-color);
                        padding-bottom: 10px;
                        margin-bottom: 15px;
                    }
                    
                    .header-left { width: 45%; }
                    .header-right { width: 55%; text-align: right; }

                    .school-name {
                        font-size: 13px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: var(--primary-color);
                        margin-bottom: 5px;
                    }

                    .document-title {
                        font-size: 20px; /* Giảm size tiêu đề chút cho gọn */
                        font-weight: bold;
                        text-transform: uppercase;
                        color: var(--primary-color);
                    }

                    .menu-name {
                        font-size: 14px;
                        font-weight: bold;
                        color: #555;
                        font-style: italic;
                    }

                    /* --- INFO ROW (Compact) --- */
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        background-color: var(--bg-light);
                        border: 1px solid var(--border-color);
                        padding: 8px 15px;
                        margin-bottom: 15px;
                        border-radius: 4px;
                    }
                    .info-item span { margin-right: 5px; }
                    .info-label { font-weight: normal; color: #777; }
                    .info-value { font-weight: bold; color: #000; }

                    /* --- COMPACT MENU SECTION --- */
                    .menu-section {
                        margin-bottom: 20px;
                        border: 1px solid #e0e0e0;
                        border-radius: 4px;
                        padding: 10px;
                    }

                    .section-header {
                        font-size: 13px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: var(--primary-color);
                        border-bottom: 1px solid #e0e0e0;
                        padding-bottom: 5px;
                        margin-bottom: 8px;
                    }

                    /* Style mới cho menu: Dạng dòng thay vì dạng hộp */
                    .menu-items-inline {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                    }

                    .menu-session-item {
                        flex: 1; /* Chia đều không gian */
                        min-width: 22%; /* Đảm bảo không bị bé quá */
                        font-size: 12px;
                        border-right: 1px dashed #ddd;
                        padding-right: 10px;
                    }
                    
                    .menu-session-item:last-child {
                        border-right: none;
                    }

                    .session-label {
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #2980b9;
                        margin-bottom: 2px;
                        font-size: 11px;
                        display: block;
                    }

                    .dish-list {
                        margin: 0;
                        padding: 0;
                        list-style: none;
                    }
                    
                    .dish-list li {
                        display: inline; /* Hiển thị món ăn nối tiếp nhau cho gọn */
                    }
                    
                    .dish-list li::after {
                        content: ", ";
                    }
                    
                    .dish-list li:last-child::after {
                        content: "";
                    }

                    /* --- TABLE --- */
                    .table-container { 
                        margin-bottom: 10px; 
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 12px;
                        /* Quan trọng để lặp lại header khi qua trang (trình duyệt hỗ trợ) */
                        page-break-inside: auto; 
                    }

                    tr {
                        /* Quan trọng: Tránh cắt đôi dòng chữ, nhưng cho phép cắt giữa các dòng */
                        page-break-inside: avoid; 
                        page-break-after: auto;
                    }

                    th {
                        background-color: var(--primary-color);
                        color: white;
                        font-weight: bold;
                        text-transform: uppercase;
                        padding: 6px 4px;
                        border: 1px solid #1a252f;
                        font-size: 11px;
                        vertical-align: middle;
                        text-align: center;
                    }

                    td {
                        border: 1px solid var(--border-color);
                        padding: 5px 4px;
                        vertical-align: middle;
                    }

                    tbody tr:nth-child(even) { background-color: #f9f9f9; }
                    
                    .row-main-food {
                        background-color: #fff3cd !important;
                        font-weight: bold;
                    }

                    .text-center { text-align: center; }
                    
                    /* --- FOOTER --- */
                    /* Footer cần có class html2pdf__page-break-inside: avoid để không bị cắt đôi chữ ký */
                    .footer-container {
                        margin-top: 20px;
                        page-break-inside: avoid; 
                    }

                    .date-line {
                        text-align: right;
                        font-style: italic;
                        margin-bottom: 10px;
                        padding-right: 20px;
                    }

                    .signature-row {
                        display: flex;
                        justify-content: space-around;
                    }

                    .signature-block { text-align: center; width: 30%; }
                    .signature-title {
                        font-weight: bold;
                        text-transform: uppercase;
                        font-size: 12px;
                        margin-bottom: 50px; /* Khoảng trống ký tên */
                    }
                    .signature-name {
                        border-top: 1px dashed #999;
                        padding-top: 5px;
                        font-style: italic;
                    }

                </style>
            </head>
            <body>
                <div class="container">
                    
                    <div class="header">
                        <div class="header-left">
                            <div class="school-name">${schoolName}</div>
                            <div>Nhóm trẻ: <b>${menuDetails.nutritionalStandardId?.ageGroup || '...'}</b></div>
                        </div>
                        <div class="header-right">
                            <div class="document-title">Phiếu Yêu Cầu Thực Phẩm</div>
                            <div class="menu-name">Tên thực đơn: ${menuDetails.menuName}</div>
                        </div>
                    </div>

                    <div class="info-row">
                        <div class="info-item">
                            <span class="info-label">Số lượng trẻ:</span>
                            <span class="info-value">${menuDetails.numberOfChildren} trẻ</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Ngày tạo:</span>
                            <span class="info-value">${dayjs().format('DD/MM/YYYY')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Tổng loại thực phẩm:</span>
                            <span class="info-value">${menuDetails.aggregatedFoodTable.length}</span>
                        </div>
                    </div>

                    <div class="menu-section">
                        <div class="section-header">Nội dung thực đơn</div>
                        <div class="menu-items-inline">
                            ${MEAL_SESSIONS.map((session) => {
                                const meals = menuDetails.meals[session] || [];
                                return `
                                    <div class="menu-session-item">
                                        <span class="session-label">${session}</span>
                                        ${
                                            meals.length > 0
                                                ? `<ul class="dish-list">${meals.map((m) => `<li>${m.name}</li>`).join('')}</ul>`
                                                : '<span style="color:#999; font-style:italic; font-size:11px;">(Trống)</span>'
                                        }
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="section-header">Danh sách thực phẩm cần mua</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40px;">STT</th>
                                    <th>Tên thực phẩm</th>
                                    <th style="width: 80px;">Định lượng<br/>1 trẻ (g)</th>
                                    <th style="width: 100px;">Lượng mua<br/>(Theo ĐVT)</th>
                                    <th style="width: 60px;">ĐVT</th>
                                    <th style="width: 80px;">Quy đổi<br/>(g)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${menuDetails.aggregatedFoodTable
                                    .map(
                                        (item, index) => `
                                    <tr class="${item.isMainFood ? 'row-main-food' : ''}">
                                        <td class="text-center">${index + 1}</td>
                                        <td style="font-weight: 500;">${item.foodName}</td>
                                        <td class="text-center">${formatNumber(item.quantityPerChildGram.toFixed(2))}</td>
                                        <td class="text-center" style="font-weight: bold; color: #c0392b;">
                                            ${formatNumber(item.purchaseQuantityByUnit)}
                                        </td>
                                        <td class="text-center">${item.unit}</td>
                                        <td class="text-center">${formatNumber(item.gramConversion)}</td>
                                    </tr>
                                `,
                                    )
                                    .join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="footer-container">
                        <div class="date-line">
                            Ngày ${dayjs().format('DD')} tháng ${dayjs().format('MM')} năm ${dayjs().format('YYYY')}
                        </div>
                        <div class="signature-row">
                            <div class="signature-block">
                                <div class="signature-title">Người lập phiếu</div>
                                <div class="signature-name">(Ký, ghi rõ họ tên)</div>
                            </div>
                            <div class="signature-block">
                                <div class="signature-title">Bếp trưởng</div>
                                <div class="signature-name">(Ký, ghi rõ họ tên)</div>
                            </div>
                            <div class="signature-block">
                                <div class="signature-title">Hiệu trưởng</div>
                                <div class="signature-name">(Ký, đóng dấu)</div>
                            </div>
                        </div>
                    </div>

                </div>
            </body>
            </html>
        `;

        // ✅ Options Updated
        const options = {
            margin: [10, 10, 10, 10], // Margin nhỏ
            filename: `Phieu-yeu-cau-${menuDetails.menuName.replace(/[\s/]/g, '-')}-${dayjs().format('YYYYMMDD')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                scrollY: 0,
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
            },
            // ⚠️ QUAN TRỌNG: Xóa 'avoid-all' để cho phép bảng cắt qua trang
            pagebreak: { mode: ['css', 'legacy'] },
        };

        // ✅ Generate PDF
        await html2pdf().set(options).from(htmlContent).save();

        return { success: true };
    } catch (error) {
        console.error('❌ Error exporting menu to PDF:', error);
        throw error;
    }
};

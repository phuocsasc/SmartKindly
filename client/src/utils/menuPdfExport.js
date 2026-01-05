// client/src/utils/menuPdfExport.js

import html2pdf from 'html2pdf.js';
import dayjs from 'dayjs';

/**
 * ✅ Export thực đơn ra PDF với bảng danh sách thực phẩm tùy chỉnh
 */
export const exportMenuToPdf = async (menuDetails, schoolName = 'TRƯỜNG MẦM NON') => {
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
                        --accent-color: #3498db;
                        --border-color: #bdc3c7;
                        --bg-light: #f8f9fa;
                    }
                    
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 13px;
                        line-height: 1.4;
                        color: #2c3e50;
                        background: #fff;
                        padding: 20px;
                    }

                    .container { width: 100%; max-width: 1000px; margin: 0 auto; }

                    /* --- HEADER --- */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid var(--primary-color);
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .header-left { width: 40%; text-align: left; }
                    .header-right { width: 60%; text-align: right; }

                    .school-name {
                        font-size: 14px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: var(--primary-color);
                        margin-bottom: 5px;
                    }

                    .document-title {
                        font-size: 24px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: var(--primary-color);
                        margin-bottom: 5px;
                    }

                    .menu-name {
                        font-size: 16px;
                        font-weight: bold;
                        color: #555;
                    }

                    /* --- INFO GRID --- */
                    .info-grid {
                        display: flex;
                        background-color: var(--bg-light);
                        border: 1px solid var(--border-color);
                        border-radius: 4px;
                        padding: 10px 15px;
                        margin-bottom: 20px;
                        justify-content: space-between;
                    }

                    .info-item { display: flex; flex-direction: column; }
                    .info-label { font-size: 11px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; }
                    .info-value { font-weight: bold; font-size: 14px; }

                    /* --- MEALS GRID --- */
                    .section-title {
                        font-size: 14px;
                        font-weight: bold;
                        text-transform: uppercase;
                        border-left: 4px solid var(--accent-color);
                        padding-left: 10px;
                        margin-bottom: 10px;
                        color: var(--primary-color);
                        background-color: #ecf0f1;
                        padding-top: 5px;
                        padding-bottom: 5px;
                    }

                    .meals-container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 20px;
                    }

                    .meal-box {
                        border: 1px solid #e0e0e0;
                        border-radius: 4px;
                        overflow: hidden;
                    }

                    .meal-header {
                        background-color: var(--primary-color);
                        color: white;
                        padding: 5px 10px;
                        font-weight: bold;
                        font-size: 12px;
                        text-transform: uppercase;
                        text-align: center;
                    }

                    .meal-content {
                        padding: 8px 10px;
                        font-size: 12px;
                        min-height: 40px;
                    }

                    .meal-list { list-style: none; }
                    .meal-list li {
                        margin-bottom: 3px;
                        padding-bottom: 3px;
                        border-bottom: 1px dashed #eee;
                    }
                    .meal-list li:last-child { border-bottom: none; }

                    /* --- TABLE --- */
                    .table-container { margin-bottom: 20px; }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 12px;
                    }

                    th {
                        background-color: var(--primary-color);
                        color: white;
                        font-weight: bold;
                        text-transform: uppercase;
                        padding: 8px 5px;
                        border: 1px solid #1a252f;
                        font-size: 11px;
                        vertical-align: middle;
                    }

                    td {
                        border: 1px solid var(--border-color);
                        padding: 6px 5px;
                        vertical-align: middle;
                    }

                    tbody tr:nth-child(even) { background-color: #f2f2f2; }
                    
                    .row-main-food {
                        background-color: #fff3cd !important;
                        font-weight: 600;
                    }

                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-left { text-align: left; }
                    
                    /* Căn chỉnh độ rộng cột */
                    .col-stt { width: 40px; }
                    .col-unit { width: 70px; }
                    .col-conversion { width: 80px; }
                    .col-qty-child { width: 100px; }
                    .col-qty-buy { width: 120px; }

                    /* --- FOOTER --- */
                    .footer {
                        margin-top: 30px;
                        display: flex;
                        justify-content: space-around;
                        page-break-inside: avoid;
                    }

                    .signature-block { text-align: center; width: 30%; }
                    .signature-title {
                        font-weight: bold;
                        text-transform: uppercase;
                        margin-bottom: 60px;
                        font-size: 12px;
                    }
                    .signature-name {
                        border-top: 1px dashed #999;
                        padding-top: 5px;
                        font-style: italic;
                        color: #555;
                    }
                    .date-line {
                        text-align: right;
                        font-style: italic;
                        margin-bottom: 15px;
                        font-size: 12px;
                        padding-right: 20px;
                    }

                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-left">
                            <div class="school-name">${schoolName}</div>
                            <div>Phòng GD&ĐT ....................</div>
                        </div>
                        <div class="header-right">
                            <div class="document-title">Phiếu Yêu Cầu Thực Phẩm</div>
                            <div class="menu-name">Thực đơn: ${menuDetails.menuName}</div>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Nhóm trẻ áp dụng</span>
                            <span class="info-value">${menuDetails.nutritionalStandardId?.ageGroup || 'Chưa xác định'}</span>
                        </div>
                        <div class="info-item" style="text-align: center;">
                            <span class="info-label">Số lượng trẻ áp dụng</span>
                            <span class="info-value">${menuDetails.numberOfChildren} trẻ</span>
                        </div>
                        <div class="info-item" style="text-align: right;">
                            <span class="info-label">Ngày tạo</span>
                            <span class="info-value">${dayjs().format('DD/MM/YYYY')}</span>
                        </div>
                    </div>

                    <div class="section-title">Nội dung thực đơn</div>
                    <div class="meals-container">
                        ${MEAL_SESSIONS.map((session) => {
                            const meals = menuDetails.meals[session] || [];
                            return `
                                <div class="meal-box">
                                    <div class="meal-header">${session}</div>
                                    <div class="meal-content">
                                        ${
                                            meals.length > 0
                                                ? `<ul class="meal-list">
                                                ${meals.map((m, i) => `<li>${i + 1}. ${m.name}</li>`).join('')}
                                               </ul>`
                                                : '<span style="color:#999; font-style:italic;">(Không có món ăn)</span>'
                                        }
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="section-title">Danh sách thực phẩm cần mua</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th class="col-stt">STT</th>
                                    <th>Tên thực phẩm</th>
                                    <th class="col-qty-child">Lượng ăn<br/>1 trẻ (g)</th>
                                    <th class="col-qty-buy">Lượng mua<br/>${menuDetails.numberOfChildren} trẻ<br/>(Theo ĐVT)</th>
                                    <th class="col-unit">ĐVT</th>
                                    <th class="col-conversion">Quy đổi<br/>(g)</th>
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
                                        <td class="text-center" style="font-weight: bold; color: #c0392b; font-size: 13px;">
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

                    <div class="date-line">
                        Ngày ...... tháng ...... năm 20......
                    </div>
                    <div class="footer">
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
            </body>
            </html>
        `;

        // ✅ Options
        const options = {
            margin: [10, 10, 10, 10],
            filename: `Thuc-don-${menuDetails.menuName.replace(/[\s/]/g, '-')}-${dayjs().format('YYYYMMDD')}.pdf`,
            image: { type: 'jpeg', quality: 1 },
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
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };

        // ✅ Generate PDF
        await html2pdf().set(options).from(htmlContent).save();

        return { success: true };
    } catch (error) {
        console.error('❌ Error exporting menu to PDF:', error);
        throw error;
    }
};

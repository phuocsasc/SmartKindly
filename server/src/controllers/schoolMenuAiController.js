// server/src/controllers/schoolMenuAiController.js

import { StatusCodes } from 'http-status-codes';
import { SchoolFoodModel } from '~/models/schoolFoodModel';
import { SchoolMenuModel } from '~/models/schoolMenuModel';
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import OpenAI from 'openai';
import { env } from '~/config/environment';

// Khởi tạo OpenAI
const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

const ENERGY_FACTORS = { PROTEIN: 4, LIPID: 9, GLUCID: 4 };

/**
 * =========================================================
 * 1. HÀM TÍNH TOÁN DINH DƯỠNG (UPDATED: ĐỒNG BỘ CLIENT)
 * =========================================================
 * Client logic:
 * 1. PurchaseQty (1 decimal) -> TotalQty -> GramsPerChild
 * 2. Round GramsPerChild to 2 decimals.
 * 3. Calculate Nutrients based on rounded GramsPerChild.
 */
const calculateNutrition = (item, foodDbInfo, numberOfChildren) => {
    // 1. Lấy lượng mua (đã làm tròn hoặc chưa, tuỳ input)
    const purchaseQty = Number(item.purchaseQuantityByUnit) || 0;

    let purchaseKg = 0;
    const unit = (item.unit || '').trim().toLowerCase();

    if (unit === 'kg') {
        purchaseKg = purchaseQty;
    } else if (unit === 'g' || unit === 'gam') {
        purchaseKg = purchaseQty / 1000;
    } else {
        const conversion = Number(item.gramConversion) || 0;
        if (conversion > 0) {
            purchaseKg = (purchaseQty * conversion) / 1000;
        } else {
            purchaseKg = purchaseQty;
        }
    }

    // 2. Tính ra Edible KG
    const waste = Number(item.wastePercentage) || 0;
    const edibleKg = purchaseKg / (1 + waste / 100);

    // 3. Tính Gram/Trẻ (Raw)
    let gramsPerChild = numberOfChildren > 0 ? (edibleKg * 1000) / numberOfChildren : 0;

    // 🔥 FIX: Làm tròn 2 chữ số thập phân NHƯ CLIENT & MENU DIALOG
    gramsPerChild = parseFloat(gramsPerChild.toFixed(2));

    // 4. Tính dinh dưỡng
    const dbP = Number(foodDbInfo?.protein) || 0;
    const dbL = Number(foodDbInfo?.lipid) || 0;
    const dbG = Number(foodDbInfo?.glucid) || 0;

    const proteinRaw = gramsPerChild * dbP;
    const lipidRaw = gramsPerChild * dbL;
    const glucidRaw = gramsPerChild * dbG;
    // Lưu ý: Calo ở đây chỉ là tham khảo từng món, tổng calo sẽ tính lại ở ngoài
    const calories = proteinRaw * 4 + lipidRaw * 9 + glucidRaw * 4;

    return { protein: proteinRaw, lipid: lipidRaw, glucid: glucidRaw, calories };
};

/**
 * =========================================================
 * 2. PHÂN LOẠI THỰC PHẨM (GIỮ NGUYÊN)
 * =========================================================
 */
const classifyFoodItem = (foodDbInfo) => {
    if (!foodDbInfo) return 'NEUTRAL';
    const p = Number(foodDbInfo.protein) || 0;
    const l = Number(foodDbInfo.lipid) || 0;
    const g = Number(foodDbInfo.glucid) || 0;

    const pCal = p * 4;
    const lCal = l * 9;
    const gCal = g * 4;
    const total = pCal + lCal + gCal;

    if (total === 0) return 'NEUTRAL';
    const pPct = (pCal / total) * 100;
    const lPct = (lCal / total) * 100;
    const gPct = (gCal / total) * 100;

    if (lPct > 45) return 'LIPID_SOURCE';
    if (gPct > 55) return 'GLUCID_SOURCE';
    if (pPct > 20) return 'PROTEIN_SOURCE';
    // Logic ưu tiên
    if (pPct >= lPct && pPct >= gPct) return 'PROTEIN_SOURCE';
    if (lPct >= pPct && lPct >= gPct) return 'LIPID_SOURCE';
    return 'GLUCID_SOURCE';
};

/**
 * =========================================================
 * 3. AI CULINARY SUGGESTIONS (GIỮ NGUYÊN)
 * =========================================================
 */
const getAiCulinarySuggestions = async (foodList, numberOfChildren, ageGroup) => {
    try {
        // ... (Giữ nguyên code cũ để tiết kiệm không gian hiển thị)
        // Code này chỉ dùng để lấy variation ban đầu, không ảnh hưởng logic tính toán
        console.log('🤖 [AI] Đang xin ý kiến "Đầu bếp AI" (gpt-4o-mini)...');
        const prompt = `
        Bạn là một đầu bếp trường mầm non. Đề xuất số lượng mua (kg) cho ${numberOfChildren} trẻ (${ageGroup || 'Mầm non'}).
        Danh sách: ${JSON.stringify(foodList.map((f) => ({ name: f.foodName, currentQty: f.purchaseQuantityByUnit })))}
        Trả về JSON: [{ "foodName": "tên", "suggestedQty": số_lượng }]
        `;
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Trả về JSON.' },
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
        });
        const aiResult = JSON.parse(completion.choices[0].message.content);
        return aiResult.items || aiResult.suggestions || [];
    } catch (error) {
        return [];
    }
};

/**
 * =========================================================
 * Helper: Tính toán thống kê toàn bảng (Total Stats)
 * =========================================================
 */
const calculateTotalStats = (table, foodMap, numberOfChildren) => {
    let totals = { p: 0, l: 0, g: 0 };

    table.forEach((item) => {
        const dbInfo = foodMap.get(item.foodId);
        const nut = calculateNutrition(item, dbInfo, numberOfChildren);
        totals.p += nut.protein;
        totals.l += nut.lipid;
        totals.g += nut.glucid;
    });

    // Làm tròn tổng số g (2 số thập phân) như Client
    const totalProtein = parseFloat(totals.p.toFixed(2));
    const totalLipid = parseFloat(totals.l.toFixed(2));
    const totalGlucid = parseFloat(totals.g.toFixed(2));

    const totalCal = parseFloat(
        (
            totalProtein * ENERGY_FACTORS.PROTEIN +
            totalLipid * ENERGY_FACTORS.LIPID +
            totalGlucid * ENERGY_FACTORS.GLUCID
        ).toFixed(2),
    );

    const pct = {
        p: totalCal ? parseFloat(((totalProtein * 4 * 100) / totalCal).toFixed(2)) : 0,
        l: totalCal ? parseFloat(((totalLipid * 9 * 100) / totalCal).toFixed(2)) : 0,
        g: totalCal ? parseFloat(((totalGlucid * 4 * 100) / totalCal).toFixed(2)) : 0,
    };

    return { totalCal, pct, totalProtein, totalLipid, totalGlucid };
};

/**
 * =========================================================
 * 4. THUẬT TOÁN CÂN BẰNG (UPDATED: LOGIC 2 BƯỚC)
 * =========================================================
 */
const rigorousBalancing = (currentTable, foodMap, numberOfChildren, standards) => {
    console.log('\n🚀 [ALGO] CHẠY THUẬT TOÁN CÂN BẰNG...');

    // --- GIAI ĐOẠN 1: OPTIMIZATION TRÊN SỐ THỰC (Làm nhanh để tìm vùng khả thi) ---
    // Sử dụng logic cũ nhưng tính nutrition kiểu mới (đã fix rounding)
    let processedTable = JSON.parse(JSON.stringify(currentTable));
    const MAX_ITERATIONS = 200;

    // Tạm thời dùng tolerance lỏng để hội tụ nhanh
    const pTarget = (standards.proteinMin + standards.proteinMax) / 2;
    const lTarget = (standards.lipidMin + standards.lipidMax) / 2;
    const gTarget = (standards.glucidMin + standards.glucidMax) / 2;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const stats = calculateTotalStats(processedTable, foodMap, numberOfChildren);

        // Điều kiện dừng tương đối
        const isOk =
            stats.pct.p >= standards.proteinMin &&
            stats.pct.p <= standards.proteinMax &&
            stats.pct.l >= standards.lipidMin &&
            stats.pct.l <= standards.lipidMax &&
            stats.pct.g >= standards.glucidMin &&
            stats.pct.g <= standards.glucidMax &&
            Math.abs(stats.totalCal - standards.targetCalMid) < 5;

        if (isOk && i > 10) break; // Chạy ít nhất 10 vòng để ổn định

        // Điều chỉnh (như cũ)
        const adjustments = new Map();
        const calcAdj = (group, cur, target) => {
            if (cur === 0) return;
            const ratio = target / cur;
            const factor = 1 + (ratio - 1) * 0.5; // Learning rate 0.5
            processedTable.forEach((item, idx) => {
                const dbInfo = foodMap.get(item.foodId);
                if (classifyFoodItem(dbInfo) === group) {
                    const prev = adjustments.get(idx) || 1;
                    adjustments.set(idx, prev * factor);
                }
            });
        };

        if (stats.pct.p < pTarget || stats.pct.p > pTarget) calcAdj('PROTEIN_SOURCE', stats.pct.p, pTarget);
        if (stats.pct.l < lTarget || stats.pct.l > lTarget) calcAdj('LIPID_SOURCE', stats.pct.l, lTarget);
        if (stats.pct.g < gTarget || stats.pct.g > gTarget) calcAdj('GLUCID_SOURCE', stats.pct.g, gTarget);

        processedTable = processedTable.map((item, idx) => {
            const f = adjustments.get(idx) || 1;
            let qty = item.purchaseQuantityByUnit * f;
            if (qty < 0.1) qty = 0.1;
            return { ...item, purchaseQuantityByUnit: qty };
        });

        // Normalize Calo
        const currentStats = calculateTotalStats(processedTable, foodMap, numberOfChildren);
        if (currentStats.totalCal > 0) {
            const norm = standards.targetCalMid / currentStats.totalCal;
            processedTable = processedTable.map((item) => ({
                ...item,
                purchaseQuantityByUnit: item.purchaseQuantityByUnit * norm,
            }));
        }
    }

    // --- GIAI ĐOẠN 2: DISCRETE CORRECTION (HIỆU CHỈNH SỐ ĐÃ LÀM TRÒN) ---
    // Đây là bước quan trọng nhất để fix lỗi "sai số 0.01"
    console.log('🔨 [ALGO] Giai đoạn 2: Hiệu chỉnh trên số đã làm tròn (1 thập phân)...');

    // 1. Làm tròn toàn bộ về 1 chữ số thập phân (như UI sẽ hiển thị)
    processedTable = processedTable.map((item) => ({
        ...item,
        purchaseQuantityByUnit: Number(item.purchaseQuantityByUnit.toFixed(1)) || 0.1,
    }));

    const FIX_LOOPS = 50; // Số vòng lặp sửa lỗi
    let finalTable = [...processedTable];
    let bestStats = calculateTotalStats(finalTable, foodMap, numberOfChildren);

    for (let k = 0; k < FIX_LOOPS; k++) {
        const { pct, totalCal } = bestStats;

        // Check strict bounds (Tuyệt đối không có tolerance)
        const pLow = pct.p < standards.proteinMin;
        const pHigh = pct.p > standards.proteinMax;
        const lLow = pct.l < standards.lipidMin;
        const lHigh = pct.l > standards.lipidMax;
        const gLow = pct.g < standards.glucidMin;
        const gHigh = pct.g > standards.glucidMax;

        const isPerfect = !pLow && !pHigh && !lLow && !lHigh && !gLow && !gHigh;

        if (isPerfect) {
            console.log(`✅ [SUCCESS] Kết quả chuẩn 100% tại vòng fix ${k}: P=${pct.p} | L=${pct.l} | G=${pct.g}`);
            return { success: true, table: finalTable };
        }

        // Logic sửa lỗi: "Nudge" (nhích) số lượng của món ảnh hưởng nhất lên/xuống 0.1
        // Tìm món cần sửa
        let targetGroup = '';
        let direction = 0; // 1: tăng, -1: giảm

        if (pLow) {
            targetGroup = 'PROTEIN_SOURCE';
            direction = 1;
        } else if (pHigh) {
            targetGroup = 'PROTEIN_SOURCE';
            direction = -1;
        } else if (lLow) {
            targetGroup = 'LIPID_SOURCE';
            direction = 1;
        } else if (lHigh) {
            targetGroup = 'LIPID_SOURCE';
            direction = -1;
        } else if (gLow) {
            targetGroup = 'GLUCID_SOURCE';
            direction = 1;
        } else if (gHigh) {
            targetGroup = 'GLUCID_SOURCE';
            direction = -1;
        }

        // Nếu không vi phạm nhóm chính nhưng Calo sai lệch nhiều, chỉnh Glucid (nhóm rẻ nhất/dễ nhất)
        if (!targetGroup && Math.abs(totalCal - standards.targetCalMid) > 10) {
            targetGroup = 'GLUCID_SOURCE';
            direction = totalCal < standards.targetCalMid ? 1 : -1;
        }

        // Tìm món ăn tốt nhất trong nhóm đó để sửa (ưu tiên món có lượng lớn để ít ảnh hưởng tỉ lệ thải bỏ nhỏ)
        const candidateIndices = [];
        finalTable.forEach((item, idx) => {
            const dbInfo = foodMap.get(item.foodId);
            if (classifyFoodItem(dbInfo) === targetGroup && item.purchaseQuantityByUnit > 0.2) {
                candidateIndices.push(idx);
            }
        });

        // Nếu không tìm thấy candidate đúng nhóm, lấy random món bất kỳ có lượng > 0.5
        if (candidateIndices.length === 0) {
            finalTable.forEach((item, idx) => {
                if (item.purchaseQuantityByUnit > 0.5) candidateIndices.push(idx);
            });
        }

        if (candidateIndices.length > 0) {
            // Chọn ngẫu nhiên 1 món trong list candidates để tránh lặp vòng
            const idxToFix = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];

            // Nhích 0.1
            const newItem = { ...finalTable[idxToFix] };
            newItem.purchaseQuantityByUnit = parseFloat((newItem.purchaseQuantityByUnit + direction * 0.1).toFixed(1));

            if (newItem.purchaseQuantityByUnit < 0.1) newItem.purchaseQuantityByUnit = 0.1;

            // Update table
            finalTable[idxToFix] = newItem;

            // Recalculate stats
            bestStats = calculateTotalStats(finalTable, foodMap, numberOfChildren);
        } else {
            // Dead end
            break;
        }
    }

    console.log(
        `⚠️ [WARNING] Không đạt tuyệt đối sau fix. P=${bestStats.pct.p} | L=${bestStats.pct.l} | G=${bestStats.pct.g}`,
    );
    return { success: false, table: finalTable };
};

/**
 * =========================================================
 * MAIN CONTROLLER
 * =========================================================
 */
const balanceMenuWithAi = async (req, res, next) => {
    try {
        console.log('\n🧠 [CONTROLLER] START balanceMenuWithAi...');
        const { aggregatedFoodTable, nutritionalStandard, numberOfChildren, menuId } = req.body;
        const userId = req.jwtDecoded.id;

        if (!numberOfChildren || numberOfChildren <= 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Số lượng trẻ phải lớn hơn 0');
        }

        const user = await UserModel.findById(userId).select('schoolId');
        if (!user?.schoolId) throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');

        let menuInfo = null;
        if (menuId) {
            menuInfo = await SchoolMenuModel.findOne({ _id: menuId, schoolId: user.schoolId }).select(
                'menuName ageGroup',
            );
        }

        // Load DB
        const foodIds = aggregatedFoodTable.map((f) => f.foodId);
        const foodsInDb = await SchoolFoodModel.find({ _id: { $in: foodIds } }).lean();
        const foodMap = new Map();
        foodsInDb.forEach((f) => foodMap.set(f._id.toString(), f));

        // Setup Targets (STRICT)
        const { proteinMin, proteinMax, lipidMin, lipidMax, glucidMin, glucidMax } = nutritionalStandard.plgStructure;
        const targetCalMid =
            (nutritionalStandard.recommendedCaloriesMin + nutritionalStandard.recommendedCaloriesMax) / 2;

        const standards = {
            proteinMin,
            proteinMax,
            lipidMin,
            lipidMax,
            glucidMin,
            glucidMax,
            targetCalMid,
        };
        console.log(
            `🎯 [TARGETS] Calo: ${targetCalMid} | P: ${proteinMin}-${proteinMax} | L: ${lipidMin}-${lipidMax} | G: ${glucidMin}-${glucidMax}`,
        );

        // STEP 1: AI Variation
        let inputTableForAlgo = [...aggregatedFoodTable];
        try {
            const aiSuggestions = await getAiCulinarySuggestions(
                aggregatedFoodTable,
                numberOfChildren,
                menuInfo?.ageGroup,
            );
            if (aiSuggestions && Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
                inputTableForAlgo = inputTableForAlgo.map((item) => {
                    const suggestion = aiSuggestions.find(
                        (s) =>
                            s.foodName &&
                            item.foodName &&
                            s.foodName.toLowerCase().trim() === item.foodName.toLowerCase().trim(),
                    );
                    if (suggestion && suggestion.suggestedQty > 0) {
                        return { ...item, purchaseQuantityByUnit: Number(suggestion.suggestedQty) };
                    }
                    return item;
                });
            }
        } catch (aiErr) {
            console.warn('⚠️ [AI] Skip AI variation');
        }

        // STEP 2: Rigorous Balancing (With Discrete Correction)
        const result = rigorousBalancing(inputTableForAlgo, foodMap, numberOfChildren, standards);

        // Final Verify (Mô phỏng lại việc tính toán lần cuối cùng)
        const finalStats = calculateTotalStats(result.table, foodMap, numberOfChildren);

        console.log('🏁 [FINAL OUTPUT SENT TO CLIENT]');
        console.log(`   Calo: ${finalStats.totalCal}`);
        console.log(`   P: ${finalStats.pct.p}% | L: ${finalStats.pct.l}% | G: ${finalStats.pct.g}%`);

        // Format return (Đảm bảo số liệu gửi đi là số đã làm tròn 100%)
        const formattedTable = result.table.map((item) => ({
            ...item,
            purchaseQuantityByUnit: Number(item.purchaseQuantityByUnit.toFixed(1)), // Đã làm tròn trong algo, nhưng make sure
        }));

        res.status(StatusCodes.OK).json({
            message: 'Cân đối thực đơn thành công',
            data: formattedTable,
            menuInfo,
            analysis: {
                calories: finalStats.totalCal,
                plg: {
                    protein: finalStats.pct.p,
                    lipid: finalStats.pct.l,
                    glucid: finalStats.pct.g,
                },
            },
        });
    } catch (error) {
        console.error('❌ [ERROR]', error);
        next(error);
    }
};

export const schoolMenuAiController = { balanceMenuWithAi };

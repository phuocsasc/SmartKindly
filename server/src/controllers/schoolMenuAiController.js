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
 * 🔥 CHUẨN HÓA LOGIC TÍNH TOÁN (ĐỒNG BỘ VỚI CLIENT)
 * =========================================================
 * QUY TẮC LÀM TRÒN:
 * 1. purchaseQuantityByUnit: 1 số thập phân (0.1)
 * 2. purchaseQuantityKg: KHÔNG làm tròn (giữ nguyên số thực)
 * 3. totalQuantityKg (edibleKg): KHÔNG làm tròn (giữ nguyên số thực)
 * 4. quantityPerChildGram: 2 số thập phân (0.01)
 * 5. Nutrients (protein/lipid/glucid): KHÔNG làm tròn trung gian
 * 6. totalCalories: 2 số thập phân (0.01)
 * 7. Percentages: 2 số thập phân (0.01%)
 */

/**
 * ✅ HÀM TÍNH TOÁN DINH DƯỠNG (CHUẨN HÓA)
 */
const calculateNutrition = (item, foodDbInfo, numberOfChildren) => {
    // 1. Parse input
    const purchaseQty = Number(item.purchaseQuantityByUnit) || 0;
    const unit = (item.unit || '').trim().toLowerCase();
    const gramConversion = Number(item.gramConversion) || 0;
    const wastePercentage = Number(item.wastePercentage) || 0;

    // 2. Tính purchaseKg (KHÔNG làm tròn)
    let purchaseKg = 0;
    if (unit === 'kg') {
        purchaseKg = purchaseQty;
    } else if (unit === 'g' || unit === 'gam') {
        purchaseKg = purchaseQty / 1000;
    } else if (gramConversion > 0) {
        purchaseKg = (purchaseQty * gramConversion) / 1000;
    } else {
        purchaseKg = purchaseQty;
    }

    // 3. Tính edibleKg (totalQuantityKg) (KHÔNG làm tròn)
    const edibleKg = purchaseKg / (1 + wastePercentage / 100);

    // 4. Tính gramsPerChild (KHÔNG làm tròn trung gian)
    const gramsPerChildRaw = numberOfChildren > 0 ? (edibleKg * 1000) / numberOfChildren : 0;

    // 🔥 CHỈ làm tròn 2 số thập phân Ở ĐÂY (sau khi chia)
    const gramsPerChild = parseFloat(gramsPerChildRaw.toFixed(2));

    // 5. Tính nutrients (KHÔNG làm tròn)
    const dbP = Number(foodDbInfo?.protein) || 0;
    const dbL = Number(foodDbInfo?.lipid) || 0;
    const dbG = Number(foodDbInfo?.glucid) || 0;

    const proteinRaw = gramsPerChild * dbP;
    const lipidRaw = gramsPerChild * dbL;
    const glucidRaw = gramsPerChild * dbG;

    // 6. Calories (KHÔNG làm tròn ở đây - để bên ngoài tổng hợp)
    const calories = proteinRaw * 4 + lipidRaw * 9 + glucidRaw * 4;

    return {
        protein: proteinRaw, // RAW number
        lipid: lipidRaw, // RAW number
        glucid: glucidRaw, // RAW number
        calories, // RAW number
        gramsPerChild, // ✅ Đã làm tròn 2 số thập phân
    };
};

/**
 * ✅ HÀM TÍNH TỔNG DINH DƯỠNG (CHUẨN HÓA)
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

    // 🔥 CHỈ làm tròn 2 số thập phân SAU KHI TỔNG HỢP
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

    // 🔥 Tính % PLG (làm tròn 2 số thập phân)
    const pct = {
        p: totalCal > 0 ? parseFloat(((totalProtein * 4 * 100) / totalCal).toFixed(2)) : 0,
        l: totalCal > 0 ? parseFloat(((totalLipid * 9 * 100) / totalCal).toFixed(2)) : 0,
        g: totalCal > 0 ? parseFloat(((totalGlucid * 4 * 100) / totalCal).toFixed(2)) : 0,
    };

    return { totalCal, pct, totalProtein, totalLipid, totalGlucid };
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
 * ✅ AI CULINARY SUGGESTIONS (GIỮ NGUYÊN)
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
 * ✅ THUẬT TOÁN CÂN BẰNG (2 GIAI ĐOẠN)
 * =========================================================
 */
const rigorousBalancing = (currentTable, foodMap, numberOfChildren, standards) => {
    console.log('\n🚀 [ALGO] Starting 2-phase balancing...');

    // --- PHASE 1: CONTINUOUS OPTIMIZATION ---
    let processedTable = JSON.parse(JSON.stringify(currentTable));
    const MAX_ITERATIONS = 200;

    const pTarget = (standards.proteinMin + standards.proteinMax) / 2;
    const lTarget = (standards.lipidMin + standards.lipidMax) / 2;
    const gTarget = (standards.glucidMin + standards.glucidMax) / 2;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const stats = calculateTotalStats(processedTable, foodMap, numberOfChildren);

        const isOk =
            stats.pct.p >= standards.proteinMin &&
            stats.pct.p <= standards.proteinMax &&
            stats.pct.l >= standards.lipidMin &&
            stats.pct.l <= standards.lipidMax &&
            stats.pct.g >= standards.glucidMin &&
            stats.pct.g <= standards.glucidMax &&
            Math.abs(stats.totalCal - standards.targetCalMid) < 5;

        if (isOk && i > 10) break;

        const adjustments = new Map();
        const calcAdj = (group, cur, target) => {
            if (cur === 0) return;
            const ratio = target / cur;
            const factor = 1 + (ratio - 1) * 0.5;
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

        const currentStats = calculateTotalStats(processedTable, foodMap, numberOfChildren);
        if (currentStats.totalCal > 0) {
            const norm = standards.targetCalMid / currentStats.totalCal;
            processedTable = processedTable.map((item) => ({
                ...item,
                purchaseQuantityByUnit: item.purchaseQuantityByUnit * norm,
            }));
        }
    }

    // --- PHASE 2: DISCRETE CORRECTION ---
    console.log('🔨 [ALGO] Phase 2: Discrete correction...');

    // 🔥 Làm tròn TẤT CẢ về 1 số thập phân
    processedTable = processedTable.map((item) => ({
        ...item,
        purchaseQuantityByUnit: parseFloat(item.purchaseQuantityByUnit.toFixed(1)) || 0.1,
    }));

    const FIX_LOOPS = 50;
    let finalTable = [...processedTable];
    let bestStats = calculateTotalStats(finalTable, foodMap, numberOfChildren);

    for (let k = 0; k < FIX_LOOPS; k++) {
        const { pct, totalCal } = bestStats;

        const pLow = pct.p < standards.proteinMin;
        const pHigh = pct.p > standards.proteinMax;
        const lLow = pct.l < standards.lipidMin;
        const lHigh = pct.l > standards.lipidMax;
        const gLow = pct.g < standards.glucidMin;
        const gHigh = pct.g > standards.glucidMax;

        const isPerfect = !pLow && !pHigh && !lLow && !lHigh && !gLow && !gHigh;

        if (isPerfect) {
            console.log(`✅ [SUCCESS] Perfect at iteration ${k}`);
            return { success: true, table: finalTable };
        }

        let targetGroup = '';
        let direction = 0;

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

        if (!targetGroup && Math.abs(totalCal - standards.targetCalMid) > 10) {
            targetGroup = 'GLUCID_SOURCE';
            direction = totalCal < standards.targetCalMid ? 1 : -1;
        }

        const candidateIndices = [];
        finalTable.forEach((item, idx) => {
            const dbInfo = foodMap.get(item.foodId);
            if (classifyFoodItem(dbInfo) === targetGroup && item.purchaseQuantityByUnit > 0.2) {
                candidateIndices.push(idx);
            }
        });

        if (candidateIndices.length === 0) {
            finalTable.forEach((item, idx) => {
                if (item.purchaseQuantityByUnit > 0.5) candidateIndices.push(idx);
            });
        }

        if (candidateIndices.length > 0) {
            const idxToFix = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
            const newItem = { ...finalTable[idxToFix] };
            newItem.purchaseQuantityByUnit = parseFloat((newItem.purchaseQuantityByUnit + direction * 0.1).toFixed(1));
            if (newItem.purchaseQuantityByUnit < 0.1) newItem.purchaseQuantityByUnit = 0.1;
            finalTable[idxToFix] = newItem;
            bestStats = calculateTotalStats(finalTable, foodMap, numberOfChildren);
        } else {
            break;
        }
    }

    console.log(`⚠️ [WARNING] Not perfect after ${FIX_LOOPS} iterations`);
    return { success: false, table: finalTable };
};

/**
 * =========================================================
 * ✅ MAIN CONTROLLER
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

        const foodIds = aggregatedFoodTable.map((f) => f.foodId);
        const foodsInDb = await SchoolFoodModel.find({ _id: { $in: foodIds } }).lean();
        const foodMap = new Map(foodsInDb.map((f) => [f._id.toString(), f]));

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

        let inputTableForAlgo = [...aggregatedFoodTable];
        try {
            const aiSuggestions = await getAiCulinarySuggestions(
                aggregatedFoodTable,
                numberOfChildren,
                menuInfo?.ageGroup,
            );
            if (aiSuggestions?.length > 0) {
                inputTableForAlgo = inputTableForAlgo.map((item) => {
                    const suggestion = aiSuggestions.find(
                        (s) => s.foodName?.toLowerCase().trim() === item.foodName?.toLowerCase().trim(),
                    );
                    return suggestion?.suggestedQty > 0
                        ? { ...item, purchaseQuantityByUnit: Number(suggestion.suggestedQty) }
                        : item;
                });
            }
        } catch (aiErr) {
            console.warn('⚠️ [AI] Skip AI variation');
        }

        const result = rigorousBalancing(inputTableForAlgo, foodMap, numberOfChildren, standards);
        const finalStats = calculateTotalStats(result.table, foodMap, numberOfChildren);

        console.log('🏁 [FINAL OUTPUT]');
        console.log(`   Calo: ${finalStats.totalCal}`);
        console.log(`   P: ${finalStats.pct.p}% | L: ${finalStats.pct.l}% | G: ${finalStats.pct.g}%`);

        // 🔥 Format output (làm tròn purchaseQuantityByUnit về 1 số thập phân)
        const formattedTable = result.table.map((item) => ({
            ...item,
            purchaseQuantityByUnit: parseFloat(item.purchaseQuantityByUnit.toFixed(1)),
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

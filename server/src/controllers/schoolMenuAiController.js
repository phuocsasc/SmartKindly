import { StatusCodes } from 'http-status-codes';
import { SchoolFoodModel } from '~/models/schoolFoodModel';
import OpenAI from 'openai';
import { env } from '~/config/environment';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

// Hàm tính toán đóng góp dinh dưỡng từ DB
const calculateNutrition = (item, foodDbInfo, numberOfChildren) => {
    const purchaseQty = parseFloat(item.purchaseQuantityByUnit) || 0;

    // Quy đổi ra kg
    let purchaseKg = item.unit.toLowerCase() === 'kg' ? purchaseQty : (purchaseQty * item.gramConversion) / 1000;

    // Lượng ăn được (Edible)
    const edibleKg = purchaseKg / (1 + item.wastePercentage / 100);

    // Gram/trẻ
    const gramsPerChild = (edibleKg * 1000) / numberOfChildren;

    // Lấy thông tin dinh dưỡng gốc (trên 1g)
    const pPerGram = foodDbInfo?.protein || 0;
    const lPerGram = foodDbInfo?.lipid || 0;
    const gPerGram = foodDbInfo?.glucid || 0;

    // Tính tổng
    const p = gramsPerChild * pPerGram;
    const l = gramsPerChild * lPerGram;
    const g = gramsPerChild * gPerGram;
    const cal = p * 4 + l * 9 + g * 4;

    return {
        gramsPerChild,
        protein: p,
        lipid: l,
        glucid: g,
        calories: cal,
        meta: { pPerGram, lPerGram, gPerGram },
    };
};

const balanceMenuWithAi = async (req, res, next) => {
    try {
        const { aggregatedFoodTable, nutritionalStandard, numberOfChildren } = req.body;

        // 1. Lấy dữ liệu gốc từ DB
        const foodIds = aggregatedFoodTable.map((f) => f.foodId);
        const foodsInDb = await SchoolFoodModel.find({ _id: { $in: foodIds } }).lean();
        const foodMap = new Map(foodsInDb.map((f) => [f._id.toString(), f]));

        // 2. Phân tích hiện trạng
        let currentTotal = { cal: 0, p: 0, l: 0, g: 0 };

        const analyzedFoods = aggregatedFoodTable.map((f) => {
            const dbInfo = foodMap.get(f.foodId);
            const nut = calculateNutrition(f, dbInfo, numberOfChildren);

            currentTotal.cal += nut.calories;
            currentTotal.p += nut.protein;
            currentTotal.l += nut.lipid;
            currentTotal.g += nut.glucid;

            // Phân loại nhóm thực phẩm
            let group = 'OTHER';
            const name = f.foodName.toLowerCase();
            const { pPerGram, lPerGram, gPerGram } = nut.meta;

            // Logic phân loại quan trọng để AI biết tăng/giảm món nào
            if (name.includes('dầu') || name.includes('mỡ') || lPerGram > 0.8) group = 'GROUP_FAT (Chất Béo)';
            else if (
                gPerGram > 0.5 ||
                name.includes('gạo') ||
                name.includes('đường') ||
                name.includes('mì') ||
                name.includes('bún') ||
                name.includes('phở')
            )
                group = 'GROUP_CARB (Tinh Bột/Đường)';
            else if (pPerGram > 0.1 || f.isMainFood) group = 'GROUP_PROTEIN (Đạm)';
            else if (name.includes('rau') || name.includes('củ') || name.includes('quả'))
                group = 'GROUP_VEGGIE (Rau/Xơ)';

            return {
                name: f.foodName,
                group: group,
                currentQty: f.purchaseQuantityByUnit,
                stats: {
                    calories: parseFloat(nut.calories.toFixed(1)),
                    P: parseFloat(nut.protein.toFixed(1)),
                    L: parseFloat(nut.lipid.toFixed(1)),
                    G: parseFloat(nut.glucid.toFixed(1)),
                },
            };
        });

        // 3. Tính toán mục tiêu
        const minCal = nutritionalStandard.recommendedCaloriesMin;
        const maxCal = nutritionalStandard.recommendedCaloriesMax;
        const targetCal = (minCal + maxCal) / 2; // Mục tiêu là điểm giữa khung

        const pctP = currentTotal.cal > 0 ? ((currentTotal.p * 4) / currentTotal.cal) * 100 : 0;
        const pctL = currentTotal.cal > 0 ? ((currentTotal.l * 9) / currentTotal.cal) * 100 : 0;
        const pctG = currentTotal.cal > 0 ? ((currentTotal.g * 4) / currentTotal.cal) * 100 : 0;

        // --- XÂY DỰNG CHIẾN THUẬT (STRATEGY) CHO AI ---
        let strategy = [];

        // Nhấn mạnh vào việc sửa TỶ LỆ, không quan tâm Calo lúc này
        strategy.push('ƯU TIÊN SỐ 1: Điều chỉnh khối lượng thực phẩm để Tỷ lệ % (P-L-G) lọt vào khung chuẩn.');
        strategy.push(
            'LƯU Ý QUAN TRỌNG: Bạn không cần lo lắng về Tổng Calo cuối cùng. Hệ thống sẽ tự động co giãn (Auto-scale) lượng ăn sau, nên bạn cứ thoải mái cắt giảm hoặc tăng cường mạnh tay để đạt Tỷ lệ %.',
        );

        // Protein Strategy
        if (pctP < nutritionalStandard.plgStructure.proteinMin)
            strategy.push(`- Protein đang THIẾU (${pctP.toFixed(1)}%): Hãy TĂNG lượng mua của GROUP_PROTEIN.`);
        else if (pctP > nutritionalStandard.plgStructure.proteinMax)
            strategy.push(`- Protein đang DƯ (${pctP.toFixed(1)}%): Hãy GIẢM lượng mua của GROUP_PROTEIN.`);

        // Lipid Strategy
        if (pctL < nutritionalStandard.plgStructure.lipidMin)
            strategy.push(
                `- Lipid đang THIẾU (${pctL.toFixed(1)}%): Hãy TĂNG MẠNH lượng mua của GROUP_FAT (Dầu, Mỡ, các hạt có dầu).`,
            );
        else if (pctL > nutritionalStandard.plgStructure.lipidMax)
            strategy.push(`- Lipid đang DƯ (${pctL.toFixed(1)}%): Hãy GIẢM lượng mua của GROUP_FAT.`);

        // Glucid Strategy
        if (pctG > nutritionalStandard.plgStructure.glucidMax)
            strategy.push(
                `- Glucid đang VƯỢT QUÁ (${pctG.toFixed(1)}%): Hãy CẮT GIẢM MẠNH lượng mua của GROUP_CARB (Gạo, Đường, Bún...).`,
            );
        else if (pctG < nutritionalStandard.plgStructure.glucidMin)
            strategy.push(`- Glucid đang THIẾU (${pctG.toFixed(1)}%): Hãy TĂNG lượng mua của GROUP_CARB.`);

        // 4. Prompt AI
        const prompt = `
        Bạn là chuyên gia dinh dưỡng.
        
        MỤC TIÊU BẮT BUỘC: Đưa Tỷ lệ các chất (P-L-G) về khung chuẩn:
        - Protein (P): ${nutritionalStandard.plgStructure.proteinMin}-${nutritionalStandard.plgStructure.proteinMax}% (Hiện tại: ${pctP.toFixed(1)}%)
        - Lipid (L): ${nutritionalStandard.plgStructure.lipidMin}-${nutritionalStandard.plgStructure.lipidMax}% (Hiện tại: ${pctL.toFixed(1)}%)
        - Glucid (G): ${nutritionalStandard.plgStructure.glucidMin}-${nutritionalStandard.plgStructure.glucidMax}% (Hiện tại: ${pctG.toFixed(1)}%)

        DỮ LIỆU ĐẦU VÀO:
        ${JSON.stringify(analyzedFoods)}

        CHIẾN THUẬT: 
        ${strategy.join('\n')}

        YÊU CẦU OUTPUT:
        - Chỉ trả về JSON: { "items": [{ "foodName": "...", "newPurchaseQuantityByUnit": ... }] }
        - Hãy thay đổi số lượng mua đủ lớn để thay đổi tỷ lệ %. Ví dụ: Đang dư Glucid 63% (chuẩn 52%) thì phải giảm Gạo ít nhất 20-30%. Đang thiếu Lipid thì phải tăng Dầu ăn lên.
        `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Bạn là máy tính tối ưu hóa tỷ lệ dinh dưỡng.' },
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1, // Giữ độ sáng tạo thấp để tính toán chính xác
        });

        const resultJson = JSON.parse(completion.choices[0].message.content);
        const aiSuggestions = resultJson.items || resultJson.foods || Object.values(resultJson)[0];

        // 5. MAP DỮ LIỆU TỪ AI
        let processedTable = aggregatedFoodTable.map((item) => {
            const suggestion = Array.isArray(aiSuggestions)
                ? aiSuggestions.find((s) => s.foodName === item.foodName)
                : null;
            return {
                ...item,
                purchaseQuantityByUnit: suggestion
                    ? parseFloat(suggestion.newPurchaseQuantityByUnit)
                    : item.purchaseQuantityByUnit,
            };
        });

        // ==================================================================================
        // 🚀 BƯỚC QUAN TRỌNG NHẤT: AUTO-SCALING (HẬU XỬ LÝ)
        // Dù AI làm Calo bị tụt hay tăng vọt, bước này sẽ ép Calo về đúng điểm giữa (Target)
        // Mà vẫn giữ nguyên Tỷ lệ % P-L-G tuyệt đẹp mà AI vừa sửa.
        // ==================================================================================

        // B5.1: Tính toán lại Tổng Calo từ kết quả AI gợi ý
        let aiTotalCal = 0;
        processedTable.forEach((item) => {
            const dbInfo = foodMap.get(item.foodId);
            const nut = calculateNutrition(item, dbInfo, numberOfChildren);
            aiTotalCal += nut.calories;
        });

        console.log(`🤖 AI Raw Cal: ${aiTotalCal.toFixed(2)} | Target: ${targetCal}`);

        // B5.2: LUÔN LUÔN Scale về targetCal (Điểm giữa khoảng khuyến nghị)
        // Không quan tâm Calo hiện tại có nằm trong khoảng hay không, scale về điểm giữa là an toàn nhất.
        if (aiTotalCal > 0) {
            const scaleFactor = targetCal / aiTotalCal;

            console.log(`⚡ Applying Auto-Scaling Factor: ${scaleFactor.toFixed(4)}`);

            processedTable = processedTable.map((item) => {
                // Nhân tất cả lượng mua với cùng 1 hệ số
                // Toán học chứng minh: Khi nhân tất cả thành phần với k, Tổng Calo tăng k lần, nhưng Tỷ lệ % các chất không đổi.
                let newQty = item.purchaseQuantityByUnit * scaleFactor;

                // Làm tròn 2 số thập phân
                newQty = Math.round(newQty * 100) / 100;

                return {
                    ...item,
                    purchaseQuantityByUnit: newQty,
                };
            });
        }

        res.status(StatusCodes.OK).json({
            message: 'Đã nhận gợi ý cân đối từ AI',
            data: processedTable,
        });
    } catch (error) {
        next(error);
    }
};

export const schoolMenuAiController = { balanceMenuWithAi };

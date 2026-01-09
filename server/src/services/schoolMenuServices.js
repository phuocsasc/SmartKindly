import { StatusCodes } from 'http-status-codes';
import { SchoolMenuModel } from '~/models/schoolMenuModel.js';
import { SchoolMealModel } from '~/models/schoolMealModel.js';
import { SchoolNutritionalStandardModel } from '~/models/schoolNutritionalStandardModel.js';
import { SchoolFoodModel } from '~/models/schoolFoodModel.js';
import { SchoolMenuApplyModel } from '~/models/schoolMenuApplyModel.js'; // ✅ Thêm import
import { AcademicYearModel } from '~/models/academicYearModel.js'; // ✅ Thêm import
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { removeVietnameseTones } from '~/utils/formatters.js';

const ENERGY_FACTORS = { PROTEIN: 4, LIPID: 9, GLUCID: 4 };
const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];

// --- Helper Functions ---

const evaluate = (value, min, max) => {
    if (value < min) return 'Chưa đạt';
    if (value > max) return 'Vượt quá định mức';
    return 'Đạt';
};

const recalculateFromEditedItem = (editedItem, numberOfChildren) => {
    let purchaseQuantityKg;
    if (editedItem.unit.toLowerCase() === 'kg') {
        purchaseQuantityKg = editedItem.purchaseQuantityByUnit;
    } else {
        purchaseQuantityKg = (editedItem.purchaseQuantityByUnit * editedItem.gramConversion) / 1000;
    }
    purchaseQuantityKg = parseFloat(purchaseQuantityKg.toFixed(1));

    const totalQuantityKg = parseFloat((purchaseQuantityKg / (1 + editedItem.wastePercentage / 100)).toFixed(1));
    const quantityPerChildGram = parseFloat(((totalQuantityKg * 1000) / numberOfChildren).toFixed(2));

    return { ...editedItem, purchaseQuantityKg, totalQuantityKg, quantityPerChildGram };
};

const processMenuData = async (data, schoolId) => {
    const { numberOfChildren, nutritionalStandardId, meals, aggregatedFoodTable } = data;

    // 1. Fetch dependencies
    const [standard, allMealsFromDb] = await Promise.all([
        SchoolNutritionalStandardModel.findOne({ _id: nutritionalStandardId, schoolId }).lean(),
        SchoolMealModel.find({ _id: { $in: Object.values(meals).flat() }, schoolId }).lean(),
    ]);

    if (!standard) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy định mức dinh dưỡng.');
    const mealsMap = new Map(allMealsFromDb.map((m) => [m._id.toString(), m]));

    // 2. Create meal snapshots
    const mealSnapshots = {};
    for (const session of MEAL_SESSIONS) {
        mealSnapshots[session] = (meals[session] || []).map((mealId) => {
            const mealData = mealsMap.get(mealId.toString());
            if (!mealData) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Có món ăn trong thực đơn không tồn tại hoặc đã bị xóa');
            }

            if (mealData._destroy) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Món ăn "${mealData.name}" đã bị xóa, vui lòng chọn món khác`,
                );
            }
            return {
                mealId: mealData._id,
                name: mealData.name,
                ingredients: mealData.ingredients.map((ing) => ({ ...ing })),
            };
        });
    }

    // 3. Process aggregated food table
    let finalAggregatedTable;
    if (aggregatedFoodTable && aggregatedFoodTable.length > 0) {
        finalAggregatedTable = aggregatedFoodTable.map((item) => recalculateFromEditedItem(item, numberOfChildren));
    } else {
        const foodMap = new Map();
        Object.values(mealSnapshots)
            .flat()
            .forEach((meal) => {
                meal.ingredients.forEach((ing) => {
                    const existing = foodMap.get(ing.foodId.toString());
                    if (existing) {
                        existing.quantityPerChildGram += ing.quantityPerChildGram;
                    } else {
                        foodMap.set(ing.foodId.toString(), { ...ing });
                    }
                });
            });
        finalAggregatedTable = Array.from(foodMap.values()).map((item) => {
            const quantityPerChildGram = parseFloat(item.quantityPerChildGram.toFixed(2));
            const totalQuantityKg = parseFloat(((quantityPerChildGram * numberOfChildren) / 1000).toFixed(1));
            const purchaseQuantityKg = parseFloat((totalQuantityKg * (1 + item.wastePercentage / 100)).toFixed(1));
            const purchaseQuantityByUnit =
                item.unit.toLowerCase() === 'kg'
                    ? purchaseQuantityKg
                    : parseFloat(((purchaseQuantityKg / item.gramConversion) * 1000).toFixed(1));
            return { ...item, quantityPerChildGram, totalQuantityKg, purchaseQuantityKg, purchaseQuantityByUnit };
        });
    }

    // 4. Perform nutritional analysis
    const foodInfoMap = new Map(
        finalAggregatedTable.map((i) => [i.foodId.toString(), { protein: 0, lipid: 0, glucid: 0 }]),
    );
    const foodDetails = await SchoolFoodModel.find({ _id: { $in: Array.from(foodInfoMap.keys()) } })
        .select('protein lipid glucid')
        .lean();
    foodDetails.forEach((f) => foodInfoMap.set(f._id.toString(), f));

    const totals = { protein: 0, lipid: 0, glucid: 0 };
    finalAggregatedTable.forEach((item) => {
        const foodInfo = foodInfoMap.get(item.foodId.toString());
        totals.protein += item.quantityPerChildGram * (foodInfo.protein || 0);
        totals.lipid += item.quantityPerChildGram * (foodInfo.lipid || 0);
        totals.glucid += item.quantityPerChildGram * (foodInfo.glucid || 0);
    });

    const totalProtein = parseFloat(totals.protein.toFixed(2));
    const totalLipid = parseFloat(totals.lipid.toFixed(2));
    const totalGlucid = parseFloat(totals.glucid.toFixed(2));
    const totalCalories = parseFloat(
        (
            totalProtein * ENERGY_FACTORS.PROTEIN +
            totalLipid * ENERGY_FACTORS.LIPID +
            totalGlucid * ENERGY_FACTORS.GLUCID
        ).toFixed(2),
    );

    const proteinPercentage =
        totalCalories > 0
            ? parseFloat((((totalProtein * ENERGY_FACTORS.PROTEIN) / totalCalories) * 100).toFixed(2))
            : 0;
    const lipidPercentage =
        totalCalories > 0 ? parseFloat((((totalLipid * ENERGY_FACTORS.LIPID) / totalCalories) * 100).toFixed(2)) : 0;
    const glucidPercentage =
        totalCalories > 0 ? parseFloat((((totalGlucid * ENERGY_FACTORS.GLUCID) / totalCalories) * 100).toFixed(2)) : 0;

    const analysisResult = {
        totalProtein,
        totalLipid,
        totalGlucid,
        totalCalories,
        caloriesEvaluation: evaluate(totalCalories, standard.recommendedCaloriesMin, standard.recommendedCaloriesMax),
        proteinPercentage,
        lipidPercentage,
        glucidPercentage,
        plgEvaluation: {
            protein: evaluate(proteinPercentage, standard.plgStructure.proteinMin, standard.plgStructure.proteinMax),
            lipid: evaluate(lipidPercentage, standard.plgStructure.lipidMin, standard.plgStructure.lipidMax),
            glucid: evaluate(glucidPercentage, standard.plgStructure.glucidMin, standard.plgStructure.glucidMax),
        },
    };

    return {
        ...data,
        ageGroup: standard.ageGroup,
        meals: mealSnapshots,
        aggregatedFoodTable: finalAggregatedTable,
        analysis: analysisResult,
    };
};

/**
 * ✅ Helper: Kiểm tra thực đơn đã được áp dụng trong năm học active
 */
const isMenuApplied = async (menuId, schoolId) => {
    try {
        // Lấy năm học active
        const activeYear = await AcademicYearModel.findOne({
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) return false;

        // Kiểm tra có menu apply nào sử dụng menuId này trong năm học active không
        const appliedCount = await SchoolMenuApplyModel.countDocuments({
            schoolId,
            academicYearId: activeYear._id,
            menuId,
            _destroy: false,
        });

        return appliedCount > 0;
    } catch (error) {
        console.error('❌ [isMenuApplied] Error:', error);
        return false;
    }
};

// --- Main Service Functions ---

const createNew = async (data, userId) => {
    const user = await UserModel.findById(userId).select('schoolId');
    if (!user || !user.schoolId) throw new ApiError(StatusCodes.FORBIDDEN, 'Người dùng không thuộc trường học nào.');

    // ✅ Kiểm tra tên thực đơn đã tồn tại chưa
    const existingMenu = await SchoolMenuModel.findOne({
        schoolId: user.schoolId,
        menuName: { $regex: new RegExp(`^${data.menuName.trim()}$`, 'i') },
        _destroy: false,
    });

    if (existingMenu) {
        throw new ApiError(StatusCodes.CONFLICT, `Tên thực đơn "${data.menuName}" đã tồn tại`);
    }

    const processedData = await processMenuData(data, user.schoolId);

    const newMenu = new SchoolMenuModel({
        ...processedData,
        schoolId: user.schoolId,
        createdBy: userId,
        lastUpdatedBy: userId,
    });

    await newMenu.save();
    return newMenu;
};

/**
 * ✅ Lấy danh sách thực đơn (CÓ FLAG isApplied)
 */
const getAll = async (query, userId) => {
    const user = await UserModel.findById(userId).select('schoolId');
    if (!user || !user.schoolId) throw new ApiError(StatusCodes.FORBIDDEN, 'Người dùng không thuộc trường học nào.');

    const { page = 1, limit = 20, search = '', ageGroup = '', appliedStatus = '' } = query; // ✅ NEW: appliedStatus param
    const skip = (page - 1) * limit;

    const filter = { schoolId: user.schoolId, _destroy: false };
    if (search) {
        filter.menuNameWithoutAccent = { $regex: removeVietnameseTones(search), $options: 'i' };
    }
    if (ageGroup) {
        filter.ageGroup = ageGroup;
    }

    // ✅ Lấy năm học active để filter
    const activeYear = await AcademicYearModel.findOne({
        schoolId: user.schoolId,
        status: 'active',
        _destroy: false,
    });

    // ✅ STEP 1: Nếu có filter appliedStatus, cần pre-filter bằng $lookup + aggregation
    let menus;
    let total;

    if (appliedStatus && activeYear) {
        // ✅ Use aggregation pipeline để filter theo appliedCount
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'schoolmenuapplies', // Collection name (lowercase + underscore)
                    let: { menuId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$menuId', '$$menuId'] },
                                        { $eq: ['$schoolId', user.schoolId] },
                                        { $eq: ['$academicYearId', activeYear._id] },
                                        { $eq: ['$_destroy', false] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'applies',
                },
            },
            {
                $addFields: {
                    appliedCount: { $size: '$applies' },
                },
            },
            {
                $match:
                    appliedStatus === 'applied'
                        ? { appliedCount: { $gt: 0 } }
                        : appliedStatus === 'not_applied'
                          ? { appliedCount: 0 }
                          : {},
            },
            { $sort: { createdAt: -1 } },
        ];

        // Get total count
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await SchoolMenuModel.aggregate(countPipeline);
        total = countResult[0]?.total || 0;

        // Get paginated data
        const dataPipeline = [...pipeline, { $skip: skip }, { $limit: Number(limit) }];
        menus = await SchoolMenuModel.aggregate(dataPipeline);

        // ✅ Populate sau khi aggregate
        await SchoolMenuModel.populate(menus, [
            { path: 'nutritionalStandardId', select: 'ageGroup' },
            { path: 'createdBy', select: 'fullName' },
        ]);
    } else {
        // ✅ Normal query (no appliedStatus filter)
        [menus, total] = await Promise.all([
            SchoolMenuModel.find(filter)
                .select({
                    menuName: 1,
                    ageGroup: 1,
                    numberOfChildren: 1,
                    analysis: 1,
                    _ready: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'meals.Bữa sáng.name': 1,
                    'meals.Bữa sáng.mealId': 1,
                    'meals.Bữa trưa.name': 1,
                    'meals.Bữa trưa.mealId': 1,
                    'meals.Bữa xế.name': 1,
                    'meals.Bữa xế.mealId': 1,
                    'meals.Bữa phụ.name': 1,
                    'meals.Bữa phụ.mealId': 1,
                })
                .populate('nutritionalStandardId', 'ageGroup')
                .populate('createdBy', 'fullName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            SchoolMenuModel.countDocuments(filter),
        ]);
    }

    // ✅ STEP 2: Add isApplied + appliedCount cho tất cả items
    const itemsWithAppliedStatus = await Promise.all(
        menus.map(async (item) => {
            let isApplied = false;
            let appliedCount = 0;

            if (activeYear) {
                // Nếu đã có appliedCount từ aggregation thì dùng luôn
                if (item.appliedCount !== undefined) {
                    appliedCount = item.appliedCount;
                    isApplied = appliedCount > 0;
                } else {
                    // Nếu không có (normal query), tính lại
                    appliedCount = await SchoolMenuApplyModel.countDocuments({
                        schoolId: user.schoolId,
                        academicYearId: activeYear._id,
                        menuId: item._id,
                        _destroy: false,
                    });
                    isApplied = appliedCount > 0;
                }
            }

            return {
                ...item,
                isApplied,
                appliedCount,
            };
        }),
    );

    return {
        items: itemsWithAppliedStatus,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: Number(limit),
        },
    };
};

const getDetails = async (id, userId) => {
    const user = await UserModel.findById(userId).select('schoolId');
    const menu = await SchoolMenuModel.findOne({ _id: id, schoolId: user.schoolId, _destroy: false })
        .populate('nutritionalStandardId')
        .lean();
    if (!menu) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực đơn.');
    return menu;
};

const update = async (id, data, userId) => {
    const user = await UserModel.findById(userId).select('schoolId');
    const existingMenu = await SchoolMenuModel.findOne({ _id: id, schoolId: user.schoolId, _destroy: false });
    if (!existingMenu) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực đơn.');
    // ✅ Kiểm tra xem thực đơn đã được áp dụng chưa
    const applied = await isMenuApplied(id, user.schoolId);
    if (applied) {
        throw new ApiError(
            StatusCodes.FORBIDDEN,
            'Không thể chỉnh sửa thực đơn đã được áp dụng trong năm học hiện tại',
        );
    }

    // ✅ Kiểm tra tên thực đơn trùng lặp nếu có thay đổi tên
    if (data.menuName && data.menuName.trim() !== existingMenu.menuName) {
        const duplicateMenu = await SchoolMenuModel.findOne({
            _id: { $ne: id },
            schoolId: user.schoolId,
            menuName: { $regex: new RegExp(`^${data.menuName.trim()}$`, 'i') },
            _destroy: false,
        });

        if (duplicateMenu) {
            throw new ApiError(StatusCodes.CONFLICT, `Tên thực đơn "${data.menuName}" đã tồn tại`);
        }
    }

    const updatedData = {
        menuName: data.menuName || existingMenu.menuName,
        numberOfChildren: data.numberOfChildren || existingMenu.numberOfChildren,
        nutritionalStandardId: data.nutritionalStandardId || existingMenu.nutritionalStandardId,
        meals: data.meals || existingMenu.meals,
        aggregatedFoodTable: data.aggregatedFoodTable || existingMenu.aggregatedFoodTable,
    };

    const processedData = await processMenuData(updatedData, user.schoolId);

    Object.assign(existingMenu, { ...processedData, lastUpdatedBy: userId });
    await existingMenu.save();
    return existingMenu;
};

const deleteMenu = async (id, userId) => {
    const user = await UserModel.findById(userId).select('schoolId');
    const menu = await SchoolMenuModel.findOne({ _id: id, schoolId: user.schoolId });
    if (!menu) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực đơn.');

    // ✅ Kiểm tra xem thực đơn đã được áp dụng chưa
    const applied = await isMenuApplied(id, user.schoolId);
    if (applied) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Không thể xóa thực đơn đã được áp dụng trong năm học hiện tại');
    }
    // ✅ Store menu info for audit log
    const menuInfo = {
        menuName: menu.menuName,
        ageGroup: menu.ageGroup,
        numberOfChildren: menu.numberOfChildren,
        ready: menu._ready,
    };

    menu._destroy = true;
    await menu.save();
    return { message: 'Xóa thực đơn thành công.', menuInfo };
};

export const schoolMenuServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteMenu,
};

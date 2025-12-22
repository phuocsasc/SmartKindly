// server/src/services/schoolMealServices.js

import { SchoolMealModel } from '~/models/schoolMealModel.js';
import { SchoolFoodModel } from '~/models/schoolFoodModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { removeVietnameseTones } from '~/utils/formatters.js'; // ✅ Named import

/**
 * ✅ Tạo món ăn mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [SchoolMeal createNew] Starting');

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được tạo
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền tạo món ăn');
        }

        // ✅ Kiểm tra duplicate name
        const existingMeal = await SchoolMealModel.findOne({
            schoolId: user.schoolId,
            name: { $regex: new RegExp(`^${data.name}$`, 'i') },
            _destroy: false,
        });

        if (existingMeal) {
            throw new ApiError(StatusCodes.CONFLICT, 'Tên món ăn đã tồn tại');
        }

        // ✅ Fetch thông tin chi tiết của các ingredients từ SchoolFood
        const enrichedIngredients = await Promise.all(
            data.ingredients.map(async (ing) => {
                const food = await SchoolFoodModel.findOne({
                    _id: ing.foodId,
                    schoolId: user.schoolId,
                    _destroy: false,
                }).lean();

                if (!food) {
                    throw new ApiError(StatusCodes.NOT_FOUND, `Không tìm thấy thực phẩm với ID: ${ing.foodId}`);
                }

                return {
                    foodId: food._id,
                    foodName: food.name,
                    foodNameWithoutAccent: food.nameWithoutAccent,
                    categories: food.categories,
                    protein: food.protein,
                    lipid: food.lipid,
                    glucid: food.glucid,
                    unit: food.unit,
                    gramConversion: food.gramConversion,
                    wastePercentage: food.wastePercentage,
                    quantityPerChildGram: ing.quantityPerChildGram,
                    isMainFood: ing.isMainFood || false,
                };
            }),
        );

        // ✅ Tạo meal (pre-save hook sẽ tính toán các giá trị)
        const newMeal = new SchoolMealModel({
            schoolId: user.schoolId,
            name: data.name,
            mealType: data.mealType,
            ingredients: enrichedIngredients,
            createdBy: userId,
            lastUpdatedBy: userId,
        });

        await newMeal.save();

        const populated = await SchoolMealModel.findById(newMeal._id)
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [SchoolMeal createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [SchoolMeal createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo món ăn: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách món ăn
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 20, search = '', mealType = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { schoolId: user.schoolId, _destroy: false };

        // ✅ Search by name
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [{ name: searchRegex }, { nameWithoutAccent: searchRegex }];
        }

        // ✅ Filter by mealType
        if (mealType) {
            filter.mealType = mealType;
        }

        const [meals, total] = await Promise.all([
            SchoolMealModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 })
                .lean(),
            SchoolMealModel.countDocuments(filter),
        ]);

        return {
            meals,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [SchoolMeal getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách món ăn');
    }
};

/**
 * ✅ Lấy chi tiết món ăn
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const meal = await SchoolMealModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!meal) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy món ăn');
        }

        return meal;
    } catch (error) {
        console.error('❌ [SchoolMeal getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin món ăn');
    }
};

/**
 * ✅ Cập nhật món ăn
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [SchoolMeal update] Starting');

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được update
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền cập nhật món ăn');
        }

        const meal = await SchoolMealModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!meal) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy món ăn');
        }

        // ✅ Check duplicate name nếu đổi tên
        if (data.name && data.name !== meal.name) {
            const existingMeal = await SchoolMealModel.findOne({
                _id: { $ne: id },
                schoolId: user.schoolId,
                name: { $regex: new RegExp(`^${data.name}$`, 'i') },
                _destroy: false,
            });

            if (existingMeal) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên món ăn đã tồn tại');
            }
        }

        // ✅ Nếu có update ingredients, fetch lại thông tin từ SchoolFood
        if (data.ingredients) {
            const enrichedIngredients = await Promise.all(
                data.ingredients.map(async (ing) => {
                    const food = await SchoolFoodModel.findOne({
                        _id: ing.foodId,
                        schoolId: user.schoolId,
                        // ✅ FIX: Cho phép tìm cả food đã bị đánh dấu _destroy
                    }).lean();

                    if (!food) {
                        throw new ApiError(StatusCodes.NOT_FOUND, `Không tìm thấy thực phẩm với ID: ${ing.foodId}`);
                    }

                    // ✅ Cảnh báo nếu food đã bị xóa ở admin
                    if (food._destroy) {
                        console.warn(`⚠️ Food ${food.name} (${food._id}) has been removed from admin database`);
                    }

                    return {
                        foodId: food._id,
                        foodName: food.name,
                        foodNameWithoutAccent: food.nameWithoutAccent,
                        categories: food.categories,
                        protein: food.protein,
                        lipid: food.lipid,
                        glucid: food.glucid,
                        unit: food.unit,
                        gramConversion: food.gramConversion,
                        wastePercentage: food.wastePercentage,
                        quantityPerChildGram: ing.quantityPerChildGram,
                        isMainFood: ing.isMainFood || false,
                    };
                }),
            );
            data.ingredients = enrichedIngredients;
        }

        // ✅ Update
        Object.assign(meal, data, { lastUpdatedBy: userId });
        await meal.save();

        const updated = await SchoolMealModel.findById(meal._id)
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [SchoolMeal update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [SchoolMeal update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật món ăn');
    }
};

/**
 * ✅ Xóa món ăn
 */
const deleteMeal = async (id, userId) => {
    try {
        console.log('🗑️ [SchoolMeal delete] Starting');

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được xóa
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền xóa món ăn');
        }

        const meal = await SchoolMealModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!meal) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy món ăn');
        }

        // ✅ Hard delete
        await SchoolMealModel.findByIdAndDelete(id);

        console.log('✅ [SchoolMeal delete] Deleted successfully');
        return { message: 'Xóa món ăn thành công' };
    } catch (error) {
        console.error('❌ [SchoolMeal delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa món ăn');
    }
};

/**
 * ✅ Search thực phẩm để thêm vào ingredients
 */
const searchFoods = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { search = '', limit = 20 } = query;

        const filter = { schoolId: user.schoolId, _destroy: false };

        if (search) {
            const searchTrimmed = search.trim(); // Loại bỏ khoảng trắng đầu cuối
            const searchNormalized = removeVietnameseTones(searchTrimmed).toLowerCase(); // Bỏ dấu + lowercase

            filter.$or = [
                { name: { $regex: searchTrimmed, $options: 'i' } }, // Tìm có dấu
                { nameWithoutAccent: { $regex: searchNormalized, $options: 'i' } }, // Tìm không dấu
            ];
        }

        const foods = await SchoolFoodModel.find(filter).limit(Number(limit)).sort({ name: 1 }).lean();

        return { foods };
    } catch (error) {
        console.error('❌ [SchoolMeal searchFoods] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tìm kiếm thực phẩm');
    }
};

export const schoolMealServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteMeal,
    searchFoods,
};

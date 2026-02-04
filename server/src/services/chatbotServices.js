// server/src/services/chatbotServices.js

import OpenAI from 'openai';
import { env } from '~/config/environment';
import { ChatbotConversationModel } from '~/models/chatbotModel.js';
import { parentChildrenServices } from '~/services/parentChildrenServices.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

/**
 * ✅ 1. CREATE CONVERSATION - Tạo phiên chat mới
 */
const createConversation = async (userId) => {
    try {
        // Lấy thông tin cơ bản để khởi tạo
        const childrenInfo = await parentChildrenServices.getChildrenInfo(userId);
        const schoolInfo = await parentChildrenServices.getSchoolInfo(userId);

        const newConversation = await ChatbotConversationModel.create({
            schoolId: schoolInfo.schoolId,
            userId: userId,
            studentId: childrenInfo.student._id,
            conversationName: `Tư vấn cho bé ${childrenInfo.student.fullName}`,
            messages: [],
        });

        return newConversation;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo cuộc trò chuyện mới');
    }
};

/**
 * ✅ 2. GET ALL CONVERSATIONS - Lấy danh sách lịch sử chat của phụ huynh
 */
const getAllConversations = async (userId) => {
    return await ChatbotConversationModel.find({
        userId,
        _destroy: false,
    })
        .select('-messages') // Không lấy nội dung chat ở trang danh sách để tối ưu dung lượng
        .sort({ lastMessageAt: -1 })
        .lean();
};

/**
 * ✅ 3. GET CONVERSATION DETAILS - Xem lại nội dung một cuộc trò chuyện cụ thể
 */
const getConversationDetails = async (conversationId, userId) => {
    const conversation = await ChatbotConversationModel.findOne({
        _id: conversationId,
        userId,
        _destroy: false,
    }).lean();

    if (!conversation) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy nội dung cuộc trò chuyện');
    return conversation;
};

/**
 * ✅ 4. SEND MESSAGE - Gửi tin nhắn và nhận phản hồi từ AI (Xử lý chính)
 */
const sendMessage = async (conversationId, message, userId) => {
    try {
        const conversation = await ChatbotConversationModel.findOne({ _id: conversationId, userId, _destroy: false });
        if (!conversation) throw new ApiError(StatusCodes.NOT_FOUND, 'Phiên trò chuyện không hợp lệ');

        // 1. Thu thập dữ liệu ngữ cảnh cực kỳ chi tiết
        const [school, childrenData, academicYears] = await Promise.all([
            parentChildrenServices.getSchoolInfo(userId),
            parentChildrenServices.getChildrenInfo(userId),
            parentChildrenServices.getAcademicYears(userId),
        ]);

        const student = childrenData.student; // Thông tin định danh của bé
        const currentClass = childrenData.currentClass;
        const activeYearId = academicYears.activeYearId;

        // Xác định tuần hiện tại (Logic thực tế nên dựa vào ngày hiện tại)
        const currentWeekNumber = 1;

        // Lấy dữ liệu động (Điểm danh, thực đơn, đánh giá)
        const [attendance, dailyAssessment, menu, weeklyCert] = await Promise.all([
            currentClass
                ? parentChildrenServices.getAttendance(activeYearId, currentClass._id, currentWeekNumber, userId)
                : null,
            currentClass
                ? parentChildrenServices.getDailyAssessment(activeYearId, currentClass._id, currentWeekNumber, userId)
                : null,
            currentClass
                ? parentChildrenServices.getWeeklyMenu(activeYearId, currentClass._id, currentWeekNumber, userId)
                : null,
            currentClass
                ? parentChildrenServices.getWeeklyCertificate(activeYearId, currentClass._id, currentWeekNumber, userId)
                : null,
        ]);

        // 2. Xây dựng Ngữ cảnh (Context) siêu sạch để AI không thể từ chối trả lời
        const contextData = {
            school_info: {
                name: school.name,
                address: school.address,
                phone: school.phone,
                manager: school.manager,
            },
            student_profile: {
                fullName: student.fullName,
                nickname: student.nickname,
                birthDate: dayjs(student.birthDate).format('DD/MM/YYYY'),
                age_group: student.currentAgeGroup, // Trả lời cho câu hỏi "mấy tuổi"
                gender: student.gender,
                className: currentClass?.name,
                teacher: currentClass?.homeRoomTeacher?.fullName,
            },
            weekly_status: {
                attendance: attendance?.attendanceMap || 'Chưa có dữ liệu điểm danh tuần này',
                daily_assessments: dailyAssessment?.assessmentMap || 'Giáo viên chưa cập nhật nhận xét hằng ngày',
                menu:
                    menu?.menuApplies?.map(
                        (m) => `Thứ ${m.dayOfWeek}: ${m.menuSnapshot?.map((dish) => dish.dishName).join(', ')}`,
                    ) || 'Chưa có thực đơn',
                is_good_child: weeklyCert?.certificate?.isGoodChild
                    ? 'Đã đạt bé ngoan tuần này'
                    : 'Chưa có phiếu bé ngoan',
            },
        };

        // 3. System Prompt "Cứng" để ép AI sử dụng dữ liệu
        const systemPrompt = `
            Bạn là SmartKindly AI. Bạn có quyền truy cập dữ liệu thực tế sau đây về bé ${student.fullName}:
            ---
            DỮ LIỆU CỦA BÉ: ${JSON.stringify(contextData)}
            ---
            NHIỆM VỤ:
            1. Trả lời dựa trên DỮ LIỆU CỦA BÉ được cung cấp ở trên. 
            2. Nếu phụ huynh hỏi về tuổi, hãy nhìn vào 'age_group' (${student.currentAgeGroup}) hoặc 'birthDate'.
            3. Nếu hỏi về điểm danh, hãy nhìn vào 'attendance'.
            4. TUYỆT ĐỐI KHÔNG nói "Tôi không có thông tin" nếu thông tin đó tồn tại trong khối dữ liệu trên.
            5. Nếu thông tin thực sự không có (null/undefined), hãy hướng dẫn phụ huynh liên hệ GVCN: ${currentClass?.homeRoomTeacher?.fullName}.
            6. Chỉ trả lời thông tin liên quan đến bé ${student.fullName}. Từ chối mọi yêu cầu về trẻ khác hoặc so sánh.
            7. Ngôn ngữ: Thân thiện, hỗ trợ, hiểu tiếng Việt không dấu/sai chính tả.
        `;

        // 4. Gọi API OpenAI
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversation.messages.slice(-5).map((m) => ({ role: m.role, content: m.content })),
                { role: 'user', content: message },
            ],
            temperature: 0.3, // Giảm temperature để AI bám sát dữ liệu, ít "chém gió"
        });

        const aiResponse = chatCompletion.choices[0].message.content;

        // 5. Lưu và trả về kết quả
        conversation.messages.push({ role: 'user', content: message });
        conversation.messages.push({ role: 'assistant', content: aiResponse });
        conversation.lastMessageAt = Date.now();
        await conversation.save();

        return { answer: aiResponse, timestamp: new Date() };
    } catch (error) {
        console.error('❌ [Chatbot Fix Error]:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Có lỗi khi AI truy xuất dữ liệu bé.');
    }
};

/**
 * ✅ 5. DELETE CONVERSATION - Xóa lịch sử trò chuyện (Soft delete)
 */
const deleteConversation = async (conversationId, userId) => {
    const deletedConversation = await ChatbotConversationModel.findOneAndDelete({
        _id: conversationId,
        userId,
    });

    if (!deletedConversation) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy cuộc trò chuyện');
    }

    return {
        message: 'Đã xóa cuộc trò chuyện vĩnh viễn!',
        id: conversationId,
    };
};

export const chatbotServices = {
    createConversation,
    getAllConversations,
    getConversationDetails,
    sendMessage,
    deleteConversation,
};

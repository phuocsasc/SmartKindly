// server/src/models/chatbotModel.js

import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false },
);

const chatbotConversationSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChildrenManagement',
            required: true,
            index: true,
        },
        conversationName: {
            type: String,
            default: 'Cuộc trò chuyện mới',
        },
        messages: [chatMessageSchema],
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: 'chatbot_conversations',
    },
);

// Index
chatbotConversationSchema.index({ schoolId: 1, userId: 1, _destroy: 1 });
chatbotConversationSchema.index({ lastMessageAt: -1 });

export const ChatbotConversationModel = mongoose.model('ChatbotConversation', chatbotConversationSchema);

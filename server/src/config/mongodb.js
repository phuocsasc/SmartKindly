import mongoose from 'mongoose';
import { env } from '~/config/environment.js';

// Tắt warning strictQuery trong mongoose v7
mongoose.set('strictQuery', false);

export const CONNECT_DB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URI, {
            dbName: env.DATABASE_NAME,
        });
        console.log('2. ✅ Kết nối MongoDB bằng Mongoose thành công!');
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error);
        process.exit(1);
    }
};

export const CLOSE_DB = async () => {
    try {
        await mongoose.connection.close();
        console.log('🔌 Đã đóng kết nối MongoDB');
    } catch (error) {
        console.error('❌ Lỗi khi đóng kết nối MongoDB:', error);
    }
};

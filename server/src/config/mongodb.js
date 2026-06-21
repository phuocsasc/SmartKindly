import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '~/config/environment.js';

// Tắt warning strictQuery trong mongoose v7
mongoose.set('strictQuery', false);

const ATLAS_DNS_SERVERS = ['1.1.1.1', '8.8.8.8'];

const connectMongo = async () => {
    await mongoose.connect(env.MONGODB_URI, {
        dbName: env.DATABASE_NAME,
        serverSelectionTimeoutMS: 10000,
    });
};

export const CONNECT_DB = async () => {
    try {
        await connectMongo();
        console.log('2. ✅ Kết nối MongoDB bằng Mongoose thành công!');
    } catch (error) {
        const isSrvDnsError =
            env.MONGODB_URI?.startsWith('mongodb+srv://') && error?.code === 'ECONNREFUSED' && error?.syscall === 'querySrv';

        if (isSrvDnsError) {
            console.warn('⚠️ DNS mặc định đang chặn SRV lookup của MongoDB Atlas, thử lại bằng DNS public...');
            dns.setServers(ATLAS_DNS_SERVERS);

            try {
                await connectMongo();
                console.log('2. ✅ Kết nối MongoDB bằng Mongoose thành công!');
                return;
            } catch (retryError) {
                console.error('❌ Lỗi kết nối MongoDB sau khi thử DNS public:', retryError);
                process.exit(1);
            }
        }

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

import { MongoClient, ServerApiVersion } from 'mongodb';
import { env } from '~/config/environment';

// Khởi tạo một đối tượng smartkindlyDatabaseInstance ban đầu là null (vì chúng ta chưa kết nối)
let smartkindlyDatabaseInstance = null;

// Khởi tạo đối tượng mongoClientInstance để connect đến MongoDB
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// Kết nối đến MongoDB
export const CONNECT_DB = async () => {
    try {
        // Gọi phương thức connect để kết nối tới MongoDB Atlas với URI đã cung cấp trong thân mongoClientInstance
        await mongoClientInstance.connect();
        // Kết nối thành công thì lấy ra DB theo tên và gán ngược nó lại vào biến smartkindlyDatabaseInstance ở trên
        smartkindlyDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME);
        console.log('2. ✅ Kết nối đến MongoDB thành công');
    } catch (error) {
        console.error('Lỗi kết nối đến MongoDB:', error);
        throw error;
    }
};

// Function này có nhiệm vụ export ra cái smartkindlyDatabaseInstance sau khi đã connect thành công tới MongoDB
// => để các file khác có thể import và sử dụng
// Lưu ý: phải đảm bảo chỉ luôn gọi cái GET_DB() này sau khi đã gọi CONNECT_DB() và kết nối thành công
export const GET_DB = () => {
    if (!smartkindlyDatabaseInstance) {
        throw new Error('Chưa kết nối đến MongoDB. Vui lòng gọi CONNECT_DB() trước.');
    }
    return smartkindlyDatabaseInstance;
};

// Đóng kết nối đến MongoDB (nếu cần thiết) dùng exit-hook
export const CLOSE_DB = async () => {
    try {
        await mongoClientInstance.close();
        console.log('Đóng kết nối đến MongoDB thành công');
    } catch (error) {
        console.error('Lỗi khi đóng kết nối đến MongoDB:', error);
        throw error;
    }
};

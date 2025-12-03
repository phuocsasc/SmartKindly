import { Server } from 'socket.io';
import { JwtProvider } from '~/providers/JwtProvider';
import { env } from '~/config/environment';

let io = null;

/**
 * ✅ Khởi tạo Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 */
export const initSocketServer = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling'], // ✅ FIX: Add transports
    });

    // ✅ Middleware xác thực JWT
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // ✅ Verify JWT token
            const decoded = await JwtProvider.verifyToken(token, env.ACCESS_TOKEN_SECRET_SIGNATURE);

            // ✅ Gắn thông tin user vào socket
            socket.userId = decoded.id;
            socket.schoolId = decoded.schoolId;
            socket.role = decoded.role;

            console.log('✅ [Socket] User authenticated:', {
                userId: socket.userId,
                schoolId: socket.schoolId,
                role: socket.role,
            });

            next();
        } catch (error) {
            console.error('❌ [Socket] Authentication failed:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // ✅ Connection handler
    io.on('connection', (socket) => {
        console.log('🔌 [Socket] Client connected:', socket.id, '| User:', socket.userId);

        // ✅ Join room theo userId để nhận thông báo cá nhân
        const userRoom = `user-${socket.userId}`;
        socket.join(userRoom);
        console.log(`📥 [Socket] User ${socket.userId} joined room: ${userRoom}`);

        // ✅ Optional: Join room theo schoolId để broadcast thông báo toàn trường
        if (socket.schoolId) {
            const schoolRoom = `school-${socket.schoolId}`;
            socket.join(schoolRoom);
            console.log(`🏫 [Socket] User joined school room: ${schoolRoom}`);
        }

        // ✅ Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log('🔌 [Socket] Client disconnected:', socket.id, '| Reason:', reason);
        });

        // ✅ Handle errors
        socket.on('error', (error) => {
            console.error('❌ [Socket] Error:', error);
        });
    });

    console.log('✅ [Socket.IO] Server initialized successfully');
    return io;
};

/**
 * ✅ Get Socket.IO instance
 */
export const getSocketIO = () => {
    if (!io) {
        throw new Error('Socket.IO has not been initialized. Call initSocketServer first.');
    }
    return io;
};

/**
 * ✅ Emit notification đến user cụ thể
 * @param {String} userId - User ID
 * @param {String} event - Event name
 * @param {Object} data - Data to send
 */
export const emitToUser = (userId, event, data) => {
    try {
        const io = getSocketIO();
        const userRoom = `user-${userId}`;
        io.to(userRoom).emit(event, data);
        console.log(`📤 [Socket] Emitted "${event}" to user ${userId}:`, data);
    } catch (error) {
        console.error('❌ [Socket] Error emitting to user:', error);
    }
};

/**
 * ✅ Emit notification đến toàn trường
 * @param {String} schoolId - School ID
 * @param {String} event - Event name
 * @param {Object} data - Data to send
 */
export const emitToSchool = (schoolId, event, data) => {
    try {
        const io = getSocketIO();
        const schoolRoom = `school-${schoolId}`;
        io.to(schoolRoom).emit(event, data);
        console.log(`📤 [Socket] Emitted "${event}" to school ${schoolId}`);
    } catch (error) {
        console.error('❌ [Socket] Error emitting to school:', error);
    }
};

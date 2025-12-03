import { io } from 'socket.io-client';
import { API_ROOT } from '~/utils/constants';

class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    /**
     * ✅ Kết nối socket với JWT token
     */
    connect(accessToken) {
        if (this.socket?.connected) {
            console.log('⚠️ [Socket] Already connected');
            return;
        }

        // ✅ FIX: Get base URL without /v1
        const baseUrl = API_ROOT.replace('/v1', '');

        this.socket = io(baseUrl, {
            auth: {
                token: accessToken,
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'], // ✅ ADD: Specify transports
        });

        // ✅ Connection success
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ [Socket] Connected:', this.socket.id);
        });

        // ✅ Connection error
        this.socket.on('connect_error', (error) => {
            this.isConnected = false;
            console.error('❌ [Socket] Connection error:', error.message);
        });

        // ✅ Disconnection
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('🔌 [Socket] Disconnected:', reason);
        });

        // ✅ Reconnection attempt
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 [Socket] Reconnection attempt #${attemptNumber}`);
        });

        // ✅ Reconnection success
        this.socket.on('reconnect', (attemptNumber) => {
            this.isConnected = true;
            console.log(`✅ [Socket] Reconnected after ${attemptNumber} attempts`);
        });
    }

    /**
     * ✅ Disconnect socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            console.log('🔌 [Socket] Manually disconnected');
        }
    }

    /**
     * ✅ Subscribe to event
     */
    on(event, callback) {
        if (!this.socket) {
            console.error('❌ [Socket] Not initialized');
            return;
        }
        this.socket.on(event, callback);
    }

    /**
     * ✅ Unsubscribe from event
     */
    off(event, callback) {
        if (!this.socket) {
            console.error('❌ [Socket] Not initialized');
            return;
        }
        this.socket.off(event, callback);
    }

    /**
     * ✅ Emit event
     */
    emit(event, data) {
        if (!this.socket) {
            console.error('❌ [Socket] Not initialized');
            return;
        }
        this.socket.emit(event, data);
    }

    /**
     * ✅ Check connection status
     */
    isSocketConnected() {
        return this.isConnected && this.socket?.connected;
    }
}

// ✅ Export singleton instance
export const socketClient = new SocketClient();

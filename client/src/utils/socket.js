import { io } from 'socket.io-client';
import { API_ROOT } from '~/utils/constants';

class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentToken = null;
        this.heartbeatTimer = null;
        this.heartbeatIntervalMs = 25000;
    }

    /**
     * ✅ Kết nối socket với JWT token
     */
    connect(accessToken) {
        if (!accessToken) {
            console.warn('⚠️ [Socket] Missing access token, skip connect');
            return;
        }

        if (this.socket && this.currentToken === accessToken && (this.socket.connected || this.socket.active)) {
            console.log('⚠️ [Socket] Already connected');
            return;
        }

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }

        // ✅ FIX: Get base URL without /v1
        const baseUrl = API_ROOT.replace('/v1', '');
        this.currentToken = accessToken;

        this.socket = io(baseUrl, {
            auth: {
                token: accessToken,
            },
            autoConnect: true,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            timeout: 20000,
            transports: ['polling', 'websocket'],
        });

        // ✅ Connection success
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ [Socket] Connected:', this.socket.id);
            this.startHeartbeat();
            this.sendPing();
        });

        // ✅ Connection error
        this.socket.on('connect_error', (error) => {
            this.isConnected = false;
            console.error('❌ [Socket] Connection error:', error.message);
        });

        // ✅ Disconnection
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.stopHeartbeat();
            console.log('🔌 [Socket] Disconnected:', reason);
        });

        this.socket.on('app:pong', () => {
            console.log('🏓 [Socket] Pong received');
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
            this.stopHeartbeat();
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.currentToken = null;
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

    startHeartbeat() {
        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            if (!this.socket?.connected) {
                return;
            }

            this.sendPing();
        }, this.heartbeatIntervalMs);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    sendPing() {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('app:ping', { clientTime: Date.now() });
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

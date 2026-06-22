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

    createSocket(baseUrl, accessToken) {
        const socket = io(baseUrl, {
            auth: {
                token: accessToken,
            },
            autoConnect: false,
            forceNew: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
            randomizationFactor: 0.5,
            timeout: 30000,
            transports: ['polling', 'websocket'],
            closeOnBeforeunload: false,
        });

        socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ [Socket] Connected:', socket.id);
            this.startHeartbeat();
            this.sendPing();
        });

        socket.on('connect_error', (error) => {
            this.isConnected = false;
            console.error('❌ [Socket] Connection error:', error.message);
        });

        socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.stopHeartbeat();
            console.log('🔌 [Socket] Disconnected:', reason);

            if (reason !== 'io client disconnect') {
                console.log('🔄 [Socket] Keep reconnection enabled for transient disconnects');
            }
        });

        socket.on('app:pong', () => {
            console.log('🏓 [Socket] Pong received');
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 [Socket] Reconnection attempt #${attemptNumber}`);
        });

        socket.on('reconnect', (attemptNumber) => {
            this.isConnected = true;
            console.log(`✅ [Socket] Reconnected after ${attemptNumber} attempts`);
            this.startHeartbeat();
            this.sendPing();
        });

        socket.on('reconnect_error', (error) => {
            console.error('❌ [Socket] Reconnect error:', error.message);
        });

        return socket;
    }

    /**
     * ✅ Kết nối socket với JWT token
     */
    connect(accessToken) {
        if (!accessToken) {
            console.warn('⚠️ [Socket] Missing access token, skip connect');
            return;
        }

        if (this.socket && this.currentToken === accessToken && this.socket.connected) {
            console.log('⚠️ [Socket] Already connected');
            return;
        }

        if (this.socket && this.currentToken === accessToken && this.socket.active) {
            console.log('🔄 [Socket] Reusing active socket while it reconnects');
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

        this.socket = this.createSocket(baseUrl, accessToken);
        this.socket.connect();
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

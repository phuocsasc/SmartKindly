import { auditLogServices } from '~/services/auditLogServices.js';

/**
 * ✅ Middleware tự động log hành động
 */
export const auditLog = (action, resource, getDescription) => {
    return async (req, res, next) => {
        // ✅ Hook vào res.json để log sau khi response thành công
        const originalJson = res.json.bind(res);

        res.json = function (body) {
            // ✅ Chỉ log nếu response success (status 2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const user = req.jwtDecoded;
                if (user && user.schoolId) {
                    const logData = {
                        schoolId: user.schoolId,
                        userId: user.id,
                        userName: user.fullName || user.username,
                        userRole: user.role,
                        action,
                        resource,
                        resourceId: req.params.id || req.body.id || null,
                        description: getDescription ? getDescription(req, body) : `${action} ${resource}`,
                        metadata: {
                            method: req.method,
                            path: req.originalUrl,
                            body: req.body,
                            params: req.params,
                            query: req.query,
                        },
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('user-agent'),
                    };

                    // ✅ Async log (không chờ)
                    auditLogServices.createLog(logData).catch((err) => {
                        console.error('❌ Failed to create audit log:', err);
                    });
                }
            }

            return originalJson(body);
        };

        next();
    };
};

// ✅ Export helper để sử dụng trong services
export const logAction = async (userId, schoolId, action, resource, description, metadata = {}) => {
    try {
        const { UserModel } = await import('~/models/userModel.js');
        const user = await UserModel.findById(userId).select('fullName username role');

        if (user && schoolId) {
            await auditLogServices.createLog({
                schoolId,
                userId,
                userName: user.fullName || user.username,
                userRole: user.role,
                action,
                resource,
                resourceId: metadata.resourceId,
                description,
                metadata,
            });
        }
    } catch (error) {
        console.error('❌ [logAction] Error:', error);
    }
};

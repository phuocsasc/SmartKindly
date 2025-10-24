/**
 * Regex validation cho MongoDB ObjectId
 */
export const OBJECT_ID_RULE = /^[0-9a-fA-F]{24}$/;
export const OBJECT_ID_RULE_MESSAGE = 'ID không hợp lệ (phải là chuỗi 24 ký tự hex)';

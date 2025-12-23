// client/src/hooks/useDebounce.js
import { useEffect, useState } from 'react';

/**
 * useDebounce
 * @param {*} value - Giá trị cần debounce (string, number, object…)
 * @param {number} delay - Thời gian delay (ms)
 * @returns {*} debouncedValue
 */
export default function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup khi value hoặc delay thay đổi
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

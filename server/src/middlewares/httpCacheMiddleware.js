export const setCacheHeaders = (maxAge = 300) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.set({
                'Cache-Control': `public, max-age=${maxAge}`,
                ETag: `"${Date.now()}"`, // ✅ Simple ETag
            });
        }
        next();
    };
};

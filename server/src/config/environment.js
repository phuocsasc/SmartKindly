import 'dotenv/config';

export const env = {
    MONGODB_URI: process.env.MONGODB_URI || 'your_default_mongodb_uri',
    DATABASE_NAME: process.env.DATABASE_NAME || 'your_default_database_name',
    ACCESS_TOKEN_SECRET_SIGNATURE: process.env.ACCESS_TOKEN_SECRET_SIGNATURE || 'default_access_token_secret',
    REFRESH_TOKEN_SECRET_SIGNATURE: process.env.REFRESH_TOKEN_SECRET_SIGNATURE || 'default_refresh_token_secret',
    PORT: process.env.PORT || 8017,
    HOSTNAME: process.env.HOSTNAME || 'localhost',
};

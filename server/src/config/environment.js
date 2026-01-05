import 'dotenv/config';

export const env = {
    MONGODB_URI: process.env.MONGODB_URI || 'your_default_mongodb_uri',
    DATABASE_NAME: process.env.DATABASE_NAME || 'your_default_database_name',

    ACCESS_TOKEN_SECRET_SIGNATURE: process.env.ACCESS_TOKEN_SECRET_SIGNATURE || 'default_access_token_secret',
    REFRESH_TOKEN_SECRET_SIGNATURE: process.env.REFRESH_TOKEN_SECRET_SIGNATURE || 'default_refresh_token_secret',

    LOCAL_DEV_APP_PORT: process.env.LOCAL_DEV_APP_PORT || 8017,
    LOCAL_DEV_APP_HOST: process.env.LOCAL_DEV_APP_HOST || 'localhost',
    BUILD_MODE: process.env.BUILD_MODE,
    CLIENT_URL: process.env.CLIENT_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

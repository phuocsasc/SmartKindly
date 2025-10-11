import express from 'express';
import { CONNECT_DB, GET_DB } from '~/config/mongodb';
import cors from 'cors';
import { corsOptions } from '~/config/corsOptions';
import { APIs_V1 } from '~/routes/v1/';
import { env } from '~/config/environment';

const START_SERVER = () => {
    const app = express();

    app.get('/', async (req, res) => {
        console.log(await GET_DB().listCollections().toArray());
        res.send('<h2>SmartKindly - Back-end Server is running successfully</h2>');
    });

    // Fix Cache from disk from ExpressJS
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        next();
    });

    // Allow CORS: for more info, check here: https://youtu.be/iYgAWJ2Djkw
    app.use(cors(corsOptions));

    // Enable req.body json data
    app.use(express.json());

    // Use Route APIs V1
    app.use('/v1', APIs_V1);

    app.listen(env.PORT, env.HOSTNAME, () => {
        console.log(`3. ✅ Local DEV: Back-end Server is running successfully at http://${env.HOSTNAME}:${env.PORT}/`);
    });
};

// Chỉ khi kết nối Database thành công thì mới Start Server Back-end lên.
(async () => {
    try {
        console.log('1. Connecting to MongoDB Cloud Atlas...');
        await CONNECT_DB(); // 2. Kết nối thành công
        // Khởi động Server Back-end sau khi Connect Database thành công
        START_SERVER(); // 3. Start Server thành công
    } catch (error) {
        console.error(error);
        process.exit(0);
    }
})();

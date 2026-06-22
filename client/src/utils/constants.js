/* eslint-disable no-undef */
// export const API_ROOT = 'http://localhost:8017';

let apiRoot = '';
if (process.env.BUILD_MODE === 'production') {
    apiRoot = 'https://smartkindly-api.onrender.com';
}
if (process.env.BUILD_MODE === 'dev') {
    apiRoot = 'http://localhost:8017';
}
console.log('BUILD_MODE:', process.env.BUILD_MODE);
export const API_ROOT = apiRoot;

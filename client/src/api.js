import axios from 'axios';

const isProduction = import.meta.env.PROD;
// Di production (Vercel), backend ada di /api
// Di local, kita pake proxy /api -> localhost:3001
// PENTING: BaseURL harus '/api' biar rewrite di vercel.json jalan.

const api = axios.create({
  baseURL: '/api',
});

export default api;
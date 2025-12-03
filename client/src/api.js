import axios from 'axios';

const api = axios.create({
  // Gunakan relative path '/api' supaya otomatis ikut domain (baik localhost maupun hosting)
  // Di localhost, vite.config.js yang akan nge-proxy '/api' ke port 3001
  baseURL: '/api',
});

export default api;
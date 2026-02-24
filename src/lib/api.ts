import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api/v1',

    timeout: 30000,
    withCredentials: true, // Required for BetterAuth session cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8082/api/';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    register: (data) => api.post('auth/register', data),
    login: (data) => api.post('auth/login', data),
    verifyOtp: (data) => api.post('auth/verify-otp', data),
    forgotPassword: (data) => api.post('auth/forgot-password', data),
    resetPassword: (data) => api.post('auth/reset-password', data),
};

export const userService = {
    getProfile: () => api.get('user/profile'),
    updateProfile: (data) => api.put('user/profile', data),
};

export const deviceService = {
    getDevices: () => api.get('devices'),
    addDevice: (data) => api.post('devices', data),
    updateDevice: (id, data) => api.put(`devices/${id}`, data),
    toggleDevice: (id) => api.put(`devices/${id}/toggle`),
    updatePower: (id, watts) => api.put(`devices/${id}/power`, { watts }),
    deleteDevice: (id) => api.delete(`devices/${id}`),
};

export const energyService = {
    getHistory: (range) => api.get('energy/history', { params: { range } }),
    getComparison: () => api.get('energy/comparison'),
    getSummary: (range) => api.get('energy/summary', { params: { range } }),
    downloadReport: () => api.get('energy/report', { responseType: 'blob' }),
};

export const scheduleService = {
    getSchedules: () => api.get('schedules'),
    createSchedule: (data) => api.post('schedules', data),
    deleteSchedule: (id) => api.delete(`schedules/${id}`),
};

export const adminService = {
    getPolicies: () => api.get('admin/policies'),
    updatePolicy: (data) => api.post('admin/policies', data),
};

export const recommendationService = {
    getRecommendations: () => api.get('recommendations'),
    refreshRecommendations: () => api.post('recommendations/refresh'),
};

export default api;

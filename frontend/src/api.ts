import axios from 'axios';

const baseURL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

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

export const register = async (data: { name: string; email: string; password: string }) => {
  try {
    const response = await api.post('/auth/register', data);
    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.response?.data?.error || 'Failed to register');
  }
};

export const login = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post('/auth/login', data);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.error || 'Failed to login');
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile');
    return response;
  } catch (error: any) {
    console.error('Get profile error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch profile');
  }
};

export const updateUserProfile = async (data: { name?: string; email?: string; password?: string }) => {
  try {
    const response = await api.put('/user/profile', data);
    return response;
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.response?.data?.error || 'Failed to update profile');
  }
};

export const createTestResult = async (formData: FormData) => {
  try {
    const response = await api.post('/tests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  } catch (error: any) {
    console.error('Create test result error:', error);
    console.log(error.response?.data);
    throw new Error(error.response?.data?.error || 'Failed to create test result');
  }
};

export const getTestHistory = async () => {
  try {
    const response = await api.get('/tests');
    return response;
  } catch (error: any) {
    console.error('Get test history error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch test history');
  }
};

export const getTestResult = async (id: string) => {
  try {
    const response = await api.get(`/tests/${id}`);
    return response;
  } catch (error: any) {
    console.error('Get test result error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch test result');
  }
};

export default api;
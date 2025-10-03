// src/axiosConfig.js
import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: 'http://localhost:8080', // Your backend URL
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
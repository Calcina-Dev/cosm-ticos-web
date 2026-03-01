import axios from 'axios';

// Use relative path to leverage Next.js rewrites
const baseURL = '/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // If using cookies
});

// Request interceptor to add token if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storageItem = localStorage.getItem('auth-storage');
    if (storageItem) {
      try {
        const { state } = JSON.parse(storageItem);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
        if (state?.companyId) {
          config.headers['x-company-id'] = state.companyId;
        }
        if (state?.branchId) {
          config.headers['x-branch-id'] = state.branchId;
        }
      } catch (e) {
        console.error("Error parsing auth storage", e);
      }
    }
  }
  return config;
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      if (typeof window !== 'undefined') {
        // window.location.href = '/login'; // Optional: Redirect logic
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

import axios from "axios";

// Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Track if a token refresh is in progress
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor: Attach access token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loop on refresh endpoint
      if (originalRequest.url?.includes("/auth/refresh/")) {
        handleLogout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          // Use vanilla axios to avoid interceptor loop
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;

          // Save new access token
          localStorage.setItem("accessToken", access);

          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;

          // Process all queued requests with new token
          processQueue(null, access);
          isRefreshing = false;

          // Retry the original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh token failed - clear queue and logout
          processQueue(refreshError, null);
          isRefreshing = false;
          handleLogout();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available - logout user
        isRefreshing = false;
        handleLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to logout user
const handleLogout = () => {
  // Clear tokens from localStorage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  // Redirect to login page
  window.location.href = "/login";
};

export default axiosInstance;

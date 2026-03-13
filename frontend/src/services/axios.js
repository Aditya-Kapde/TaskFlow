import axios from "axios";

// ─── Create axios instance ─────────────────────────────────────
// All API calls go through this instance — never use plain axios
// directly in the app. This ensures every request gets the
// interceptors applied automatically.
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // Required to send/receive httpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ───────────────────────────────────────
// Runs before every request leaves the browser
// Reads the access token from memory and attaches it to the header
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────
// Runs after every response comes back
// If we get a 401, the access token has expired
// We silently refresh it and retry the original request
let isRefreshing = false;
let failedRequestsQueue = [];

// isRefreshing flag prevents multiple simultaneous refresh calls
// if several requests fail at the same time (race condition fix)
// failedRequestsQueue holds all failed requests while refresh
// is in progress — they all retry once the new token arrives

axiosInstance.interceptors.response.use(
  // Success — just return the response as-is
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ── Check if this is a 401 and not already retried ─────────
    // _retry flag prevents infinite retry loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      // ── If a refresh is already in progress ────────────────────
      // Queue this request and resolve it once the token arrives
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // ── Start the refresh process ──────────────────────────────
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint — the httpOnly cookie is sent
        // automatically by the browser (withCredentials: true)
        const response = await axiosInstance.post("/auth/refresh");
        const newAccessToken = response.data.data.accessToken;

        // Store the new access token
        localStorage.setItem("accessToken", newAccessToken);

        // Update default header for future requests
        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;

        // Resolve all queued requests with the new token
        failedRequestsQueue.forEach((req) => req.resolve(newAccessToken));
        failedRequestsQueue = [];

        // Retry the original request that triggered the refresh
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token also expired or invalid
        // Reject all queued requests and force logout
        failedRequestsQueue.forEach((req) => req.reject(refreshError));
        failedRequestsQueue = [];

        // Clear local storage and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
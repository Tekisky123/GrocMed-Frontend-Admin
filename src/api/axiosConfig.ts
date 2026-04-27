import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = "https://groc-med-backend.vercel.app"

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor for adding the bearer token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("grocmed_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || "Something went wrong";

        // Handle specific status codes
        if (error.response?.status === 401) {
            // Unauthorized - clear storage and redirect to login if not already there
            localStorage.removeItem("grocmed_token");
            localStorage.removeItem("auth_user");
            localStorage.removeItem("auth_login_time");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        toast.error(message);
        return Promise.reject(error);
    }
);

export default axiosInstance;

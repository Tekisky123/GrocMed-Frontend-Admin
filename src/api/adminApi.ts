import axiosInstance from "./axiosConfig";

export const adminApi = {
    loginAdmin: async (data: any) => {
        const response = await axiosInstance.post("/api/admin/loginAdmin", data);
        return response.data;
    },
    createAdmin: async (data: any) => {
        const response = await axiosInstance.post("/api/admin/createAdmin", data);
        return response.data;
    },
    getAllAdmins: async () => {
        const response = await axiosInstance.get("/api/admin/getAllAdmins");
        return response.data;
    },
    getAdminById: async (id: string) => {
        const response = await axiosInstance.get(`/api/admin/getAdminById/${id}`);
        return response.data;
    },
    updateAdmin: async (id: string, data: any) => {
        const response = await axiosInstance.put(`/api/admin/updateAdmin/${id}`, data);
        return response.data;
    },
    deleteAdmin: async (id: string) => {
        const response = await axiosInstance.delete(`/api/admin/deleteAdmin/${id}`);
        return response.data;
    },
    // Custom Notifications
    getAllNotifications: async (params?: any) => {
        const response = await axiosInstance.get("/api/admin/notification/all", { params });
        return response.data;
    },
    getNotificationById: async (id: string) => {
        const response = await axiosInstance.get(`/api/admin/notification/${id}`);
        return response.data;
    },
    sendNotification: async (data: { title: string; message: string; target: string }) => {
        const response = await axiosInstance.post("/api/admin/notification/send", data);
        return response.data;
    },
};

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
    // Global Settings
    getSettings: async () => {
        const response = await axiosInstance.get('/api/admin/settings');
        return response.data;
    },
    updateSettings: async (data: any) => {
        const response = await axiosInstance.put('/api/admin/settings', data);
        return response.data;
    },
    uploadPaymentQr: async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axiosInstance.post('/api/admin/settings/payment-qr', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    deletePaymentQr: async () => {
        const response = await axiosInstance.delete('/api/admin/settings/payment-qr');
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
    // Data Backup Exports
    exportProducts: async () => {
        const response = await axiosInstance.get("/api/admin/exportProducts", { responseType: 'blob' });
        return response.data;
    },
    exportOrders: async () => {
        const response = await axiosInstance.get("/api/admin/exportOrders", { responseType: 'blob' });
        return response.data;
    },
    exportCustomers: async () => {
        const response = await axiosInstance.get("/api/admin/exportCustomers", { responseType: 'blob' });
        return response.data;
    },
    exportDatabaseBackup: async () => {
        const response = await axiosInstance.get("/api/admin/backup/export", { responseType: 'blob' });
        return response.data;
    },
    restoreDatabaseBackup: async (backupData: any) => {
        const response = await axiosInstance.post("/api/admin/backup/restore", backupData);
        return response.data;
    },
    // Pincode Management
    getAllPincodes: async (params?: { limit?: number; search?: string }) => {
        const response = await axiosInstance.get("/api/admin/pincodes", { params });
        return response.data;
    },
    createPincode: async (data: { pincode: string; deliveryNote?: string; isActive?: boolean }) => {
        const response = await axiosInstance.post("/api/admin/pincodes", data);
        return response.data;
    },
    updatePincode: async (id: string, data: { pincode?: string; deliveryNote?: string; isActive?: boolean }) => {
        const response = await axiosInstance.put(`/api/admin/pincodes/${id}`, data);
        return response.data;
    },
    togglePincode: async (id: string) => {
        const response = await axiosInstance.patch(`/api/admin/pincodes/${id}/toggle`);
        return response.data;
    },
    deletePincode: async (id: string) => {
        const response = await axiosInstance.delete(`/api/admin/pincodes/${id}`);
        return response.data;
    },
    sendWhatsAppCampaign: async (data: { campaignName: string; templateParams?: string[]; targetAudience: string; specificNumbers?: string }) => {
        const response = await axiosInstance.post("/api/admin/notification/send-whatsapp-campaign", data);
        return response.data;
    },
};

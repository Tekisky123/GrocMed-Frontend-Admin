import axiosInstance from "./axiosConfig";

export const deliveryPartnerApi = {
    // Get all delivery partners
    getAllPartners: async () => {
        const response = await axiosInstance.get("/api/admin/deliveryPartner/getAllDeliveryPartners");
        return response.data;
    },

    // Get delivery partner by ID
    getPartnerById: async (id: string) => {
        const response = await axiosInstance.get(`/api/admin/deliveryPartner/getDeliveryPartnerById/${id}`);
        return response.data;
    },

    // Create new delivery partner
    createPartner: async (data: any) => {
        const response = await axiosInstance.post("/api/admin/deliveryPartner/createDeliveryPartner", data);
        return response.data;
    },

    // Update delivery partner
    updatePartner: async (id: string, data: any) => {
        const response = await axiosInstance.put(`/api/admin/deliveryPartner/updateDeliveryPartner/${id}`, data);
        return response.data;
    },

    // Delete delivery partner
    deletePartner: async (id: string) => {
        const response = await axiosInstance.delete(`/api/admin/deliveryPartner/deleteDeliveryPartner/${id}`);
        return response.data;
    },

    // Update partner status
    updatePartnerStatus: async (id: string, status: string) => {
        const response = await axiosInstance.patch(`/api/admin/deliveryPartner/updateStatus/${id}`, { status });
        return response.data;
    },
};

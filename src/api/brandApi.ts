import axiosInstance from "./axiosConfig";

export interface Brand {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const brandApi = {
    getAllBrands: async () => {
        const response = await axiosInstance.get("/api/brand/getAllBrands");
        return response.data;
    },
    getAllBrandsAdmin: async () => {
        const response = await axiosInstance.get("/api/brand/admin/getAllBrands");
        return response.data;
    },
    createBrand: async (data: { name: string; description?: string; isActive?: boolean }) => {
        const response = await axiosInstance.post("/api/brand/admin", data);
        return response.data;
    },
    updateBrand: async (id: string, data: { name?: string; description?: string; isActive?: boolean }) => {
        const response = await axiosInstance.put(`/api/brand/admin/${id}`, data);
        return response.data;
    },
    deleteBrand: async (id: string) => {
        const response = await axiosInstance.delete(`/api/brand/admin/${id}`);
        return response.data;
    },
};

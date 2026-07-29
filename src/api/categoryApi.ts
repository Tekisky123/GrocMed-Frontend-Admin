import axiosInstance from "./axiosConfig";

export interface CategoryAdminResponse {
    _id: string;
    name: string;
    image?: string;
    isActive: boolean;
    productCount: number;
    createdAt?: string;
    updatedAt?: string;
}

export const categoryApi = {
    getAllCategories: async () => {
        const response = await axiosInstance.get("/api/category/getAllCategories");
        return response.data;
    },
    getAllCategoriesAdmin: async () => {
        const response = await axiosInstance.get("/api/category/admin/getAllCategories");
        return response.data;
    },
    createCategory: async (formData: FormData) => {
        const response = await axiosInstance.post("/api/category/admin", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
    updateCategory: async (id: string, formData: FormData) => {
        const response = await axiosInstance.put(`/api/category/admin/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
    deleteCategory: async (id: string) => {
        const response = await axiosInstance.delete(`/api/category/admin/${id}`);
        return response.data;
    },
};

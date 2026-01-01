import axiosInstance from "./axiosConfig";

export const productApi = {
    createProduct: async (formData: FormData) => {
        const response = await axiosInstance.post("/api/product/createProduct", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
    getAllProducts: async () => {
        const response = await axiosInstance.get("/api/product/getAllProducts");
        return response.data;
    },
    getAllProductsForAdmin: async () => {
        const response = await axiosInstance.get("/api/product/getAllProductsForAdmin");
        return response.data;
    },
    getProductById: async (id: string) => {
        const response = await axiosInstance.get(`/api/product/getProductById/${id}`);
        return response.data;
    },
    getProductByIdForAdmin: async (id: string) => {
        const response = await axiosInstance.get(`/api/product/getProductByIdForAdmin/${id}`);
        return response.data;
    },
    updateProduct: async (id: string, formData: FormData) => {
        const response = await axiosInstance.put(`/api/product/updateProduct/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
    deleteProduct: async (id: string) => {
        const response = await axiosInstance.delete(`/api/product/deleteProduct/${id}`);
        return response.data;
    },
    deleteProductImage: async (id: string, imageUrl: string) => {
        const response = await axiosInstance.delete(`/api/product/deleteProductImage/${id}`, {
            data: { imageUrl },
        });
        return response.data;
    },
};

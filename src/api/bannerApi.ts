import axiosInstance from "./axiosConfig";

export const bannerApi = {
  getBanners: async () => {
    const response = await axiosInstance.get("/api/banners/admin");
    return response.data;
  },
  createBanner: async (data: any) => {
    const response = await axiosInstance.post("/api/banners", data);
    return response.data;
  },
  updateBanner: async (id: string, data: any) => {
    const response = await axiosInstance.put(`/api/banners/${id}`, data);
    return response.data;
  },
  deleteBanner: async (id: string) => {
    const response = await axiosInstance.delete(`/api/banners/${id}`);
    return response.data;
  },
};

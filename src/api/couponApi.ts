import axiosInstance from "./axiosConfig";

export interface CouponData {
  _id?: string;
  code: string;
  discountAmount: number;
  minOrderAmount?: number;
  validFrom?: string;
  validUntil: string;
  usageLimit?: number;
  perUserLimit?: number;
  usedCount?: number;
  isActive?: boolean;
  status?: 'Active' | 'Inactive' | 'Expired' | 'Depleted';
  createdAt?: string;
}

export const couponApi = {
  getAllCoupons: async () => {
    const response = await axiosInstance.get("/api/admin/coupons/all");
    return response.data;
  },
  createCoupon: async (data: Partial<CouponData>) => {
    const response = await axiosInstance.post("/api/admin/coupons/create", data);
    return response.data;
  },
  toggleCouponStatus: async (id: string) => {
    const response = await axiosInstance.put(`/api/admin/coupons/toggle/${id}`);
    return response.data;
  },
  deleteCoupon: async (id: string) => {
    const response = await axiosInstance.delete(`/api/admin/coupons/${id}`);
    return response.data;
  },
};

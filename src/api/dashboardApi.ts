import axiosInstance from "./axiosConfig";

export const dashboardApi = {
    // Get dashboard statistics
    getDashboardStats: async () => {
        const response = await axiosInstance.get("/api/admin/dashboard/stats");
        return response.data;
    },

    // Download sales report
    downloadSalesReport: async () => {
        const response = await axiosInstance.get("/api/admin/report/sales", {
            responseType: 'blob', // Important for binary data
        });
        return response.data;
    },
};

// Type definitions for dashboard data
export interface SalesPerformanceData {
    date: string;
    revenue: number;
    orders: number;
}

export interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalDeliveryPartners: number;
    salesPerformance: SalesPerformanceData[];
}

export interface DashboardResponse {
    success: boolean;
    message: string;
    data: DashboardStats;
}

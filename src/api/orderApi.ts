import axiosInstance from "./axiosConfig";

export const orderApi = {
    // Get all orders
    getAllOrders: async () => {
        const response = await axiosInstance.get("/api/admin/order/getAllOrders");
        return response.data;
    },

    // Search orders by query (ID, customer name, or phone)
    searchOrders: async (query: string) => {
        const response = await axiosInstance.get(`/api/admin/order/search?query=${encodeURIComponent(query)}`);
        return response.data;
    },

    // Get order by ID
    getOrderById: async (id: string) => {
        const response = await axiosInstance.get(`/api/admin/order/getOrderById/${id}`);
        return response.data;
    },

    // Update order status (triggers notification)
    updateOrderStatus: async (id: string, status: string, deliveryPartnerId?: string, cancellationReason?: string) => {
        const response = await axiosInstance.put(`/api/admin/order/updateStatus/${id}`, { status, deliveryPartnerId, cancellationReason });
        return response.data;
    },

    // Download order invoice PDF from backend
    downloadInvoice: async (id: string) => {
        const response = await axiosInstance.get(`/api/order/${id}/invoice`, {
            responseType: 'blob'
        });
        return response.data;
    },
};

// Type definitions for orders
export interface Order {
    _id: string;
    customer: {
        _id: string;
        name: string;
        phone: string;
        email?: string;
    };
    deliveryPartner?: {
        _id: string;
        name: string;
        phone: string;
        email?: string;
    };
    items: Array<{
        product: string;
        name: string;
        quantity: number;
        price: number;
        image?: string;
        _id: string;
    }>;
    totalAmount: number;
    taxAmount?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    orderStatus: 'Placed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
    cancellationReason?: string;
    paymentMethod: string;
    paymentStatus: string;
    shippingAddress: string; // JSON string that needs to be parsed
    trackingHistory: Array<{
        status: string;
        timestamp: string;
        description?: string;
        _id: string;
    }>;
    codCollectionDetails?: {
        method: string;
        collectedAt?: string;
        paymentScreenshot?: string;
        cashAmount?: number;
        onlineAmount?: number;
    };
    createdAt: string;
    updatedAt: string;
    __v: number;
}

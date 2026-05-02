import axiosInstance from "./axiosConfig";

export const customerApi = {
    // Get all customers
    getAllCustomers: async () => {
        const response = await axiosInstance.get("/api/customer/getAllCustomers");
        return response.data;
    },

    // Search customers by query (name, email, or phone)
    searchCustomers: async (query: string) => {
        const response = await axiosInstance.get(`/api/customer/search?query=${encodeURIComponent(query)}`);
        return response.data;
    },

    // Get customer by ID
    getCustomerById: async (id: string) => {
        const response = await axiosInstance.get(`/api/customer/getCustomerById/${id}`);
        return response.data;
    },

    // Delete customer
    deleteCustomer: async (id: string) => {
        const response = await axiosInstance.delete(`/api/customer/deleteCustomer/${id}`);
        return response.data;
    },
};

// Type definitions for customers
export interface Customer {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profilePicture?: string;
    addresses?: Array<{
        _id: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        type: string; // Home, Work, etc.
        isDefault: boolean;
    }>;
    isActive: boolean;
    shopName?: string;
    licenseNumber?: string;
    adhaar?: string;
    adhaarImage?: string;
    licenseImage?: string;
    fcmToken?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

// Type for detailed customer response with order history
export interface CustomerDetails {
    customer: Customer;
    orders: Array<{
        _id: string;
        totalAmount: number;
        orderStatus: string;
        items: Array<{
            product: string;
            name: string;
            quantity: number;
            price: number;
            _id: string;
        }>;
        createdAt: string;
    }>;
    orderCount: number;
    totalSpent: number;
}

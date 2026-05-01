import axiosInstance from './axiosConfig';

export interface DeliverySlot {
    _id?: string;
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    displayOrder: number;
}

export const deliverySlotApi = {
    getAll: async () => {
        const response = await axiosInstance.get('/api/admin/delivery-slots');
        return response.data;
    },
    create: async (data: DeliverySlot) => {
        const response = await axiosInstance.post('/api/admin/delivery-slots', data);
        return response.data;
    },
    update: async (id: string, data: Partial<DeliverySlot>) => {
        const response = await axiosInstance.put(`/api/admin/delivery-slots/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await axiosInstance.delete(`/api/admin/delivery-slots/${id}`);
        return response.data;
    }
};

export interface SystemSettings {
    minOrderValue: number;
    freeDeliveryThreshold: number;
    deliveryCharge: number;
    maxOrdersPerDay: number;
}

export const settingsApi = {
    get: async () => {
        const response = await axiosInstance.get('/admin/settings');
        return response.data;
    },
    update: async (data: Partial<SystemSettings>) => {
        const response = await axiosInstance.post('/admin/settings', data);
        return response.data;
    }
};

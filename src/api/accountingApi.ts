import axiosInstance from './axiosConfig';

const API_ROUTES = {
    FINANCE: '/api/admin/finance',
    PURCHASES: '/api/admin/purchases',
    INVENTORY: '/api/admin/inventory',
    PAYROLL: '/api/admin/payroll',
    ASSETS: '/api/admin/assets',
    STATUTORY: '/api/admin/statutory',
    GST: '/api/admin/gst',
    REPORTS: '/api/admin/accounting-reports'
};

// ---- Interfaces ----
export interface Ledger {
    _id: string;
    name: string;
    group: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
    subGroup?: string;
    openingBalance: number;
    openingBalanceType: "Dr" | "Cr";
    currentBalance: number;
}

export interface JournalEntry {
    _id: string;
    date: string;
    voucherNo: string;
    type: "Receipt" | "Payment" | "Journal" | "Contra";
    narration: string;
    entries: Array<{
        ledgerId: string | Ledger;
        debit: number;
        credit: number;
    }>;
    totalAmount: number;
    status: "Draft" | "Posted" | "Cancelled";
}

export interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    designation: string;
    baseSalary: number;
    accountNumber: string;
    ifsc: string;
    bankName: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export const accountingApi = {
    // ---- 1. Finance (Cash Book & Bank Book) ----
    getLedgers: async (): Promise<ApiResponse<Record<string, Ledger[]>>> => {
        const response = await axiosInstance.get(`${API_ROUTES.FINANCE}/ledgers`);
        return response.data;
    },
    createLedger: async (data: Partial<Ledger>): Promise<ApiResponse<Ledger>> => {
        const response = await axiosInstance.post(`${API_ROUTES.FINANCE}/ledgers`, data);
        return response.data;
    },
    getJournals: async (page = 1, limit = 50): Promise<ApiResponse<JournalEntry[]>> => {
        const response = await axiosInstance.get(`${API_ROUTES.FINANCE}/journal?page=${page}&limit=${limit}`);
        return response.data;
    },
    createJournalEntry: async (data: Partial<JournalEntry>): Promise<ApiResponse<JournalEntry>> => {
        const response = await axiosInstance.post(`${API_ROUTES.FINANCE}/journal`, data);
        return response.data;
    },

    // ---- 2. Purchases ----
    getPurchases: async () => {
        const response = await axiosInstance.get(API_ROUTES.PURCHASES);
        return response.data;
    },
    createPurchase: async (data: any) => {
        const response = await axiosInstance.post(API_ROUTES.PURCHASES, data);
        return response.data;
    },
    updatePurchaseStatus: async (id: string, status: string) => {
        const response = await axiosInstance.patch(`${API_ROUTES.PURCHASES}/${id}/status`, { status });
        return response.data;
    },
    updatePurchase: async (id: string, data: any) => {
        const response = await axiosInstance.put(`${API_ROUTES.PURCHASES}/${id}`, data);
        return response.data;
    },
    deletePurchase: async (id: string) => {
        const response = await axiosInstance.delete(`${API_ROUTES.PURCHASES}/${id}`);
        return response.data;
    },

    // ---- 4. Inventory (Adjustments) ----
    getAdjustments: async () => {
        const response = await axiosInstance.get(`${API_ROUTES.INVENTORY}/adjustments`);
        return response.data;
    },
    createAdjustment: async (data: any) => {
        const response = await axiosInstance.post(`${API_ROUTES.INVENTORY}/adjust`, data);
        return response.data;
    },

    // ---- 5. GST Module ----
    getGSTReturns: async () => {
        const response = await axiosInstance.get(API_ROUTES.GST);
        return response.data;
    },
    getGSTR1Json: async (period: string) => {
        const response = await axiosInstance.get(`${API_ROUTES.GST}/gstr1-json?period=${period}`);
        return response.data;
    },
    markGSTFiled: async (data: any) => {
        const response = await axiosInstance.post(`${API_ROUTES.GST}/mark-filed`, data);
        return response.data;
    },

    // ---- 6. Payroll ----
    getSalarySlips: async (monthYear: string) => {
        const response = await axiosInstance.get(`${API_ROUTES.PAYROLL}/slips/${monthYear}`);
        return response.data;
    },
    processPayroll: async (data: any) => {
        const response = await axiosInstance.post(`${API_ROUTES.PAYROLL}/process`, data);
        return response.data;
    },
    getEmployees: async () => {
        const response = await axiosInstance.get(`${API_ROUTES.PAYROLL}/employees`);
        return response.data;
    },
    createEmployee: async (data: any) => {
        const response = await axiosInstance.post(`${API_ROUTES.PAYROLL}/employees`, data);
        return response.data;
    },

    // ---- 7. Fixed Assets ----
    getAssets: async () => {
        const response = await axiosInstance.get(API_ROUTES.ASSETS);
        return response.data;
    },
    createAsset: async (data: any) => {
        const response = await axiosInstance.post(API_ROUTES.ASSETS, data);
        return response.data;
    },
    runDepreciation: async () => {
        const response = await axiosInstance.post(`${API_ROUTES.ASSETS}/depreciate`);
        return response.data;
    },

    // ---- 8. Statutory Registers ----
    getShareholders: async () => {
        const response = await axiosInstance.get(`${API_ROUTES.STATUTORY}/members`);
        return response.data;
    },
    createShareholder: async (data: any) => {
        const response = await axiosInstance.post(`${API_ROUTES.STATUTORY}/members`, data);
        return response.data;
    },
    transferShares: async (data: any) => {
        const response = await axiosInstance.post(`${API_ROUTES.STATUTORY}/transfer`, data);
        return response.data;
    },
    getDirectors: async () => {
        const response = await axiosInstance.get(`${API_ROUTES.STATUTORY}/directors`);
        return response.data;
    },
    createDirector: async (data: any) => {
        const response = await axiosInstance.post(`${API_ROUTES.STATUTORY}/directors`, data);
        return response.data;
    },
    getCharges: async () => {
        const response = await axiosInstance.get(`${API_ROUTES.STATUTORY}/charges`);
        return response.data;
    },
    createCharge: async (data: any) => {
        const response = await axiosInstance.post(`${API_ROUTES.STATUTORY}/charges`, data);
        return response.data;
    },

    // ---- 9. Reports ----
    getTrialBalance: async (startDate: string, endDate: string) => {
        const response = await axiosInstance.get(`${API_ROUTES.REPORTS}/trial-balance?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },
    getPnL: async (startDate: string, endDate: string) => {
        const response = await axiosInstance.get(`${API_ROUTES.REPORTS}/pnl?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },
    getBalanceSheet: async (startDate: string, endDate: string) => {
        const response = await axiosInstance.get(`${API_ROUTES.REPORTS}/balance-sheet?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },
    getCashFlow: async (startDate: string, endDate: string) => {
        const response = await axiosInstance.get(`${API_ROUTES.REPORTS}/cash-flow?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    }
};

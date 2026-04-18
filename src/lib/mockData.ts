// Dashboard KPIs
export const dashboardKPIs = {
  totalOrders: 0,
  totalOrdersChange: 0,
  totalRevenue: 0,
  totalRevenueChange: 0,
  activeCustomers: 0,
  activeCustomersChange: 0,
  deliveryPartners: 0,
  deliveryPartnersChange: 0,
};

// Recent Orders
export const recentOrders = [];

// Order statuses
export const orderStatuses = [
  { key: "pending", label: "Pending", color: "bg-yellow-50", badgeColor: "bg-yellow-100" },
  { key: "confirmed", label: "Confirmed", color: "bg-blue-50", badgeColor: "bg-blue-100" },
  { key: "in_transit", label: "In Transit", color: "bg-purple-50", badgeColor: "bg-purple-100" },
  { key: "delivered", label: "Delivered", color: "bg-green-50", badgeColor: "bg-green-100" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-50", badgeColor: "bg-red-100" },
];

// Revenue data (for charts)
export const revenueData = [];

// Product categories
export const productCategories = [];

// Products
export const products = [];

// Customers
export const customers = [];

// Delivery Partners
export const deliveryPartners = [];

// System Alerts
export const systemAlerts = [];

// Admin Users
export const adminUsers = [];

// Dashboard KPIs
export const dashboardKPIs = {
  totalOrders: 1234,
  totalOrdersChange: 12.5,
  totalRevenue: 152435,
  totalRevenueChange: 8.3,
  activeCustomers: 456,
  activeCustomersChange: 23.1,
  deliveryPartners: 89,
  deliveryPartnersChange: 5.2,
};

// Recent Orders
export const recentOrders = [
  {
    id: "ORD-2024-001",
    customerName: "John Doe",
    totalAmount: 235.50,
    status: "delivered",
    date: "2024-01-15",
    items: 3,
    deliveryPartner: "Ahmed Khan",
  },
  {
    id: "ORD-2024-002",
    customerName: "Sarah Johnson",
    totalAmount: 145.75,
    status: "in_transit",
    date: "2024-01-15",
    items: 2,
    deliveryPartner: "Maria Garcia",
  },
  {
    id: "ORD-2024-003",
    customerName: "Michael Chen",
    totalAmount: 89.99,
    status: "pending",
    date: "2024-01-15",
    items: 1,
    deliveryPartner: null,
  },
  {
    id: "ORD-2024-004",
    customerName: "Emily Davis",
    totalAmount: 312.40,
    status: "confirmed",
    date: "2024-01-14",
    items: 5,
    deliveryPartner: "James Wilson",
  },
  {
    id: "ORD-2024-005",
    customerName: "David Kumar",
    totalAmount: 67.80,
    status: "delivered",
    date: "2024-01-14",
    items: 1,
    deliveryPartner: "Ahmad Hassan",
  },
];

// Order statuses
export const orderStatuses = [
  { key: "pending", label: "Pending", color: "bg-yellow-50", badgeColor: "bg-yellow-100" },
  { key: "confirmed", label: "Confirmed", color: "bg-blue-50", badgeColor: "bg-blue-100" },
  { key: "in_transit", label: "In Transit", color: "bg-purple-50", badgeColor: "bg-purple-100" },
  { key: "delivered", label: "Delivered", color: "bg-green-50", badgeColor: "bg-green-100" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-50", badgeColor: "bg-red-100" },
];

// Revenue data (for charts)
export const revenueData = [
  { date: "Jan 1", revenue: 4000, orders: 24 },
  { date: "Jan 2", revenue: 3000, orders: 13 },
  { date: "Jan 3", revenue: 2000, orders: 9 },
  { date: "Jan 4", revenue: 2780, orders: 39 },
  { date: "Jan 5", revenue: 1890, orders: 22 },
  { date: "Jan 6", revenue: 2390, orders: 23 },
  { date: "Jan 7", revenue: 3490, orders: 28 },
  { date: "Jan 8", revenue: 4200, orders: 35 },
  { date: "Jan 9", revenue: 3800, orders: 31 },
  { date: "Jan 10", revenue: 4100, orders: 38 },
  { date: "Jan 11", revenue: 4500, orders: 42 },
  { date: "Jan 12", revenue: 5100, orders: 47 },
];

// Product categories
export const productCategories = [
  { id: 1, name: "Fruits & Vegetables", productCount: 45 },
  { id: 2, name: "Dairy & Eggs", productCount: 32 },
  { id: 3, name: "Groceries", productCount: 120 },
  { id: 4, name: "Medicines", productCount: 200 },
  { id: 5, name: "Health Supplements", productCount: 78 },
];

// Products
export const products = [
  {
    id: "PROD-001",
    name: "Organic Apples",
    category: "Fruits & Vegetables",
    price: 5.99,
    stock: 250,
    status: "active",
    reorderLevel: 50,
  },
  {
    id: "PROD-002",
    name: "Fresh Milk (1L)",
    category: "Dairy & Eggs",
    price: 2.49,
    stock: 180,
    status: "active",
    reorderLevel: 100,
  },
  {
    id: "PROD-003",
    name: "Whole Wheat Bread",
    category: "Groceries",
    price: 1.99,
    stock: 45,
    status: "low_stock",
    reorderLevel: 60,
  },
  {
    id: "PROD-004",
    name: "Aspirin Tablets",
    category: "Medicines",
    price: 3.99,
    stock: 5,
    status: "critical",
    reorderLevel: 20,
  },
  {
    id: "PROD-005",
    name: "Vitamin C Powder",
    category: "Health Supplements",
    price: 12.99,
    stock: 120,
    status: "active",
    reorderLevel: 40,
  },
];

// Customers
export const customers = [
  {
    id: "CUST-001",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1-555-0101",
    totalOrders: 24,
    totalSpent: 1250.50,
    lastOrder: "2024-01-15",
    status: "active",
  },
  {
    id: "CUST-002",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1-555-0102",
    totalOrders: 18,
    totalSpent: 890.75,
    lastOrder: "2024-01-14",
    status: "active",
  },
  {
    id: "CUST-003",
    name: "Michael Chen",
    email: "michael@example.com",
    phone: "+1-555-0103",
    totalOrders: 12,
    totalSpent: 456.20,
    lastOrder: "2024-01-12",
    status: "inactive",
  },
  {
    id: "CUST-004",
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "+1-555-0104",
    totalOrders: 31,
    totalSpent: 2145.80,
    lastOrder: "2024-01-15",
    status: "active",
  },
];

// Delivery Partners
export const deliveryPartners = [
  {
    id: "DP-001",
    name: "Ahmed Khan",
    phone: "+1-555-0201",
    email: "ahmed@delivery.com",
    vehicle: "Motorcycle",
    rating: 4.8,
    completedDeliveries: 342,
    status: "active",
    currentOrders: 3,
  },
  {
    id: "DP-002",
    name: "Maria Garcia",
    phone: "+1-555-0202",
    email: "maria@delivery.com",
    vehicle: "Bicycle",
    rating: 4.9,
    completedDeliveries: 256,
    status: "active",
    currentOrders: 1,
  },
  {
    id: "DP-003",
    name: "James Wilson",
    phone: "+1-555-0203",
    email: "james@delivery.com",
    vehicle: "Car",
    rating: 4.6,
    completedDeliveries: 198,
    status: "inactive",
    currentOrders: 0,
  },
  {
    id: "DP-004",
    name: "Ahmad Hassan",
    phone: "+1-555-0204",
    email: "ahmad@delivery.com",
    vehicle: "Motorcycle",
    rating: 4.7,
    completedDeliveries: 215,
    status: "active",
    currentOrders: 2,
  },
];

// Offers & Coupons
export const offers = [
  {
    id: "OFFER-001",
    code: "FRESH50",
    description: "50% off on fresh vegetables",
    discountType: "percentage",
    discountValue: 50,
    minOrderValue: 25,
    maxUses: 500,
    usedCount: 234,
    validFrom: "2024-01-01",
    validUntil: "2024-01-31",
    status: "active",
  },
  {
    id: "OFFER-002",
    code: "WELCOME20",
    description: "20% off for new customers",
    discountType: "percentage",
    discountValue: 20,
    minOrderValue: 0,
    maxUses: 1000,
    usedCount: 567,
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    status: "active",
  },
  {
    id: "OFFER-003",
    code: "SAVE10",
    description: "$10 off on orders above $50",
    discountType: "fixed",
    discountValue: 10,
    minOrderValue: 50,
    maxUses: 300,
    usedCount: 145,
    validFrom: "2024-01-10",
    validUntil: "2024-01-25",
    status: "inactive",
  },
];

// System Alerts
export const systemAlerts = [
  {
    id: "ALERT-001",
    type: "warning",
    title: "Low Stock Alert",
    message: "Product 'Aspirin Tablets' is running low (5 units)",
    timestamp: "2024-01-15T14:30:00Z",
    read: false,
  },
  {
    id: "ALERT-002",
    type: "info",
    title: "New Order Received",
    message: "Order ORD-2024-003 received from Michael Chen",
    timestamp: "2024-01-15T14:25:00Z",
    read: false,
  },
  {
    id: "ALERT-003",
    type: "success",
    title: "Delivery Completed",
    message: "Order ORD-2024-001 delivered by Ahmed Khan",
    timestamp: "2024-01-15T14:15:00Z",
    read: true,
  },
];

// Admin Users
export const adminUsers = [
  {
    id: "ADMIN-001",
    name: "Alice Thompson",
    email: "alice@grocmed.com",
    role: "admin",
    permissions: ["read", "write", "delete", "manage_users"],
    status: "active",
    lastLogin: "2024-01-15T14:30:00Z",
  },
  {
    id: "ADMIN-002",
    name: "Bob Martinez",
    email: "bob@grocmed.com",
    role: "manager",
    permissions: ["read", "write"],
    status: "active",
    lastLogin: "2024-01-15T10:00:00Z",
  },
  {
    id: "ADMIN-003",
    name: "Charlie Davis",
    email: "charlie@grocmed.com",
    role: "operator",
    permissions: ["read"],
    status: "inactive",
    lastLogin: "2024-01-10T08:30:00Z",
  },
];

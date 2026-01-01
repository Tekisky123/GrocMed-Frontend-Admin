import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart,
  TrendingUp,
  Users,
  Truck,
  ArrowUpRight,
} from "lucide-react";
import { dashboardKPIs, revenueData, recentOrders, orderStatuses } from "@/lib/mockData";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const getStatusStyle = (status: string) => {
    const statusInfo = orderStatuses.find(s => s.key === status);
    return statusInfo ? statusInfo.badgeColor : "bg-gray-100";
  };

  const getStatusLabel = (status: string) => {
    const statusInfo = orderStatuses.find(s => s.key === status);
    return statusInfo ? statusInfo.label : status;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Platform Overview</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-white font-normal rounded-2xl h-11 px-6 shadow-lg shadow-accent/20 transition-all active:scale-95">
          Download Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Orders */}
        <Card className="p-5 sm:p-6 border-none shadow-sm hover:shadow-md transition-all rounded-3xl bg-white group ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
              <span className="text-xs font-normal">+{dashboardKPIs.totalOrdersChange}%</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs font-normal uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-2xl sm:text-3xl font-normal text-gray-900">{dashboardKPIs.totalOrders.toLocaleString()}</p>
        </Card>

        {/* Revenue */}
        <Card className="p-5 sm:p-6 border-none shadow-sm hover:shadow-md transition-all rounded-3xl bg-white group ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
              <span className="text-xs font-normal">+{dashboardKPIs.totalRevenueChange}%</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs font-normal uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-2xl sm:text-3xl font-normal text-gray-900">
            ₹{(dashboardKPIs.totalRevenue / 1000).toFixed(1)}k
          </p>
        </Card>

        {/* Active Customers */}
        <Card className="p-5 sm:p-6 border-none shadow-sm hover:shadow-md transition-all rounded-3xl bg-white group ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
              <span className="text-xs font-normal">+{dashboardKPIs.activeCustomersChange}%</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs font-normal uppercase tracking-widest mb-1">Customers</p>
          <p className="text-2xl sm:text-3xl font-normal text-gray-900">{dashboardKPIs.activeCustomers.toLocaleString()}</p>
        </Card>

        {/* Delivery Partners */}
        <Card className="p-5 sm:p-6 border-none shadow-sm hover:shadow-md transition-all rounded-3xl bg-white group ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Truck className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
              <span className="text-xs font-normal">+{dashboardKPIs.deliveryPartnersChange}%</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs font-normal uppercase tracking-widest mb-1">Partners</p>
          <p className="text-2xl sm:text-3xl font-normal text-gray-900">{dashboardKPIs.deliveryPartners.toLocaleString()}</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-5 sm:p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
          <div className="mb-8">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Growth Analytics</h3>
            <p className="text-sm text-gray-400 font-normal mt-1">Daily revenue and order performance</p>
          </div>
          <div className="h-[300px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "16px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    padding: "12px",
                  }}
                  itemStyle={{ fontWeight: 800, fontSize: "14px" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Orders - Restored */}
        <Card className="lg:col-span-2 p-5 sm:p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Activity</h3>
            </div>
            <Link to="/orders" className="text-[10px] font-normal text-primary hover:underline uppercase tracking-widest">
              View All Orders
            </Link>
          </div>
          <div className="overflow-x-auto -mx-5 sm:-mx-8">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-5 py-4 text-left text-[10px] font-normal text-gray-400 uppercase tracking-widest">Order ID</th>
                  <th className="px-5 py-4 text-left text-[10px] font-normal text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-5 py-4 text-left text-[10px] font-normal text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-5 py-4 text-left text-[10px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-right text-[10px] font-normal text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="px-5 py-4 text-sm font-normal text-gray-600">{order.id}</td>
                    <td className="px-5 py-4 text-sm font-normal text-gray-900">{order.customerName}</td>
                    <td className="px-5 py-4 text-sm font-normal text-gray-900">₹{order.totalAmount.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={`${getStatusStyle(order.status)} text-[10px] font-normal px-2.5 py-0.5 rounded-lg border-none`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

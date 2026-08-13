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
  Package,
  Star,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboardApi";
import { toast } from "sonner";
import { useState } from "react";
import { Download } from "lucide-react";
import { exportToCSV, exportToExcel } from "@/utils/exportUtils";
import { formatDateDDMMYYYY } from "@/utils/dateUtils";
import { ReportDownloadModal, DateRangeFilter } from "@/components/ui/ReportDownloadModal";

const Dashboard = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Fetch dashboard stats using React Query
  const { data: dashboardData, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getDashboardStats,
    refetchInterval: 60000, // Refetch every minute
  });

  const stats = dashboardData?.data;

  // Handle report download with date range filter
  const handleGenerateReport = async ({ startDate, endDate }: DateRangeFilter) => {
    try {
      setIsDownloading(true);
      toast.loading('Generating sales report...', { id: 'dash-export' });

      const sDateStr = startDate ? startDate.toISOString() : undefined;
      const eDateStr = endDate ? endDate.toISOString() : undefined;

      const blobData = await dashboardApi.downloadSalesReport(sDateStr, eDateStr);
      const filename = `Sales_Report_${new Date().toISOString().split('T')[0]}`;
      exportToExcel(blobData, filename);

      toast.success('Comprehensive Sales report downloaded successfully!', { id: 'dash-export' });
    } catch (error) {
      console.error('Download error, falling back to CSV export:', error);
      // Fallback CSV export
      try {
        let sales = stats?.salesPerformance || [];
        if (startDate || endDate) {
          sales = sales.filter((item: any) => {
            const itemDate = new Date(item.date);
            if (isNaN(itemDate.getTime())) return false;
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            return true;
          });
        }

        const csvData = sales.map((item: any) => ({
          Date: formatDateDDMMYYYY(item.date),
          "Revenue (₹)": item.revenue || 0,
          "Orders Count": item.orders || 0,
        }));

        csvData.push({
          Date: "AGGREGATE METRICS",
          "Revenue (₹)": stats?.totalRevenue || 0,
          "Orders Count": stats?.totalOrders || 0,
        });

        exportToCSV(csvData, `Dashboard_Sales_Report_${new Date().toISOString().split('T')[0]}`);
        toast.success(`Sales report exported as CSV!`, { id: 'dash-export' });
      } catch (fallbackErr) {
        toast.error('Failed to download report. Please try again.', { id: 'dash-export' });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-normal text-gray-500 uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center border-none shadow-lg rounded-3xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">
            {error instanceof Error ? error.message : 'An error occurred while fetching dashboard data'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 text-white font-normal rounded-2xl"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <Button
          onClick={() => setShowReportModal(true)}
          disabled={isDownloading}
          className="bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-500/90 text-white font-normal rounded-2xl h-11 px-6 shadow-lg shadow-accent/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </>
          )}
        </Button>
      </div>

      {/* KPI Cards with Gradients */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Orders */}
        <Card className="p-5 sm:p-6 border-none shadow-lg hover:shadow-xl transition-all rounded-3xl bg-gradient-to-br from-green-50 via-white to-green-50/30 group ring-1 ring-green-100">
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/30">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Orders</p>
          <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">{stats?.totalOrders.toLocaleString() || 0}</p>
        </Card>

        {/* Revenue */}
        <Card className="p-5 sm:p-6 border-none shadow-lg hover:shadow-xl transition-all rounded-3xl bg-gradient-to-br from-orange-50 via-white to-orange-50/30 group ring-1 ring-orange-100">
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-accent/30">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-accent to-orange-600 bg-clip-text text-transparent">
            ₹{((stats?.totalRevenue || 0) / 1000).toFixed(1)}k
          </p>
        </Card>

        {/* Active Customers */}
        <Card className="p-5 sm:p-6 border-none shadow-lg hover:shadow-xl transition-all rounded-3xl bg-gradient-to-br from-blue-50 via-white to-blue-50/30 group ring-1 ring-blue-100">
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/30">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Happy Customers</p>
          <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">{stats?.totalCustomers.toLocaleString() || 0}</p>
        </Card>

        {/* Delivery Partners */}
        <Card className="p-5 sm:p-6 border-none shadow-lg hover:shadow-xl transition-all rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 group ring-1 ring-indigo-100">
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/30">
              <Truck className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Delivery Team</p>
          <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent">{stats?.totalDeliveryPartners.toLocaleString() || 0}</p>
        </Card>
      </div>

      {/* Charts and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6 sm:p-8 border-none shadow-lg rounded-3xl bg-gradient-to-br from-white via-primary/5 to-white ring-1 ring-gray-100">
          <div className="mb-8">
            <h3 className="text-xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">Sales Performance</h3>
            <p className="text-sm text-gray-500 font-normal mt-1">Your daily revenue trends (Last 7 days)</p>
          </div>
          <div className="h-[300px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesPerformance || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
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
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
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
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  }}
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


      </div>
      <ReportDownloadModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Export Dashboard Sales Report"
        description="Select date range (Daily, Weekly, Monthly, Yearly, All or Custom) to download sales metrics."
        onGenerate={handleGenerateReport}
      />
    </div>
  );
};

export default Dashboard;

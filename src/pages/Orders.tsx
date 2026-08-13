import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  ChevronRight,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Download,
} from "lucide-react";
import { orderApi, Order } from "@/api/orderApi";
import { deliveryPartnerApi } from "@/api/deliveryPartnerApi";
import { deliverySlotApi } from "@/api/deliverySlotApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { downloadOrderInvoicePDF } from "@/utils/exportOrderPdfUtils";
import { exportToCSV } from "@/utils/exportUtils";
import { formatDateDDMMYYYY } from "@/utils/dateUtils";
import { ReportDownloadModal, DateRangeFilter } from "@/components/ui/ReportDownloadModal";

const safeFormatDate = (dateVal: any, formatStr: string) => {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, formatStr);
  } catch (e) {
    return "N/A";
  }
};

const getDeliveredTime = (order: Order) => {
  if (order.orderStatus !== "Delivered") return null;
  const track = order.trackingHistory?.find(t => t.status === "Delivered");
  if (track?.timestamp) {
    return safeFormatDate(track.timestamp, "dd/MM/yyyy hh:mm a");
  }
  if (order.updatedAt) {
    return safeFormatDate(order.updatedAt, "dd/MM/yyyy hh:mm a");
  }
  return null;
};

const getSlotTimingText = (slotVal?: string, slotsList: any[] = []) => {
  if (!slotVal) return "";
  if (slotVal.includes(":") || slotVal.includes("AM") || slotVal.includes("PM")) {
    return slotVal;
  }
  const matched = slotsList.find(s => s.name?.toLowerCase() === slotVal.toLowerCase() || s._id === slotVal);
  if (matched && matched.startTime && matched.endTime) {
    return `${matched.startTime} - ${matched.endTime}`;
  }
  return "";
};

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("Customer Cancelled");
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Fetch all orders
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: orderApi.getAllOrders,
  });

  // Fetch delivery partners
  const { data: partnersResponse } = useQuery({
    queryKey: ['deliveryPartners'],
    queryFn: deliveryPartnerApi.getAllPartners,
  });

  // Fetch delivery slots for timing lookup
  const { data: slotsResponse } = useQuery({
    queryKey: ['deliverySlots'],
    queryFn: deliverySlotApi.getAll,
  });

  const deliveryPartners = (partnersResponse?.data || []).filter((p: any) => p.isActive);
  const deliverySlots = slotsResponse?.data || [];

  const allOrders = ordersResponse?.data || [];

  // Filter orders locally
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order: Order) => {
      const matchesStatus = !statusFilter || order.orderStatus === statusFilter;
      return matchesStatus;
    });
  }, [allOrders, statusFilter]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, deliveryPartnerId, cancellationReason }: { id: string; status: string; deliveryPartnerId?: string | null; cancellationReason?: string }) =>
      orderApi.updateOrderStatus(id, status, deliveryPartnerId || undefined, cancellationReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("Order status updated and customer notified!");
      setShowStatusModal(false);
      setSelectedOrder(null);
      setSelectedPartnerId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const handleStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      updateStatusMutation.mutate({
        id: selectedOrder._id,
        status: newStatus,
        deliveryPartnerId: selectedPartnerId,
        cancellationReason: (newStatus === "Cancelled" || newStatus === "Returned") ? cancellationReason : undefined,
      });
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const response = await orderApi.searchOrders(searchQuery);
        // You can handle search results differently if needed
        toast.success(`Found ${response.count} orders`);
      } catch (error) {
        toast.error("Search failed");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-50 text-green-700 border-green-200";
      case "Out for Delivery": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Shipped": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Packed": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Placed": return "bg-accent/10 text-accent border-accent/20";
      case "Cancelled": return "bg-red-50 text-red-700 border-red-200";
      case "Returned": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleGenerateReport = ({ startDate, endDate }: DateRangeFilter) => {
    toast.loading("Exporting orders...", { id: "orders-export" });

    let targetOrders = allOrders;
    if (startDate || endDate) {
      targetOrders = allOrders.filter((o: Order) => {
        const itemDate = new Date(o.createdAt);
        if (isNaN(itemDate.getTime())) return false;
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    const csvData = targetOrders.map(o => ({
      "Order ID": o._id.substring(o._id.length - 8).toUpperCase(),
      "Shop Name": o.customer?.shopName || "No Shop Name",
      "Customer Name": o.customer?.name || "Walk-in Customer",
      "Customer Phone": o.customer?.phone || "N/A",
      "Order Placed Date": safeFormatDate(o.createdAt, 'dd/MM/yyyy hh:mm a'),
      "Delivery Slot Name": o.deliverySlot || "N/A",
      "Slot Timing": getSlotTimingText(o.deliverySlot, deliverySlots) || "N/A",
      "Slot Date": o.deliveryDate ? safeFormatDate(o.deliveryDate, 'dd/MM/yyyy') : "N/A",
      "Delivered Date & Time": getDeliveredTime(o) || (o.orderStatus === 'Delivered' ? 'Delivered' : 'N/A'),
      "Total Amount": o.totalAmount,
      "Payment Status": o.paymentStatus,
      "Order Status": o.orderStatus || o.status
    }));

    exportToCSV(csvData, "Orders_Report");
    toast.success(`Orders report exported (${csvData.length} records)!`, { id: "orders-export" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "Cancelled": return <XCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Track and manage customer orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary font-normal">
            {filteredOrders.length} Total
          </Badge>
          <Button variant="outline" onClick={() => setShowReportModal(true)} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2 bg-white">
            <Download className="w-4 h-4 text-primary" /> Export Orders
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="p-5 sm:p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
              <Filter className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-black text-gray-900 tracking-tight">Search & Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-7 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by Order ID, customer name, or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 pl-11 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-4">
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => {
                  setStatusFilter(value === "all" ? null : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Placed">Placed</SelectItem>
                  <SelectItem value="Packed">Packed</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSearch}
              className="md:col-span-1 h-12 rounded-2xl bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-500/90 text-white font-normal shadow-lg shadow-accent/30"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[11px] font-normal text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-normal text-primary mt-6 tracking-widest uppercase">Loading Orders...</p>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 font-normal uppercase text-xs tracking-widest">
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order: Order) => (
                  <tr key={order._id} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-mono font-semibold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400 font-normal mt-0.5">{safeFormatDate(order.createdAt, 'hh:mm a')}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{order.customer?.shopName || "No Shop Name"}</p>
                        <p className="text-[11px] font-bold text-indigo-600 mt-0.5">{order.customer?.name || "Unknown Customer"}</p>
                        <p className="text-[10px] text-gray-400 font-normal mt-0.5">{order.customer?.phone || "N/A"}</p>
                        {order.deliveryPartner && (
                          <p className="text-[10px] text-primary font-bold mt-1 inline-flex items-center gap-1">
                            <Truck className="w-2.5 h-2.5" />
                            {order.deliveryPartner.name || "N/A"}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {safeFormatDate(order.createdAt, 'dd/MM/yyyy hh:mm a')}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={`px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider border inline-flex items-center gap-1.5 ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadOrderInvoicePDF(order)}
                          className="h-9 w-9 p-0 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 transition-all"
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.orderStatus);
                            setSelectedPartnerId(order.deliveryPartner?._id || null);
                            setShowStatusModal(true);
                          }}
                          className="h-9 px-4 rounded-xl font-normal text-xs uppercase text-primary hover:bg-primary/5 transition-all border-primary/20"
                        >
                          Update
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="h-9 px-4 rounded-xl font-normal text-xs uppercase text-accent hover:bg-accent/5 transition-all"
                        >
                          Details
                          <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-5 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs font-normal text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 rounded-xl font-normal text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-9 rounded-xl font-normal text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Update Status Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Update Order Status
            </DialogTitle>
            <p className="text-sm text-gray-500 font-normal mt-1">
              Customer will be notified via push notification
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-xs font-normal text-gray-400 uppercase tracking-widest mb-2">Order ID</p>
              <p className="text-sm font-mono font-semibold text-gray-900">#{selectedOrder?._id.slice(-8).toUpperCase()}</p>
            </div>

            <div>
              <p className="text-xs font-normal text-gray-400 uppercase tracking-widest mb-2">Select New Status</p>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Placed">📦 Placed</SelectItem>
                  <SelectItem value="Packed">📋 Packed</SelectItem>
                  <SelectItem value="Shipped">🚢 Shipped</SelectItem>
                  <SelectItem value="Out for Delivery">🚚 Out for Delivery</SelectItem>
                  <SelectItem value="Delivered">✅ Delivered</SelectItem>
                  <SelectItem value="Cancelled">❌ Cancelled</SelectItem>
                  <SelectItem value="Returned">🔄 Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newStatus === "Cancelled" || newStatus === "Returned") && (
              <div>
                <p className="text-xs font-normal text-gray-400 uppercase tracking-widest mb-2">Select Reason</p>
                <Select value={cancellationReason} onValueChange={setCancellationReason}>
                  <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer Cancelled">👤 Customer Cancelled</SelectItem>
                    <SelectItem value="Out of Stock After Billing">📦 Out of Stock After Billing</SelectItem>
                    <SelectItem value="Delivery Failed">🚚 Delivery Failed</SelectItem>
                    <SelectItem value="Wrong Product Ordered">❌ Wrong Product Ordered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <p className="text-xs font-normal text-gray-400 uppercase tracking-widest mb-3">Assign Delivery Partner</p>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar pb-2">
                <div 
                  onClick={() => setSelectedPartnerId(null)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedPartnerId === null ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-primary/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Unassigned</p>
                      <p className="text-[10px] text-gray-400">Clear assignment</p>
                    </div>
                  </div>
                </div>

                {deliveryPartners.map((partner: any) => (
                  <div 
                    key={partner._id} 
                    onClick={() => setSelectedPartnerId(partner._id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedPartnerId === partner._id ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-primary/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs border border-primary/5">
                        {partner.name ? partner.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{partner.name}</p>
                        <p className="text-[10px] text-gray-400 font-normal">{partner.vehicleType} • {partner.vehicleNumber}</p>
                      </div>
                    </div>
                    <Badge 
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                        partner.status === 'Available' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : partner.status === 'Busy'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {partner.status}
                    </Badge>
                  </div>
                ))}
                
                {deliveryPartners.length === 0 && (
                  <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Truck className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                    <p className="text-[10px] text-gray-400 font-normal uppercase tracking-widest">No Active Partners Found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowStatusModal(false)}
              disabled={updateStatusMutation.isPending}
              className="flex-1 h-12 rounded-2xl border-gray-100 font-normal uppercase text-xs tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending || !newStatus}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-primary/30"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update & Notify"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      {selectedOrder && !showStatusModal && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl rounded-[32px] p-0 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-white via-primary/5 to-white px-8 pt-8 pb-6 rounded-t-[32px] flex justify-between items-start">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
                  Order Details
                </DialogTitle>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  Order #{selectedOrder._id.slice(-8).toUpperCase()}
                </p>
              </DialogHeader>
              <Button
                variant="outline"
                onClick={() => downloadOrderInvoicePDF(selectedOrder)}
                className="rounded-2xl border-orange-200 text-orange-600 gap-2 font-bold uppercase text-[10px] tracking-widest bg-white shadow-sm hover:bg-orange-50"
              >
                <Download className="w-4 h-4" /> Download Invoice
              </Button>
            </div>

            <div className="px-8 pb-8 space-y-6">
              {/* Customer Info */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-blue-50/20 border border-blue-100">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Customer Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{selectedOrder.customer?.name || "Unknown Customer"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-normal text-gray-700">{selectedOrder.customer?.phone || "N/A"}</span>
                  </div>
                  {selectedOrder.customer?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-normal text-gray-700">{selectedOrder.customer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-50/50 to-green-50/20 border border-green-100">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Order Summary</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-gray-600">Total Amount</span>
                    <span className="text-lg font-black text-gray-900">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-gray-600">Payment Method</span>
                    <Badge className="px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase bg-purple-50 text-purple-700 border-purple-200">
                      {selectedOrder.paymentMethod}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-gray-600">Payment Status</span>
                    <Badge className={`px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase ${selectedOrder.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-gray-600">Order Status</span>
                    <Badge className={`${getStatusColor(selectedOrder.orderStatus)} px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase`}>
                      {selectedOrder.orderStatus}
                    </Badge>
                  </div>
                  {selectedOrder.cancellationReason && selectedOrder.cancellationReason !== 'None' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-gray-600">Cancellation/Return Reason</span>
                      <Badge className="px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase bg-red-50 text-red-700 border-red-200">
                        {selectedOrder.cancellationReason}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-gray-600">Order Date</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {safeFormatDate(selectedOrder.createdAt, 'dd/MM/yyyy hh:mm a')}
                    </span>
                  </div>
                  {selectedOrder.deliverySlot && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-green-100">
                      <span className="text-sm font-normal text-gray-600">Delivery Slot & Timing</span>
                      <div className="text-right">
                        <Badge className="px-3 py-1.5 rounded-lg font-bold text-xs bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1.5 ml-auto">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          {selectedOrder.deliverySlot}
                        </Badge>
                        {getSlotTimingText(selectedOrder.deliverySlot, deliverySlots) && (
                          <p className="text-xs font-bold text-orange-600 mt-1">
                            Timing: {getSlotTimingText(selectedOrder.deliverySlot, deliverySlots)}
                          </p>
                        )}
                        {selectedOrder.deliveryDate && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Slot Date: {safeFormatDate(selectedOrder.deliveryDate, 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedOrder.orderStatus === "Delivered" && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-green-200 bg-green-50/80 p-2.5 rounded-xl">
                      <span className="text-sm font-bold text-green-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Delivered Date & Time
                      </span>
                      <Badge className="px-3 py-1 rounded-lg font-bold text-xs bg-green-600 text-white border-none">
                        {getDeliveredTime(selectedOrder) || "Completed"}
                      </Badge>
                    </div>
                  )}
                  {selectedOrder.deliveryPartner && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-green-100">
                      <span className="text-sm font-normal text-gray-600">Assigned Partner</span>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">{selectedOrder.deliveryPartner.name || "N/A"}</p>
                        <p className="text-[10px] text-gray-500">{selectedOrder.deliveryPartner.phone || "N/A"}</p>
                      </div>
                    </div>
                  )}
                  {selectedOrder.codCollectionDetails && selectedOrder.codCollectionDetails.method !== 'None' && (
                    <div className="flex flex-col gap-3 pt-3 mt-3 border-t border-green-100 bg-gray-50/50 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">COD Collection Detail</span>
                        <Badge className="px-3 py-1 rounded-full font-black text-[10px] uppercase bg-green-100 text-green-700 border-green-200">
                          {selectedOrder.codCollectionDetails.method} Received
                        </Badge>
                      </div>

                      {selectedOrder.codCollectionDetails.method === 'Split' && (
                        <div className="grid grid-cols-2 gap-4 bg-white/60 p-3 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-[10px] font-normal text-gray-400 uppercase tracking-wider">Cash Portion</p>
                            <p className="text-sm font-black text-gray-800">₹{selectedOrder.codCollectionDetails.cashAmount || 0}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-normal text-gray-400 uppercase tracking-wider">Online Portion</p>
                            <p className="text-sm font-black text-gray-800">₹{selectedOrder.codCollectionDetails.onlineAmount || 0}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-gray-400">
                          Collected on {new Date(selectedOrder.codCollectionDetails.collectedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (() => {
                let address: any = null;
                try {
                  if (typeof selectedOrder.shippingAddress === 'string') {
                    address = JSON.parse(selectedOrder.shippingAddress);
                  } else {
                    address = selectedOrder.shippingAddress;
                  }
                } catch (e) {
                  address = { street: selectedOrder.shippingAddress };
                }

                if (!address) return null;

                return (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50/50 to-orange-50/20 border border-orange-100">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Delivery Address</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{address.addressType || 'Home'}</p>
                          <p className="text-sm font-normal text-gray-700 mt-1">{address.street || address.streetAddress || ''}</p>
                          {(address.city || address.state || address.zip || address.postalCode) && (
                            <p className="text-sm font-normal text-gray-700">
                              {address.city}{address.state ? `, ${address.state}` : ''}{ (address.zip || address.postalCode) ? ` - ${address.zip || address.postalCode}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Order Items ({selectedOrder.items.length})</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item._id} className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-primary/20 transition-all">
                        {/* Product Image */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-normal text-gray-500">Qty: {item.quantity}</span>
                            <span className="text-xs font-normal text-gray-400">•</span>
                            <span className="text-xs font-semibold text-gray-700">₹{item.price.toLocaleString()} each</span>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 uppercase mt-0.5">Total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking History */}
              {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Order Timeline</h4>
                  <div className="space-y-3">
                    {selectedOrder.trackingHistory.map((track) => (
                      <div key={track._id} className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-white border border-indigo-100">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{track.status}</p>
                          {track.description && (
                            <p className="text-xs font-normal text-gray-600 mt-1">{track.description}</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {safeFormatDate(track.timestamp, 'dd/MM/yyyy hh:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      <ReportDownloadModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Export Customer Orders Report"
        description="Select date range (Daily, Weekly, Monthly, Yearly, All or Custom) to export order records."
        onGenerate={handleGenerateReport}
      />
    </div>
  );
};

export default Orders;

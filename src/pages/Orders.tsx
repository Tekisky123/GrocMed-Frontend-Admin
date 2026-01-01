import { useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
import { Search, Filter, ChevronRight, MapPin, Package, Calendar, DollarSign, Tag } from "lucide-react";
import { recentOrders, deliveryPartners } from "@/lib/mockData";

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allOrders = useMemo(() => [
    ...recentOrders,
    ...recentOrders.map((o, i) => ({
      ...o,
      id: `ORD-2024-${String(1000 + i).slice(-3)}`,
      customerName: `Customer ${i + 6}`,
    })),
  ], []);

  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, allOrders]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-50 text-green-700 border-green-100";
      case "in_transit": return "bg-blue-50 text-blue-700 border-blue-100";
      case "confirmed": return "bg-purple-50 text-purple-700 border-purple-100";
      case "pending": return "bg-accent/10 text-accent border-accent/20";
      case "cancelled": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Track and manage your customer orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary font-normal">
            {filteredOrders.length} Total
          </Badge>
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
            <div className="md:col-span-6 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search order ID or customer name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11 h-12 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all"
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
                <SelectTrigger className="h-12 border-gray-100 bg-gray-50/50 focus:ring-primary/10 rounded-2xl">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-xl border-gray-100">
                  <SelectItem value="all">Everywhere</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter(null);
                setCurrentPage(1);
              }}
              className="md:col-span-2 h-12 rounded-2xl border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 font-normal transition-all"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Orders Table Card */}
      <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Order Details</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Pricing</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-normal text-xs">
                        {order.id.split('-').pop()}
                      </div>
                      <div>
                        <p className="text-sm font-normal text-gray-900">{order.id}</p>
                        <p className="text-[11px] text-gray-400 font-normal mt-0.5">{order.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-normal text-gray-800">{order.customerName}</p>
                    <p className="text-[11px] text-gray-400 font-normal">Regular User</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-normal text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                    <p className="text-[11px] text-gray-400 font-normal uppercase tracking-tighter decoration-accent/30 underline underline-offset-4">{order.items} Items</p>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="outline" className={`px-2.5 py-1 rounded-lg font-normal text-[10px] uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="h-9 px-4 rounded-xl font-normal text-xs uppercase text-primary hover:bg-primary/5 transition-all"
                    >
                      View Details
                      <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        <div className="px-6 py-5 bg-gray-50/30 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-normal text-gray-400 uppercase tracking-widest">
            Page <span className="text-gray-900">{currentPage}</span> of <span className="text-gray-900">{totalPages}</span>
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="flex-1 sm:flex-none h-10 px-6 rounded-xl border-gray-200 font-normal text-xs uppercase disabled:opacity-30 transition-all"
            >
              Back
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex-1 sm:flex-none h-10 px-6 rounded-xl border-gray-200 font-normal text-xs uppercase disabled:opacity-30 transition-all"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Order Details Modal - (Keeping existing logic but refining UI) */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-primary p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Package className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-white/20 text-white border-white/20 mb-3 px-3 py-1 rounded-full font-normal text-[10px] uppercase tracking-wider backdrop-blur-sm">
                  {selectedOrder.status.replace("_", " ").toUpperCase()}
                </Badge>
                <DialogTitle className="text-3xl font-black tracking-tight">{selectedOrder.id}</DialogTitle>
                <p className="opacity-70 font-normal mt-1 text-sm">Placed on {selectedOrder.date}</p>
              </div>
            </div>

            <div className="p-8 space-y-8 bg-white">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Customer</p>
                  <p className="text-sm font-normal text-gray-900">{selectedOrder.customerName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Total Bill</p>
                  <p className="text-sm font-normal text-gray-900">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Total Items</p>
                  <p className="text-sm font-normal text-gray-900">{selectedOrder.items} Items</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Payment</p>
                  <p className="text-sm font-normal text-green-600">PREPAID</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <h4 className="text-xs font-normal text-gray-400 uppercase tracking-widest">Delivery Details</h4>
                </div>
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                    <MapPin className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-normal text-gray-900">{selectedOrder.deliveryPartner || "Awaiting Assignment"}</p>
                    <p className="text-xs text-gray-500 font-normal mt-0.5">Estimated delivery: Within 30 mins</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 h-14 rounded-2xl border-gray-100 font-normal text-sm uppercase text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-200 transition-all"
                >
                  Close
                </Button>
                <Button className="flex-1 h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-normal text-sm uppercase shadow-lg shadow-accent/20 transition-all active:scale-95">
                  Update Tracking
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Orders;

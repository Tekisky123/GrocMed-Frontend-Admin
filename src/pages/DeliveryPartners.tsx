import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Phone,
  Mail,
  Star,
  Truck,
  Package,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
  UserPlus,
  MapPin,
  Edit,
  Trash2,
} from "lucide-react";
import { deliveryPartnerApi } from "@/api/deliveryPartnerApi";
import { orderApi } from "@/api/orderApi";
import { formatDateDDMMYYYY } from "@/utils/dateUtils";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";

const DeliveryPartners = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [phoneVal, setPhoneVal] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<any>(null);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  const [modalTimeframe, setModalTimeframe] = useState<"daily" | "weekly" | "monthly" | "all">("daily");
  const [modalTab, setModalTab] = useState<"assigned" | "delivered">("assigned");

  const handleOpenEditModal = (partner: any) => {
    setEditingPartner(partner);
    setPhoneVal(partner.phone || "");
    setShowAddModal(true);
    setSelectedPartner(null);
  };

  // Fetch delivery partners with React Query
  const { data: partnersResponse, isLoading } = useQuery({
    queryKey: ['deliveryPartners'],
    queryFn: deliveryPartnerApi.getAllPartners,
  });

  // Fetch all orders for partner delivery calculations
  const { data: ordersResponse } = useQuery({
    queryKey: ['allOrdersForPartners'],
    queryFn: orderApi.getAllOrders,
  });

  const allPartners = partnersResponse?.data || [];
  const allOrders = ordersResponse?.data || [];

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const getPartnerStats = (partnerId: string) => {
    const pOrders = allOrders.filter(o => {
      const pId = o.deliveryPartner?._id || o.deliveryPartner || o.deliveryPartnerId;
      return String(pId) === String(partnerId);
    });

    const now = new Date();

    const assignedOrders = pOrders.filter(o =>
      !['Delivered', 'Cancelled', 'Returned'].includes(o.orderStatus || o.status)
    );

    const deliveredOrders = pOrders.filter(o =>
      (o.orderStatus || o.status) === 'Delivered'
    );

    const dailyDelivered = deliveredOrders.filter(o => {
      const d = new Date(o.updatedAt || o.createdAt);
      return !isNaN(d.getTime()) && isSameDay(d, now);
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const weeklyDelivered = deliveredOrders.filter(o => {
      const d = new Date(o.updatedAt || o.createdAt);
      return !isNaN(d.getTime()) && d >= sevenDaysAgo;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const monthlyDelivered = deliveredOrders.filter(o => {
      const d = new Date(o.updatedAt || o.createdAt);
      return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
    });

    const cashToCollect = deliveredOrders.reduce((acc, o) => {
      const isCOD = o.paymentMethod === 'COD' || o.paymentMethod === 'Cash on Delivery';
      const isPending = o.paymentStatus !== 'Completed' && o.paymentStatus !== 'Settled';
      if (isCOD && isPending) {
        const amount = o.codCollectionDetails?.cashAmount ?? o.totalAmount ?? 0;
        return acc + amount;
      }
      return acc;
    }, 0);

    return {
      pOrders,
      assignedOrders,
      deliveredOrders,
      dailyDelivered,
      weeklyDelivered,
      monthlyDelivered,
      totalDelivered: deliveredOrders.length,
      cashToCollect
    };
  };

  const filteredPartners = useMemo(() => {
    return allPartners.filter((partner) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (partner.name || '').toLowerCase().includes(q) ||
        (partner.email || '').toLowerCase().includes(q) ||
        (partner.phone || '').includes(searchQuery);
      const matchesStatus = !statusFilter || partner.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, allPartners]);

  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPartners.slice(start, start + itemsPerPage);
  }, [filteredPartners, currentPage]);

  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);

  // Create Partner Mutation
  const createMutation = useMutation({
    mutationFn: deliveryPartnerApi.createPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryPartners'] });
      toast.success("Partner added successfully!");
      setShowAddModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add partner");
    },
  });

  // Update Partner Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      deliveryPartnerApi.updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryPartners'] });
      toast.success("Partner updated successfully!");
      setShowAddModal(false);
      setEditingPartner(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update partner");
    },
  });

  // Delete Partner Mutation
  const deleteMutation = useMutation({
    mutationFn: deliveryPartnerApi.deletePartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryPartners'] });
      toast.success("Partner deleted successfully!");
      setShowDeleteModal(false);
      setPartnerToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete partner");
    },
  });

  const handleDelete = () => {
    if (partnerToDelete) {
      deleteMutation.mutate(partnerToDelete._id);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const errors: Record<string, string> = {};
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const vehicleType = formData.get('vehicleType') as string;
    const vehicleNumber = formData.get('vehicleNumber') as string;
    const licenseNumber = formData.get('licenseNumber') as string;

    if (!name?.trim()) errors.name = "Name is required";
    if (!email?.trim()) errors.email = "Email is required";
    if (!phone?.trim()) {
      errors.phone = "Phone is required";
    } else if (phone.length !== 10) {
      errors.phone = "Phone number must be exactly 10 digits";
    }
    if (!editingPartner && !password?.trim()) errors.password = "Password is required";
    if (!vehicleType?.trim()) errors.vehicleType = "Vehicle type is required";
    if (!vehicleNumber?.trim()) errors.vehicleNumber = "Vehicle number is required";
    if (!licenseNumber?.trim()) errors.licenseNumber = "License number is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill all required fields");
      return;
    }

    setFormErrors({});

    const partnerData: any = {
      name,
      email,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
    };

    // Only include password for new partners
    if (!editingPartner && password) {
      partnerData.password = password;
    }

    if (editingPartner) {
      const status = formData.get('status') as string;
      const isActive = formData.get('isActive') === 'true';
      partnerData.status = status;
      partnerData.isActive = isActive;

      updateMutation.mutate({ id: editingPartner._id, data: partnerData });
    } else {
      createMutation.mutate(partnerData);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPartner(null);
    setFormErrors({});
    setPhoneVal("");
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Delivery Team</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Manage your delivery partners.</p>
        </div>
        <Button
          onClick={() => {
            setEditingPartner(null);
            setPhoneVal("");
            setShowAddModal(true);
          }}
          className="bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-500/90 text-white font-normal rounded-2xl h-11 px-6 shadow-lg shadow-accent/30 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Partner
        </Button>
      </div>



      {/* Search & Filter */}
      <Card className="p-4 sm:p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by name, vehicle ID or mobile..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-11 h-12 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all"
            />
          </div>
          <select
            value={statusFilter || ""}
            onChange={(e) => { setStatusFilter(e.target.value || null); setCurrentPage(1); }}
            className="sm:w-48 h-12 px-4 border border-gray-100 bg-gray-50/50 rounded-2xl text-xs font-normal uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-primary/10 outline-none transition-all"
          >
            <option value="">Status: All</option>
            <option value="active">Available</option>
            <option value="inactive">Off Duty</option>
          </select>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Partner</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Vehicle Details</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">License</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[11px] font-normal text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-normal text-primary mt-6 tracking-widest uppercase">Loading Partners...</p>
                  </td>
                </tr>
              ) : paginatedPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 font-normal uppercase text-xs tracking-widest">No delivery partners found</td>
                </tr>
              ) : (
                paginatedPartners.map((partner) => (
                  <tr key={partner._id} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{partner.name || "Unknown Partner"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-normal text-gray-700">{partner.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-normal text-gray-700">{partner.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">{partner.vehicleType}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Truck className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-900">{partner.vehicleNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-mono font-semibold text-gray-900">{partner.licenseNumber}</p>
                      <p className="text-[10px] text-gray-400 font-normal mt-0.5">DL Number</p>
                    </td>
                    <td className="px-6 py-5">
                      <Badge
                        className={`px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider border ${partner.status === 'Available'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : partner.status === 'Busy'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                      >
                        {partner.status === 'Available' && '✅ '}
                        {partner.status === 'Busy' && '🔴 '}
                        {partner.status === 'Offline' && '⚫ '}
                        {partner.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPartner(partner)}
                        className="h-9 px-4 rounded-xl font-bold text-xs uppercase text-accent hover:bg-accent/5 transition-all"
                      >
                        View Details
                        <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-5 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">
            FLeet <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredPartners.length)}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="h-10 px-5 rounded-xl font-normal text-[10px] uppercase border-gray-200"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="h-10 px-5 rounded-xl font-normal text-[10px] uppercase border-gray-200"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Comprehensive Partner Detail & Audit Modal */}
      {selectedPartner && (() => {
        const stats = getPartnerStats(selectedPartner._id);
        const getDisplayedDelivered = () => {
          if (modalTimeframe === "daily") return stats.dailyDelivered;
          if (modalTimeframe === "weekly") return stats.weeklyDelivered;
          if (modalTimeframe === "monthly") return stats.monthlyDelivered;
          return stats.deliveredOrders;
        };
        const displayedDeliveredList = getDisplayedDelivered();

        return (
          <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
            <DialogContent className="max-w-3xl rounded-[36px] p-0 max-h-[90vh] overflow-y-auto custom-scrollbar border-none shadow-2xl bg-white">
              {/* Header */}
              <div className="bg-gradient-to-br from-primary via-green-600 to-emerald-700 p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Truck className="w-40 h-40" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-white/20 text-white border-white/20 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm">
                        {selectedPartner.status.toUpperCase()}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/20 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm">
                        {selectedPartner.vehicleType} — {selectedPartner.vehicleNumber}
                      </Badge>
                    </div>
                    <DialogTitle className="text-3xl font-black tracking-tight">{selectedPartner.name}</DialogTitle>
                    <p className="opacity-80 font-semibold mt-1 text-xs">
                      DL: {selectedPartner.licenseNumber || "N/A"} | ID: {selectedPartner._id}
                    </p>
                  </div>
                  <div className="bg-white/15 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-100">COD Cash To Collect</p>
                    <p className="text-2xl font-black text-white mt-0.5">₹{stats.cashToCollect.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {/* Timeframe Selector Tabs */}
                <div className="flex items-center justify-between gap-4 flex-wrap bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-2">Timeframe:</span>
                  <div className="flex gap-1.5">
                    {([["daily", "Today"], ["weekly", "Last 7 Days"], ["monthly", "Last 30 Days"], ["all", "All Time"]] as const).map(([tf, label]) => (
                      <button
                        key={tf}
                        onClick={() => setModalTimeframe(tf)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${modalTimeframe === tf ? "bg-white text-primary shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100 text-center">
                    <p className="text-2xl font-black text-green-700">{displayedDeliveredList.length}</p>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-1">Delivered ({modalTimeframe})</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-center">
                    <p className="text-2xl font-black text-amber-700">{stats.assignedOrders.length}</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-1">Active / Assigned</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 text-center">
                    <p className="text-2xl font-black text-red-700">₹{stats.cashToCollect.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-1">Pending Cash</p>
                  </div>
                </div>

                {/* Order Breakdown Tabs */}
                <div className="space-y-4">
                  <div className="flex gap-2 border-b border-gray-100 pb-3">
                    <button
                      onClick={() => setModalTab("assigned")}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${modalTab === "assigned" ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-gray-100 text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Assigned Orders ({stats.assignedOrders.length})
                    </button>
                    <button
                      onClick={() => setModalTab("delivered")}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${modalTab === "delivered" ? "bg-green-600 text-white shadow-md shadow-green-600/20" : "bg-gray-100 text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Delivered Orders ({displayedDeliveredList.length})
                    </button>
                  </div>

                  {modalTab === "assigned" && (
                    <div className="space-y-3">
                      {stats.assignedOrders.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-100 text-gray-400 text-xs font-semibold">
                          No active orders currently assigned to this partner.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                          {stats.assignedOrders.map((ord: any) => (
                            <div key={ord._id} className="p-4 bg-white hover:bg-amber-50/20 transition-colors flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-mono font-bold text-gray-900">#{ord._id.slice(-8).toUpperCase()}</p>
                                <p className="text-xs font-bold text-gray-700 mt-0.5">{ord.customer?.shopName || ord.customer?.name || "Customer"}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Slot: {ord.deliverySlot || "Standard"} ({formatDateDDMMYYYY(ord.createdAt)})</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-gray-900">₹{ord.totalAmount?.toLocaleString()}</p>
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold mt-1">
                                  {ord.orderStatus || ord.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {modalTab === "delivered" && (
                    <div className="space-y-3">
                      {displayedDeliveredList.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-100 text-gray-400 text-xs font-semibold">
                          No orders delivered in this timeframe ({modalTimeframe}).
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                          {displayedDeliveredList.map((ord: any) => (
                            <div key={ord._id} className="p-4 bg-white hover:bg-green-50/20 transition-colors flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-mono font-bold text-gray-900">#{ord._id.slice(-8).toUpperCase()}</p>
                                <p className="text-xs font-bold text-gray-700 mt-0.5">{ord.customer?.shopName || ord.customer?.name || "Customer"}</p>
                                <p className="text-[10px] text-green-600 font-bold mt-0.5">
                                  Delivered: {formatDateDDMMYYYY(ord.updatedAt || ord.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-gray-900">₹{ord.totalAmount?.toLocaleString()}</p>
                                <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold mt-1">
                                  {ord.paymentMethod || "COD"} ({ord.paymentStatus || "Paid"})
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPartner(null)}
                    className="flex-1 h-12 rounded-2xl border-gray-200 font-bold text-xs uppercase tracking-widest text-gray-500"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleOpenEditModal(selectedPartner)}
                    className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Partner
                  </Button>
                  <Button
                    onClick={() => {
                      const p = selectedPartner;
                      setSelectedPartner(null);
                      setPartnerToDelete(p);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Partner
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Add/Edit Partner Modal */}
      <Dialog open={showAddModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl rounded-[32px] p-0 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className=" bg-gradient-to-br from-white via-accent/5 to-white px-8 pt-8 pb-4 rounded-t-[32px]">
            <DialogHeader>
              <DialogTitle className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-accent to-orange-600 bg-clip-text text-transparent">
                {editingPartner ? "Edit Partner" : "Add New Partner"}
              </DialogTitle>
              <p className="text-sm text-gray-500 font-normal mt-1">
                {editingPartner ? "Update delivery partner information" : "Register a new delivery partner to your fleet"}
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8">
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <UserPlus className="w-4 h-4 text-accent" />
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Personal Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="name"
                      defaultValue={editingPartner?.name}
                      className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white ${formErrors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      placeholder="Enter partner name"
                    />
                    {formErrors.name && <p className="text-[10px] text-red-500 ml-1">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        name="email"
                        type="email"
                        defaultValue={editingPartner?.email}
                        className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white pl-10 ${formErrors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        placeholder="partner@example.com"
                      />
                    </div>
                    {formErrors.email && <p className="text-[10px] text-red-500 ml-1">{formErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        name="phone"
                        value={phoneVal}
                        onChange={(e) => {
                          const cleanVal = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setPhoneVal(cleanVal);
                        }}
                        className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white pl-10 ${formErrors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        placeholder="9876543210"
                      />
                    </div>
                    {formErrors.phone && <p className="text-[10px] text-red-500 ml-1">{formErrors.phone}</p>}
                  </div>

                  {!editingPartner && (
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="password"
                        type="password"
                        className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white ${formErrors.password ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        placeholder="Enter password"
                      />
                      {formErrors.password && <p className="text-[10px] text-red-500 ml-1">{formErrors.password}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Truck className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Vehicle & License Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                      Vehicle Type <span className="text-red-500">*</span>
                    </Label>
                    <Select name="vehicleType" defaultValue={editingPartner?.vehicleType || "Bike"}>
                      <SelectTrigger className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 ${formErrors.vehicleType ? 'border-red-500 ring-1 ring-red-500' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bike">🏍️ Bike</SelectItem>
                        <SelectItem value="Scooter">🛵 Scooter</SelectItem>
                        <SelectItem value="Car">🚗 Car</SelectItem>
                        <SelectItem value="Van">🚐 Van</SelectItem>
                        <SelectItem value="Truck">🚚 Truck</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.vehicleType && <p className="text-[10px] text-red-500 ml-1">{formErrors.vehicleType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                      Vehicle Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        name="vehicleNumber"
                        defaultValue={editingPartner?.vehicleNumber}
                        className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white pl-10 uppercase ${formErrors.vehicleNumber ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        placeholder="MH-12-AB-1234"
                      />
                    </div>
                    {formErrors.vehicleNumber && <p className="text-[10px] text-red-500 ml-1">{formErrors.vehicleNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                      License Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="licenseNumber"
                      defaultValue={editingPartner?.licenseNumber}
                      className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white uppercase ${formErrors.licenseNumber ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      placeholder="DL-1420110012345"
                    />
                    {formErrors.licenseNumber && <p className="text-[10px] text-red-500 ml-1">{formErrors.licenseNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Status & Accessibility - Only shown in edit mode */}
              {editingPartner && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Zap className="w-4 h-4 text-accent" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Status & Accessibility</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                        Duty Status
                      </Label>
                      <Select name="status" defaultValue={editingPartner?.status || "Offline"}>
                        <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">✅ Available</SelectItem>
                          <SelectItem value="Busy">🔴 Busy</SelectItem>
                          <SelectItem value="Offline">⚫ Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">
                        Account Status
                      </Label>
                      <Select name="isActive" defaultValue={editingPartner?.isActive ? "true" : "false"}>
                        <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">🟢 Active</SelectItem>
                          <SelectItem value="false">🔴 Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-14 flex-1 rounded-2xl border-gray-100 font-normal uppercase text-xs tracking-widest text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-500/90 text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-accent/30 transition-all active:scale-95"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingPartner ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>{editingPartner ? "Update Partner" : "Add Partner"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              Delete Delivery Partner?
            </DialogTitle>
            <p className="text-sm text-gray-500 font-normal mt-1">
              This action cannot be undone and will remove this partner from the fleet.
            </p>
          </DialogHeader>

          {partnerToDelete && (
            <div className="py-4">
              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
                <p className="text-sm font-semibold text-gray-900">{partnerToDelete.name}</p>
                <p className="text-xs text-gray-600 mt-1">{partnerToDelete.email}</p>
                <p className="text-xs text-gray-600">{partnerToDelete.phone}</p>
                <p className="text-xs text-gray-600 mt-1 uppercase font-bold text-red-600">{partnerToDelete.vehicleType} - {partnerToDelete.vehicleNumber}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setPartnerToDelete(null);
              }}
              disabled={deleteMutation.isPending}
              className="flex-1 h-12 rounded-2xl border-gray-100 font-normal uppercase text-xs tracking-widest text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-red-500/30 transition-all active:scale-95"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Partner
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryPartners;

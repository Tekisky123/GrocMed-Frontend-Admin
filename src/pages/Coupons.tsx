import React, { useEffect, useState } from "react";
import { couponApi, CouponData } from "@/api/couponApi";
import { useToast } from "@/components/ui/use-toast";
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Power,
  Copy,
  Percent,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function Coupons() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<CouponData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discountAmount: "50",
    minOrderAmount: "0",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    usageLimit: "100",
    perUserLimit: "1",
    isActive: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponApi.getAllCoupons();
      if (res.success) {
        setCoupons(res.data || []);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Coupon code is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountAmount: Number(formData.discountAmount),
        minOrderAmount: Number(formData.minOrderAmount || 0),
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        usageLimit: Number(formData.usageLimit || 100),
        perUserLimit: Number(formData.perUserLimit || 1),
        isActive: formData.isActive,
      };

      const res = await couponApi.createCoupon(payload);
      if (res.success) {
        toast({
          title: "Success",
          description: `Coupon ${res.data.code} created successfully!`,
        });
        setIsModalOpen(false);
        resetForm();
        fetchCoupons();
      }
    } catch (err: any) {
      toast({
        title: "Failed to Create Coupon",
        description: err.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await couponApi.toggleCouponStatus(id);
      if (res.success) {
        toast({
          title: "Status Updated",
          description: res.message,
        });
        fetchCoupons();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to toggle status",
        variant: "destructive",
      });
    }
  };

  const openDeleteModal = (coupon: CouponData) => {
    setCouponToDelete(coupon);
    setShowDeleteModal(true);
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete || !couponToDelete._id) return;
    try {
      setDeleting(true);
      const res = await couponApi.deleteCoupon(couponToDelete._id);
      if (res.success) {
        toast({
          title: "Deleted",
          description: `Coupon "${couponToDelete.code}" deleted successfully`,
        });
        setShowDeleteModal(false);
        setCouponToDelete(null);
        fetchCoupons();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete coupon",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discountAmount: "50",
      minOrderAmount: "0",
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      usageLimit: "100",
      perUserLimit: "1",
      isActive: true,
    });
  };

  const generateRandomCode = () => {
    const prefixes = ["GROC", "SAVE", "MED", "FLAT", "MEGA", "SUPER"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 85);
    setFormData((prev) => ({ ...prev, code: `${prefix}${num}` }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `Coupon code "${text}" copied to clipboard`,
    });
  };

  // Filter coupons
  const filteredCoupons = coupons.filter((c) => {
    const matchesQuery = c.code.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "all") return matchesQuery;
    if (statusFilter === "active") return matchesQuery && c.status === "Active";
    if (statusFilter === "expired") return matchesQuery && c.status === "Expired";
    if (statusFilter === "inactive") return matchesQuery && c.status === "Inactive";
    return matchesQuery;
  });

  // Calculate metrics
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.status === "Active").length;
  const totalRedeemed = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const avgDiscount = coupons.length
    ? Math.round(
        coupons.reduce((sum, c) => sum + (c.discountAmount || 0), 0) / coupons.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Coupon Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Create, monitor, and configure promotional discount coupons for GrocMed customers.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20 rounded-xl px-5 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-primary flex items-center justify-center font-bold">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Coupons
            </p>
            <p className="text-2xl font-black text-gray-900">{totalCoupons}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Active Coupons
            </p>
            <p className="text-2xl font-black text-gray-900">{activeCoupons}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Redeemed
            </p>
            <p className="text-2xl font-black text-gray-900">{totalRedeemed}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Avg Discount
            </p>
            <p className="text-2xl font-black text-gray-900">₹{avgDiscount} OFF</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search coupon code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "active", "expired", "inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === status
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading coupons...</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-700">No Coupons Found</h3>
            <p className="text-sm text-gray-400 mt-1">
              Create your first promotional discount coupon to engage customers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-5 w-[180px] align-middle">Coupon Code</th>
                  <th className="py-4 px-5 w-[110px] align-middle">Offer</th>
                  <th className="py-4 px-5 w-[120px] align-middle">Min Order</th>
                  <th className="py-4 px-5 w-[210px] align-middle">Validity Period</th>
                  <th className="py-4 px-5 w-[180px] align-middle">Usage Progress</th>
                  <th className="py-4 px-5 w-[160px] align-middle">User Policy</th>
                  <th className="py-4 px-5 w-[110px] align-middle">Status</th>
                  <th className="py-4 px-5 w-[110px] text-right align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCoupons.map((c) => {
                  const usedPct = Math.min(
                    100,
                    Math.round(((c.usedCount || 0) / (c.usageLimit || 1)) * 100)
                  );

                  return (
                    <tr key={c._id} className="hover:bg-gray-50/40 transition-colors">
                      {/* Code */}
                      <td className="py-4 px-5 align-middle font-bold">
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-50 text-primary border border-orange-200/80 px-3 py-1 rounded-lg text-xs font-mono font-black tracking-wider shadow-2xs">
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(c.code)}
                            className="p-1 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100"
                            title="Copy code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Offer */}
                      <td className="py-4 px-5 align-middle">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/80 font-black text-xs px-2.5 py-1">
                          ₹{c.discountAmount} OFF
                        </Badge>
                      </td>

                      {/* Min Order */}
                      <td className="py-4 px-5 align-middle text-gray-700 font-bold text-xs">
                        {c.minOrderAmount && c.minOrderAmount > 0 ? (
                          `₹${c.minOrderAmount.toLocaleString()}`
                        ) : (
                          <span className="text-gray-400 font-medium italic">No min</span>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-4 px-5 align-middle">
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-800 font-bold">
                            <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                            <span>
                              Expires: {new Date(c.validUntil).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium pl-5">
                            From: {new Date(c.validFrom || c.createdAt || Date.now()).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-5 align-middle">
                        <div className="space-y-1.5 pr-2">
                          <div className="flex justify-between text-xs font-bold text-gray-800">
                            <span>{c.usedCount || 0} used</span>
                            <span className="text-gray-400 font-semibold">{c.usageLimit} max</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200/50">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
                              style={{ width: `${usedPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Per User Limit */}
                      <td className="py-4 px-5 align-middle">
                        <span className="text-[11px] font-bold text-gray-700 bg-gray-100 border border-gray-200/60 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap">
                          {c.perUserLimit === 1 ? "1 Time / User (Single-use)" : `${c.perUserLimit} Times / User`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 align-middle">
                        {c.status === "Active" && (
                          <Badge className="bg-emerald-500 text-white font-bold text-[11px]">Active</Badge>
                        )}
                        {c.status === "Expired" && (
                          <Badge className="bg-amber-500 text-white font-bold text-[11px]">Expired</Badge>
                        )}
                        {c.status === "Inactive" && (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700 font-bold text-[11px]">Inactive</Badge>
                        )}
                        {c.status === "Depleted" && (
                          <Badge className="bg-red-500 text-white font-bold text-[11px]">Depleted</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(c._id!)}
                            className={`p-2 rounded-lg border transition-all ${
                              c.isActive
                                ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                            }`}
                            title={c.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(c)}
                            className="p-2 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Ticket className="w-5 h-5 text-primary" />
              Create New Discount Coupon
            </DialogTitle>
            <DialogDescription>
              Set up promotional details, discount %, valid dates, and usage limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCoupon} className="space-y-4 py-2">
            {/* Coupon Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="code" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Coupon Code *
                </Label>
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto Generate
                </button>
              </div>
              <Input
                id="code"
                placeholder="e.g. GROC20"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono uppercase font-bold tracking-wider rounded-xl border-gray-200"
                required
              />
            </div>

            {/* Offer Price & Min Order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="discountAmount" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Discount Amount (₹ OFF) *
                </Label>
                <div className="relative">
                  <Input
                    id="discountAmount"
                    type="number"
                    min="1"
                    placeholder="50"
                    value={formData.discountAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountAmount: e.target.value,
                      }))
                    }
                    className="pr-8 rounded-xl font-bold border-gray-200"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minOrderAmount" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Min Order Amount (₹)
                </Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  min="0"
                  placeholder="0 (No minimum)"
                  value={formData.minOrderAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minOrderAmount: e.target.value,
                    }))
                  }
                  className="rounded-xl font-bold border-gray-200"
                />
              </div>
            </div>

            {/* Valid From & Valid Until */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="validFrom" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Valid From Date
                </Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validFrom: e.target.value,
                    }))
                  }
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="validUntil" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Expiration Date *
                </Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validUntil: e.target.value,
                    }))
                  }
                  className="rounded-xl border-gray-200"
                  required
                />
              </div>
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="usageLimit" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Usage Limit
                </Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      usageLimit: e.target.value,
                    }))
                  }
                  className="rounded-xl font-bold border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="perUserLimit" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Usage Limit Per User
                </Label>
                <Input
                  id="perUserLimit"
                  type="number"
                  min="1"
                  placeholder="1 (Only once)"
                  value={formData.perUserLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      perUserLimit: e.target.value,
                    }))
                  }
                  className="rounded-xl font-bold border-gray-200"
                />
                <p className="text-[10px] text-gray-400">Default = 1 (Used only once per customer)</p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">Activate Immediately</p>
                <p className="text-xs text-gray-500">Allow customers to redeem this coupon right away.</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl"
              >
                {submitting ? "Creating..." : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-red-600 font-bold">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Coupon?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 pt-1">
              Are you sure you want to delete coupon{" "}
              <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                {couponToDelete?.code}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="rounded-xl flex-1 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteCoupon}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex-1 shadow-md shadow-red-600/20"
            >
              {deleting ? "Deleting..." : "Delete Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

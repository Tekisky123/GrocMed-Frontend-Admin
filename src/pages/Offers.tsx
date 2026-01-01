import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Copy,
  ChevronRight,
  TrendingUp,
  Ticket,
  Zap,
  Clock,
} from "lucide-react";
import { offers } from "@/lib/mockData";

const Offers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allOffers = useMemo(() => [
    ...offers,
    ...offers.map((o, i) => ({
      ...o,
      id: `OFFER-${String(100 + i).slice(-3)}`,
      code: `${o.code}${i}`,
    })),
  ], []);

  const filteredOffers = useMemo(() => {
    return allOffers.filter((offer) => {
      const q = searchQuery.toLowerCase();
      return offer.code.toLowerCase().includes(q) ||
        offer.description.toLowerCase().includes(q);
    });
  }, [searchQuery, allOffers]);

  const paginatedOffers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOffers.slice(start, start + itemsPerPage);
  }, [filteredOffers, currentPage]);

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // Could add a toast here
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Campaign Center</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Design and track promotional coupons.</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-accent hover:bg-accent/90 text-white font-normal rounded-2xl h-11 px-6 shadow-lg shadow-accent/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats - Grid optimized for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Performance</p>
              <p className="text-xl font-normal text-gray-900">Active Coupons</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Interaction</p>
              <p className="text-xl font-normal text-gray-900">Redemptions</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Efficiency</p>
              <p className="text-xl font-normal text-gray-900">42% ROI</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Filter */}
      <Card className="p-4 sm:p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search campaign code or description..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-11 h-12 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all"
          />
        </div>
      </Card>

      {/* Campaigns Table */}
      <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Campaign Code</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Discount Details</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Engagement</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Validity</th>
                <th className="px-6 py-5 text-right text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOffers.map((offer) => (
                <tr key={offer.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyToClipboard(offer.code)}
                        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <div>
                        <p className="text-sm font-normal text-gray-900 uppercase tracking-tighter">{offer.code}</p>
                        <p className="text-[11px] text-gray-400 font-normal truncate max-w-[200px]">{offer.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-normal text-primary">
                      {offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} FLAT`}
                    </p>
                    <p className="text-[10px] text-gray-400 font-normal uppercase tracking-widest mt-0.5">Promo Discount</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] font-normal text-gray-400 mb-1">
                        <span>Usage</span>
                        <span>{offer.usedCount} / {offer.maxUses}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${(offer.usedCount / offer.maxUses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-normal tracking-tighter">{offer.validUntil}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Badge className={`px-2.5 py-1 rounded-lg font-normal text-[10px] uppercase tracking-wider ${offer.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                      {offer.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        <div className="px-6 py-5 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">
            Offers <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredOffers.length)}</span>
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

      {/* Create Modal - Refined UI */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-xl rounded-[32px] p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">New Campaign</DialogTitle>
              <p className="text-sm text-gray-400 font-normal mt-1">Setup your promotional code and validity limits.</p>
            </DialogHeader>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Coupon Code <span className="text-red-500 font-black">*</span></Label>
                  <Input
                    name="code"
                    placeholder="e.g. SAVE50"
                    className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-normal transition-all ${formErrors.code ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                  />
                  {formErrors.code && <p className="text-[9px] text-red-500 font-normal mt-1 ml-1">{formErrors.code}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Value <span className="text-red-500 font-black">*</span></Label>
                  <Input
                    name="value"
                    type="number"
                    min="0"
                    placeholder="Enter amount or %"
                    className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-normal transition-all ${formErrors.value ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                  />
                  {formErrors.value && <p className="text-[9px] text-red-500 font-normal mt-1 ml-1">{formErrors.value}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Campaign Description <span className="text-red-500 font-black">*</span></Label>
                <Input
                  name="description"
                  placeholder="What is this offer for?"
                  className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-normal transition-all ${formErrors.description ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                />
                {formErrors.description && <p className="text-[9px] text-red-500 font-normal mt-1 ml-1">{formErrors.description}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Start Date</Label>
                  <Input name="startDate" type="date" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-normal" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Expiry Date</Label>
                  <Input name="expiryDate" type="date" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-normal" />
                </div>
              </div>

              <DialogFooter className="pt-6 sm:justify-start flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setShowAddModal(false); setFormErrors({}); }}
                  className="h-14 flex-1 rounded-2xl border-gray-100 font-normal uppercase text-xs tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-200 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  className="h-14 flex-1 rounded-2xl bg-accent text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95"
                  onClick={(e) => {
                    const form = e.currentTarget.closest('form');
                    if (!form) return;
                    const formData = new FormData(form);
                    const code = formData.get('code') as string;
                    const value = formData.get('value') as string;
                    const desc = formData.get('description') as string;

                    const errors: Record<string, string> = {};
                    if (!code?.trim()) errors.code = "Coupon code is required";
                    if (!value?.trim()) errors.value = "Discount value is required";
                    if (value && parseFloat(value) < 0) errors.value = "Value cannot be negative";
                    if (!desc?.trim()) errors.description = "Description is required";

                    if (Object.keys(errors).length > 0) {
                      setFormErrors(errors);
                      return;
                    }

                    setFormErrors({});
                    setShowAddModal(false);
                  }}
                >
                  Launch Offer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Offers;

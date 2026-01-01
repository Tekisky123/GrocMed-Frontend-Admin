import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { deliveryPartners } from "@/lib/mockData";

const DeliveryPartners = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allPartners = useMemo(() => [
    ...deliveryPartners,
    ...deliveryPartners.map((p, i) => ({
      ...p,
      id: `DP-${String(100 + i).slice(-3)}`,
      name: `Partner ${i + 5}`,
      email: `partner${i + 5}@delivery.com`,
    })),
  ], []);

  const filteredPartners = useMemo(() => {
    return allPartners.filter((partner) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = partner.name.toLowerCase().includes(q) ||
        partner.email.toLowerCase().includes(q) ||
        partner.phone.includes(searchQuery);
      const matchesStatus = !statusFilter || partner.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, allPartners]);

  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPartners.slice(start, start + itemsPerPage);
  }, [filteredPartners, currentPage]);

  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Delivery Partners</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Manage your delivery fleet and status.</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-white font-normal rounded-2xl h-11 px-6 shadow-lg shadow-accent/20 transition-all active:scale-95">
          Add Partner
        </Button>
      </div>

      {/* Stats - Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 gap-4 custom-scrollbar">
        {[
          { label: "Active Fleet", value: allPartners.length, color: "text-primary", icon: Truck },
          { label: "On Duty", value: allPartners.filter(p => p.status === 'active').length, color: "text-green-600", icon: Zap },
          { label: "Avg Rating", value: "4.8⭐", color: "text-accent", icon: Star },
          { label: "Safety Score", value: "98%", color: "text-blue-500", icon: ShieldCheck }
        ].map((stat, i) => (
          <div key={i} className="flex-shrink-0 w-[180px] sm:w-auto p-5 rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 group transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gray-50 rounded-lg group-hover:scale-110 transition-transform">
                <stat.icon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-2xl font-normal ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
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
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Partner Name</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Today's Performance</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[11px] font-normal text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedPartners.map((partner) => (
                <tr key={partner.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-normal text-primary text-xs overflow-hidden border border-gray-50">
                        {partner.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-normal text-gray-900">{partner.name}</p>
                        <p className="text-[11px] text-gray-400 font-normal uppercase tracking-widest">{partner.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-normal text-gray-700">{partner.vehicle}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-normal mt-0.5">Commercial Grade</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                        <span className="text-xs font-normal">{partner.rating}</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-normal">{partner.completedDeliveries}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={`px-2.5 py-1 rounded-lg font-normal text-[10px] uppercase tracking-wider ${partner.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                      {partner.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPartner(partner)}
                      className="h-9 px-4 rounded-xl font-normal text-xs uppercase text-accent hover:bg-accent/5 transition-all"
                    >
                      Audit
                      <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </td>
                </tr>
              ))}
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

      {/* Partner View Modal */}
      {selectedPartner && (
        <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
          <DialogContent className="max-w-xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-primary p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Truck className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-white/20 text-white border-white/20 mb-3 px-3 py-1 rounded-full font-normal text-[10px] uppercase tracking-wider backdrop-blur-sm">
                  {selectedPartner.status.toUpperCase()}
                </Badge>
                <DialogTitle className="text-3xl font-black tracking-tight">{selectedPartner.name}</DialogTitle>
                <p className="opacity-70 font-normal mt-1 text-sm">Managing Partner ID: {selectedPartner.id}</p>
              </div>
            </div>

            <div className="p-8 space-y-8 bg-white">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Support Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    <p className="text-sm font-normal text-gray-900">{selectedPartner.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Phone Link</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <p className="text-sm font-normal text-gray-900">{selectedPartner.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Fleet Performance</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                    <p className="text-xl font-normal text-primary">{selectedPartner.rating}</p>
                    <p className="text-[9px] font-normal text-gray-400 uppercase mt-1">CSAT Score</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                    <p className="text-xl font-normal text-primary">{selectedPartner.completedDeliveries}</p>
                    <p className="text-[9px] font-normal text-gray-400 uppercase mt-1">Completed</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                    <p className="text-xl font-normal text-accent">{selectedPartner.currentOrders}</p>
                    <p className="text-[9px] font-normal text-gray-400 uppercase mt-1">Active Now</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPartner(null)}
                  className="flex-1 h-14 rounded-2xl border-gray-100 font-normal text-xs uppercase text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Close Audit
                </Button>
                <Button className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-normal text-xs uppercase shadow-lg shadow-primary/20 transition-all active:scale-95">
                  Update Profile
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DeliveryPartners;

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
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { deliveryPartners } from "@/lib/mockData";

const DeliveryPartners = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expand partners
  const allPartners = [
    ...deliveryPartners,
    ...deliveryPartners.map((p, i) => ({
      ...p,
      id: `DP-${String(100 + i).slice(-3)}`,
      name: `Partner ${i + 5}`,
      email: `partner${i + 5}@delivery.com`,
    })),
  ];

  // Filter and search
  const filteredPartners = useMemo(() => {
    return allPartners.filter((partner) => {
      const matchesSearch =
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.phone.includes(searchQuery);
      const matchesStatus = !statusFilter || partner.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Pagination
  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPartners.slice(start, start + itemsPerPage);
  }, [filteredPartners, currentPage]);

  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);

  const stats = {
    totalActive: allPartners.filter((p) => p.status === "active").length,
    totalInactive: allPartners.filter((p) => p.status === "inactive").length,
    avgRating: (allPartners.reduce((sum, p) => sum + p.rating, 0) / allPartners.length).toFixed(1),
    totalDeliveries: allPartners.reduce((sum, p) => sum + p.completedDeliveries, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Partners</h1>
          <p className="text-gray-600">Manage delivery partners and their performance</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          + Add Partner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Partners</p>
          <p className="text-2xl font-bold text-gray-900">{allPartners.length}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalActive}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.avgRating}⭐</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Deliveries</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalDeliveries}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border border-gray-200">
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-10"
            />
          </div>
          <select
            value={statusFilter || ""}
            onChange={(e) => {
              setStatusFilter(e.target.value || null);
              setCurrentPage(1);
            }}
            className="px-4 h-10 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Partners Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Partners List</h3>
          <p className="text-sm text-gray-600">
            Showing {paginatedPartners.length} of {filteredPartners.length} partners
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Deliveries
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Current Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{partner.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{partner.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      {partner.vehicle}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1 font-medium">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {partner.rating}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1 font-medium text-gray-900">
                      <Package className="w-4 h-4" />
                      {partner.completedDeliveries}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {partner.currentOrders}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge
                      className={
                        partner.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {partner.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPartner(partner)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      View
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Partner Details Modal */}
      {selectedPartner && (
        <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPartner.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {selectedPartner.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedPartner.phone}
                  </p>
                </div>
              </div>

              {/* Performance */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-4">Performance</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Rating</p>
                    <p className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
                      {selectedPartner.rating}
                      <Star className="w-4 h-4 fill-yellow-400" />
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total Deliveries</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedPartner.completedDeliveries}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Current Orders</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedPartner.currentOrders}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle Type:</span>
                    <span className="font-medium text-gray-900">{selectedPartner.vehicle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge
                      className={
                        selectedPartner.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {selectedPartner.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-gray-200 pt-4">
                <Button variant="outline" onClick={() => setSelectedPartner(null)} className="flex-1">
                  Close
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  Edit Profile
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

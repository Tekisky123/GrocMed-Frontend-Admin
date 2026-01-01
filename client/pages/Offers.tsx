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
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Copy,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { offers } from "@/lib/mockData";

const Offers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expand offers
  const allOffers = [
    ...offers,
    ...offers.map((o, i) => ({
      ...o,
      id: `OFFER-${String(100 + i).slice(-3)}`,
      code: `${o.code}${i}`,
    })),
  ];

  // Filter and search
  const filteredOffers = useMemo(() => {
    return allOffers.filter((offer) => {
      return (
        offer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  // Pagination
  const paginatedOffers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOffers.slice(start, start + itemsPerPage);
  }, [filteredOffers, currentPage]);

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);

  const stats = {
    active: allOffers.filter((o) => o.status === "active").length,
    totalRedemptions: allOffers.reduce((sum, o) => sum + o.usedCount, 0),
    totalPotential: allOffers.reduce((sum, o) => sum + o.maxUses, 0),
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers & Coupons</h1>
          <p className="text-gray-600">Create and manage promotional offers</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Active Offers</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Redemptions</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalRedemptions}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Redemption Rate</p>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round((stats.totalRedemptions / stats.totalPotential) * 100)}%
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by code or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 h-10"
          />
        </div>
      </Card>

      {/* Offers Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Offers</h3>
          <p className="text-sm text-gray-600">
            Showing {paginatedOffers.length} of {filteredOffers.length} offers
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Validity
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
              {paginatedOffers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-mono font-bold text-gray-900">{offer.code}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {offer.description}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {offer.discountType === "percentage"
                      ? `${offer.discountValue}%`
                      : `$${offer.discountValue}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {offer.usedCount} / {offer.maxUses}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-xs">
                    {offer.validFrom} to {offer.validUntil}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge
                      className={
                        offer.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {offer.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(offer.code)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4" />
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

      {/* Create Offer Modal */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Coupon Code</Label>
                  <Input placeholder="e.g., SUMMER50" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <Input placeholder="Brief offer description" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Discount Type</Label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Percentage (%)</option>
                    <option>Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Discount Value</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Min Order Value</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Uses</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Valid From</Label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Valid Until</Label>
                  <Input type="date" className="mt-1" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Enable Offer</Label>
                <Switch defaultChecked />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowAddModal(false)}
                >
                  Create Offer
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Offers;

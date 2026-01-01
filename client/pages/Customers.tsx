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
import { Search, Mail, Phone, ShoppingCart, DollarSign, Calendar, ChevronRight } from "lucide-react";
import { customers } from "@/lib/mockData";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expand customers
  const allCustomers = [
    ...customers,
    ...customers.map((c, i) => ({
      ...c,
      id: `CUST-${String(100 + i).slice(-3)}`,
      name: `Customer ${i + 5}`,
      email: `customer${i + 5}@example.com`,
    })),
  ];

  // Filter and search
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery);
      return matchesSearch;
    });
  }, [searchQuery]);

  // Pagination
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer base and their orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">{allCustomers.length}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {allCustomers.filter((c) => c.status === "active").length}
          </p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">
            ${allCustomers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(0)}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 border border-gray-200">
        <div className="relative">
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
      </Card>

      {/* Customers Table */}
      <Card className="border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Customers List</h3>
          <p className="text-sm text-gray-600">
            Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
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
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Spent
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
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{customer.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1 mb-1">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1 font-medium text-gray-900">
                      <ShoppingCart className="w-4 h-4" />
                      {customer.totalOrders}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      ${customer.totalSpent.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge
                      className={
                        customer.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {customer.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(customer)}
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

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCustomer.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Profile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {selectedCustomer.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedCustomer.phone}
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-4">
                  Order Statistics
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedCustomer.totalOrders}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedCustomer.totalSpent.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${(selectedCustomer.totalSpent / selectedCustomer.totalOrders).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Last Order */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Last Order</p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.lastOrder}</p>
                </div>
              </div>

              {/* Status */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Status</p>
                <Badge
                  className={
                    selectedCustomer.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {selectedCustomer.status.toUpperCase()}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-gray-200 pt-4">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="flex-1">
                  Close
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Customers;

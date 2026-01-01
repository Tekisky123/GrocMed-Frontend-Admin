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
import { Search, Mail, Phone, ShoppingCart, User, Calendar, ChevronRight, PieChart } from "lucide-react";
import { customers } from "@/lib/mockData";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allCustomers = useMemo(() => [
    ...customers,
    ...customers.map((c, i) => ({
      ...c,
      id: `CUST-${String(100 + i).slice(-3)}`,
      name: `Customer ${i + 5}`,
      email: `customer${i + 5}@example.com`,
    })),
  ], []);

  const filteredCustomers = useMemo(() => {
    return allCustomers.filter((customer) => {
      const q = searchQuery.toLowerCase();
      return customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.phone.includes(searchQuery);
    });
  }, [searchQuery, allCustomers]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">View and manage your registered customers.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl ring-1 ring-gray-100 shadow-sm">
          <div className="px-4 py-2 bg-primary/5 text-primary rounded-xl font-normal text-xs uppercase tracking-widest">
            {allCustomers.length} Users
          </div>
        </div>
      </div>

      {/* Stats - Grid layout optimized for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 group transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Growth</p>
              <p className="text-2xl font-normal text-gray-900">Active Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 group transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center transition-transform group-hover:scale-110">
              <ShoppingCart className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Interaction</p>
              <p className="text-2xl font-normal text-gray-900">Top Buyers</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 group transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center transition-transform group-hover:scale-110">
              <PieChart className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Retention</p>
              <p className="text-2xl font-normal text-gray-900">User Lifetime</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 sm:p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by name, email, or mobile number..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-11 h-12 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all"
          />
        </div>
      </Card>

      {/* Table Section */}
      <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Customer Details</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Orders</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[11px] font-normal text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center font-normal text-primary text-xs">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-normal text-gray-900">{customer.name}</p>
                        <p className="text-[11px] text-gray-400 font-normal uppercase tracking-widest">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-normal">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-normal">{customer.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs font-normal text-gray-900">{customer.totalOrders}</p>
                        <p className="text-[10px] text-gray-400 font-normal uppercase tracking-tighter">Orders</p>
                      </div>
                      <div>
                        <p className="text-xs font-normal text-primary">₹{customer.totalSpent.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 font-normal uppercase tracking-tighter">Spent</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={`px-2.5 py-1 rounded-lg font-normal text-[10px] uppercase tracking-wider ${customer.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(customer)}
                      className="h-9 px-4 rounded-xl font-normal text-xs uppercase text-accent hover:bg-accent/5 transition-all"
                    >
                      Profile
                      <ChevronRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
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
            Entry <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="h-9 px-5 rounded-xl font-normal text-[10px] border-gray-100"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="h-9 px-5 rounded-xl font-normal text-[10px] border-gray-100"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Customer Full View Dialog */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="h-32 bg-gradient-to-r from-primary to-primary-600 relative">
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-xl">
                  <div className="w-full h-full rounded-[14px] bg-primary/5 flex items-center justify-center font-normal text-primary text-2xl">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 pt-14 pb-8 space-y-8 bg-white">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedCustomer.name}</h2>
                <p className="text-xs text-gray-400 font-normal uppercase tracking-widest mt-0.5">{selectedCustomer.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl bg-gray-50 border border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-normal text-gray-900">{selectedCustomer.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Mobile Number</p>
                  <p className="text-sm font-normal text-gray-900">{selectedCustomer.phone}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-normal text-gray-400 uppercase tracking-widest ml-1">Engagement Metrics</h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* Stat Items */}
                  <div className="p-4 rounded-2xl bg-white ring-1 ring-gray-100 text-center">
                    <p className="text-xs font-normal text-primary">{selectedCustomer.totalOrders}</p>
                    <p className="text-[9px] font-normal text-gray-400 uppercase mt-1">Orders</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white ring-1 ring-gray-100 text-center">
                    <p className="text-xs font-normal text-primary">₹{selectedCustomer.totalSpent}</p>
                    <p className="text-[9px] font-normal text-gray-400 uppercase mt-1">Value</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white ring-1 ring-gray-100 text-center">
                    <p className="text-xs font-normal text-primary">4.8</p>
                    <p className="text-[9px] font-normal text-gray-400 uppercase mt-1">Rating</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 h-14 rounded-2xl border-gray-100 font-normal uppercase text-xs tracking-widest text-gray-400"
                >
                  Close Profile
                </Button>
                <Button className="flex-1 h-14 rounded-2xl bg-primary text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">
                  Send Alert
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

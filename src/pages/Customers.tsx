import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  User,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  Package,
  FileText,
} from "lucide-react";
import { customerApi, Customer } from "@/api/customerApi";
import { toast } from "sonner";
import { format } from "date-fns";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Fetch all customers
  const { data: customersResponse, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customerApi.getAllCustomers,
  });

  const allCustomers = customersResponse?.data || [];

  // Filter customers locally
  const filteredCustomers = useMemo(() => {
    return allCustomers;
  }, [allCustomers]);

  // Paginated customers
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: customerApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success("Customer deleted successfully!");
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete customer");
    },
  });

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const response = await customerApi.searchCustomers(searchQuery);
        toast.success(`Found ${response.data?.length || 0} customers`);
      } catch (error) {
        toast.error("Search failed");
      }
    }
  };

  const handleDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete._id);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">View and manage your customer database.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 rounded-full border-blue-200 bg-blue-50 text-blue-700 font-normal">
            {filteredCustomers.length} Total
          </Badge>
          <Badge variant="outline" className="px-3 py-1 rounded-full border-green-200 bg-green-50 text-green-700 font-normal">
            {allCustomers.filter((c: Customer) => c.isActive).length} Active
          </Badge>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="p-5 sm:p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Filter className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-black text-gray-900 tracking-tight">Search & Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-11 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 pl-11 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white"
              />
            </div>

            <Button
              onClick={handleSearch}
              className="md:col-span-1 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-normal shadow-lg shadow-blue-500/30"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Addresses</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[11px] font-normal text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm font-normal text-blue-600 mt-6 tracking-widest uppercase">Loading Customers...</p>
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 font-normal uppercase text-xs tracking-widest">
                    No customers found
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer: Customer) => (
                  <tr key={customer._id} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center font-bold text-blue-600 text-sm border border-blue-100">
                          {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{customer.name || "Unknown Customer"}</p>
                          {customer.shopName && (
                            <p className="text-[11px] font-bold text-indigo-600 mt-0.5">{customer.shopName}</p>
                          )}
                          <p className="text-[10px] text-gray-400 font-normal mt-0.5">
                            ID: {customer._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-normal text-gray-700">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-normal text-gray-700">{customer.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-normal text-gray-700">
                          {customer.addresses?.length || 0} Address{customer.addresses?.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-normal text-gray-700">
                          {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge
                        className={`px-3 py-1.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider border inline-flex items-center gap-1.5 ${customer.isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                      >
                        {customer.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                          className="h-9 px-4 rounded-xl font-normal text-xs uppercase text-blue-600 hover:bg-blue-50"
                        >
                          Details
                          <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCustomerToDelete(customer);
                            setShowDeleteModal(true);
                          }}
                          className="h-9 px-4 rounded-xl font-normal text-xs uppercase text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              Delete Customer?
            </DialogTitle>
            <p className="text-sm text-gray-500 font-normal mt-1">
              This action cannot be undone
            </p>
          </DialogHeader>

          {customerToDelete && (
            <div className="py-4">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                <p className="text-sm font-semibold text-gray-900">{customerToDelete?.name || "Unknown Customer"}</p>
                <p className="text-xs text-gray-600 mt-1">{customerToDelete?.email || "N/A"}</p>
                <p className="text-xs text-gray-600">{customerToDelete?.phone || "N/A"}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteMutation.isPending}
              className="flex-1 h-12 rounded-2xl border-gray-100 font-normal uppercase text-xs tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-red-500/30"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Customer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-4xl rounded-[32px] p-0 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
            <CustomerDetailsModal customerId={selectedCustomer._id} onClose={() => setSelectedCustomer(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Customer Details Modal Component
const CustomerDetailsModal = ({ customerId, onClose }: { customerId: string; onClose: () => void }) => {
  const { data: customerDetailsResponse, isLoading } = useQuery({
    queryKey: ['customer-details', customerId],
    queryFn: () => customerApi.getCustomerById(customerId),
  });

  const customerDetails = customerDetailsResponse?.data;

  if (isLoading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm font-normal text-blue-600 mt-6 tracking-widest uppercase">Loading Customer Details...</p>
      </div>
    );
  }

  if (!customerDetails) {
    return (
      <div className="p-20 text-center">
        <p className="text-sm text-gray-500">Customer not found</p>
      </div>
    );
  }

  const { customer, orders, orderCount, totalSpent } = customerDetails;

  return (
    <>
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-white px-8 pt-8 pb-6 rounded-t-[32px]">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            Customer Profile
          </DialogTitle>
          <p className="text-sm text-gray-500 font-normal mt-1">
            ID: {customer._id.slice(-8).toUpperCase()}
          </p>
        </DialogHeader>
      </div>

      <div className="px-8 pb-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-50/30 border border-green-100">
            <p className="text-xs font-normal text-gray-500 uppercase tracking-widest">Total Orders</p>
            <p className="text-2xl font-black text-green-700 mt-1">{orderCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-50/30 border border-purple-100">
            <p className="text-xs font-normal text-gray-500 uppercase tracking-widest">Total Spent</p>
            <p className="text-2xl font-black text-purple-700 mt-1">₹{totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-blue-50/20 border border-blue-100">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Personal Information</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">{customer?.name || "Unknown Customer"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-normal text-gray-700">{customer.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-normal text-gray-700">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-normal text-gray-700">
                Joined {format(new Date(customer.createdAt), 'MMMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {customer.isActive ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm font-semibold ${customer.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                {customer.isActive ? 'Active Account' : 'Inactive Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Business & Documents */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/20 border border-indigo-100/80 shadow-sm space-y-6">
          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Business & Verification</h4>
            <p className="text-xs text-gray-500 font-normal">Customer identity and shop registration status.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Shop & Identity Details */}
            <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100/80 space-y-4 md:col-span-1">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Shop Details</p>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-900 truncate">{customer.shopName || "Not Provided"}</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Aadhaar Number</p>
                <span className="text-sm font-semibold text-gray-800">{customer.adhaar || "N/A"}</span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Shop License / GST</p>
                <span className="text-sm font-semibold text-gray-800">{customer.licenseNumber || "N/A"}</span>
              </div>
            </div>

            {/* Documents Section */}
            <div className="md:col-span-2 space-y-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verification Documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Aadhaar Card Card */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between space-y-3 group/doc hover:border-blue-200 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Aadhaar Card
                    </span>
                    {customer.adhaarImage && (
                      <Badge className="bg-green-50 text-green-700 border border-green-200 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  
                  {customer.adhaarImage ? (
                    <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center group-hover/doc:shadow-md transition-shadow duration-300">
                      <img 
                        src={customer.adhaarImage} 
                        alt="Aadhaar Card" 
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/2] w-full rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center p-3 text-center">
                      <XCircle className="w-6 h-6 text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400 font-medium">Aadhaar card image missing</span>
                    </div>
                  )}

                  {customer.adhaarImage && (
                    <div className="flex gap-2">
                      <a 
                        href={customer.adhaarImage} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded-xl transition-colors border border-blue-100/50 text-center"
                      >
                        View Full Image
                      </a>
                    </div>
                  )}
                </div>

                {/* Shop License Card */}
                <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between space-y-3 group/doc hover:border-blue-200 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-500" />
                      Shop License / GST
                    </span>
                    {customer.licenseImage ? (
                      <Badge className="bg-green-50 text-green-700 border border-green-200 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                        Optional
                      </Badge>
                    )}
                  </div>
                  
                  {customer.licenseImage ? (
                    <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center group-hover/doc:shadow-md transition-shadow duration-300">
                      <img 
                        src={customer.licenseImage} 
                        alt="Shop License" 
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/2] w-full rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center p-3 text-center">
                      <XCircle className="w-6 h-6 text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400 font-medium">License image missing</span>
                    </div>
                  )}

                  {customer.licenseImage && (
                    <div className="flex gap-2">
                      <a 
                        href={customer.licenseImage} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded-xl transition-colors border border-blue-100/50 text-center"
                      >
                        View Full Image
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        {customer.addresses && customer.addresses.length > 0 && (
          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">
              Saved Addresses ({customer.addresses.length})
            </h4>
            <div className="space-y-3">
              {customer.addresses.map((address) => (
                <div key={address._id} className="p-5 rounded-2xl bg-gradient-to-br from-orange-50/50 to-orange-50/20 border border-orange-100">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 border-orange-200 text-[9px] font-bold uppercase">
                          {address.type}
                        </Badge>
                        {address.isDefault && (
                          <Badge className="px-2 py-0.5 rounded bg-green-100 text-green-700 border-green-200 text-[9px] font-bold uppercase">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-normal text-gray-700">{address.street}</p>
                      <p className="text-sm font-normal text-gray-700">
                        {address.city}, {address.state} - {address.zip}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order History */}
        {orders && orders.length > 0 && (
          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">
              Order History ({orders.length})
            </h4>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-indigo-50/20 border border-indigo-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="text-xs font-mono font-semibold text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <Badge className={`px-2 py-1 rounded-lg font-semibold text-[9px] uppercase ${order.orderStatus === 'Delivered'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : order.orderStatus === 'Cancelled'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                          {order.orderStatus}
                        </Badge>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item._id} className="flex items-center gap-2 text-xs text-gray-600">
                            <Package className="w-3 h-3 text-gray-400" />
                            <span>{item.name} × {item.quantity}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-semibold">₹{item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-gray-400 mt-3">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-normal text-gray-500 uppercase tracking-widest">Total</p>
                      <p className="text-lg font-black text-indigo-700">₹{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Customers;

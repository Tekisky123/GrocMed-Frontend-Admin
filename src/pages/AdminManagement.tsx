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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Edit2, Loader2, Trash2 } from "lucide-react";
import { adminApi } from "@/api/adminApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const AdminManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [role, setRole] = useState("admin");
  const itemsPerPage = 10;

  // Fetch all admins
  const { data: adminsResponse, isLoading, isError } = useQuery({
    queryKey: ["admins"],
    queryFn: adminApi.getAllAdmins,
  });

  const admins = adminsResponse?.data || [];

  // Create admin mutation
  const createMutation = useMutation({
    mutationFn: adminApi.createAdmin,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || "Admin created successfully");
        queryClient.invalidateQueries({ queryKey: ["admins"] });
        setShowAddModal(false);
      }
    },
  });

  // Update admin mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateAdmin(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || "Admin updated successfully");
        queryClient.invalidateQueries({ queryKey: ["admins"] });
        setEditingUser(false);
        setSelectedUser(null);
      }
    },
  });

  // Delete admin mutation
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteAdmin,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || "Admin deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["admins"] });
        setUserToDelete(null);
      }
    },
  });

  const filteredUsers = useMemo(() => {
    return admins.filter((user: any) => {
      const q = searchQuery.toLowerCase();
      return user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
    });
  }, [searchQuery, admins]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const name = data.name as string;
    const email = data.email as string;
    const password = data.password as string;
    const isActive = editingUser ? (formData.get("isActive") === "on") : true;

    const errors: Record<string, string> = {};
    if (!name?.trim()) errors.name = "Full name is required";
    if (!email?.trim()) errors.email = "Email address is required";
    if (showAddModal && !password?.trim()) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix errors");
      return;
    }

    setFormErrors({});

    const payload: any = { name, email, role };
    if (password) payload.password = password;
    if (editingUser) payload.isActive = isActive;

    if (showAddModal) {
      createMutation.mutate(payload);
    } else if (editingUser && selectedUser) {
      updateMutation.mutate({ id: selectedUser._id, data: payload });
    }
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Admin Users</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Manage admin accounts and permissions.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setRole("admin");
            setShowAddModal(true);
          }}
          className="bg-accent hover:bg-accent/90 text-white font-normal rounded-2xl h-11 px-6 shadow-lg shadow-accent/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Admin
        </Button>
      </div>



      {/* Search Bar */}
      <Card className="p-4 sm:p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search admins by name or corporate email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-11 h-12 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all"
          />
        </div>
      </Card>

      {/* Admin Table */}
      <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Admin Name</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Record Added</th>
                <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-[11px] font-normal text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-normal text-gray-400 mt-4">Loading admins...</p>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-sm font-normal text-gray-400">No admins found</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user: any) => (
                  <tr key={user._id} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-normal text-gray-400 text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-normal text-gray-900">{user.name}</p>
                          <p className="text-[11px] text-gray-400 font-normal">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={`px-2.5 py-1 rounded-lg font-normal text-[10px] uppercase tracking-wider ${user.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-normal text-gray-900 uppercase tracking-widest">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-xs font-normal text-gray-900 uppercase tracking-widest">{user.isActive ? 'active' : 'inactive'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedUser(user); setRole(user.role || "admin"); setEditingUser(true); }}
                        className="h-10 w-10 rounded-xl text-accent hover:bg-accent/5 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserToDelete(user._id)}
                        className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
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
            Records <span className="text-gray-900">{currentPage}</span> / {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="h-10 px-5 rounded-xl font-normal text-[10px] border-gray-100"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="h-10 px-5 rounded-xl font-normal text-[10px] border-gray-100"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Control Modal - Refined UI */}
      {(editingUser || showAddModal) && (
        <Dialog open={editingUser || showAddModal} onOpenChange={(val) => {
          if (!val) {
            setEditingUser(false);
            setShowAddModal(false);
            setSelectedUser(null);
            setFormErrors({});
          }
        }}>
          <DialogContent className="max-w-xl rounded-[32px] p-8 border-none shadow-2xl">
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                  {showAddModal ? "Add New Admin" : "Edit Admin"}
                </DialogTitle>
                <p className="text-sm text-gray-400 font-normal mt-1">Configure user role and system permissions.</p>
              </DialogHeader>

              <div className="space-y-5 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Full Name <span className="text-red-500 font-black">*</span></Label>
                    <Input
                      name="name"
                      defaultValue={selectedUser?.name}
                      className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal transition-all ${formErrors.name ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                    />
                    {formErrors.name && <p className="text-[9px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Email ID <span className="text-red-500 font-black">*</span></Label>
                    <Input
                      name="email"
                      type="email"
                      defaultValue={selectedUser?.email}
                      className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal transition-all ${formErrors.email ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                    />
                    {formErrors.email && <p className="text-[9px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Password {showAddModal && <span className="text-red-500 font-black">*</span>}</Label>
                    <Input
                      name="password"
                      type="password"
                      placeholder={editingUser ? "Leave blank to keep current" : ""}
                      className={`h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal transition-all ${formErrors.password ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                    />
                    {formErrors.password && <p className="text-[9px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.password}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-normal text-gray-400 uppercase tracking-widest ml-1">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {editingUser && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="isActive" defaultChecked={selectedUser?.isActive} id="isActive" className="rounded" />
                    <Label htmlFor="isActive" className="text-xs font-normal text-gray-400 uppercase tracking-widest">Account Active</Label>
                  </div>
                )}

                <DialogFooter className="pt-6 sm:justify-start flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setEditingUser(false); setShowAddModal(false); setSelectedUser(null); }}
                    className="h-14 flex-1 rounded-2xl border-gray-100 font-normal uppercase text-xs tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-200 transition-all"
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="h-14 flex-1 rounded-2xl bg-accent text-white font-normal uppercase text-xs tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Admin
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Admin?"
        description="This will permanently remove this admin's access to the system. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminManagement;

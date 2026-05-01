import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImagePlus, Trash2, Edit2, Loader2, Plus, X, MonitorPlay } from "lucide-react";
import { bannerApi } from "@/api/bannerApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const Banners = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const { data: bannersRes, isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: bannerApi.getBanners,
  });

  const createMutation = useMutation({
    mutationFn: bannerApi.createBanner,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner created successfully");
      resetForm();
      setShowAddModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create banner");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      bannerApi.updateBanner(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner updated successfully");
      resetForm();
      setEditingBanner(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update banner");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bannerApi.deleteBanner,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted successfully");
      setConfirmDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete banner");
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLink("");
    setImage("");
    setDisplayOrder("0");
    setIsActive(true);
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setTitle(banner.title || "");
    setDescription(banner.description || "");
    setLink(banner.link || "");
    setImage(banner.image);
    setDisplayOrder(banner.displayOrder?.toString() || "0");
    setIsActive(banner.isActive);
  };

  const handleSubmit = () => {
    if (!image) {
      toast.error("Banner image is required");
      return;
    }

    const payload = {
      title,
      description,
      link,
      image,
      displayOrder: parseInt(displayOrder) || 0,
      isActive,
    };

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <MonitorPlay className="w-8 h-8 text-primary" />
            Home Banners
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage promotional banners for the customer app home page.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["banners"] })}
            className="rounded-2xl h-12 px-4 border-gray-200"
          >
            <Loader2 className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="rounded-2xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New Banner
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bannersRes?.data?.map((banner: any) => (
            <Card key={banner._id} className="group overflow-hidden rounded-3xl border-none shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="aspect-[21/9] relative bg-gray-100">
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className={`${banner.isActive ? "bg-green-500" : "bg-gray-500"} text-white border-none`}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => handleEdit(banner)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => setConfirmDelete(banner._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{banner.title || "Untitled Banner"}</h3>
                  <Badge variant="outline" className="font-black text-[10px]">ORDER: {banner.displayOrder}</Badge>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{banner.description || "No description provided."}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || !!editingBanner} onOpenChange={() => { setShowAddModal(false); setEditingBanner(null); }}>
        <DialogContent className="max-w-xl rounded-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">
              {editingBanner ? "Edit Banner" : "Add New Banner"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Banner Image</Label>
              <div className="relative aspect-[21/9] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover" />
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-2 right-2 rounded-full w-8 h-8"
                      onClick={() => setImage("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-500">Upload Banner (21:9 recommended)</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo Title" />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." className="min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <Label>Link (Optional)</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="e.g. /category/biscuits" />
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="active" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <Label htmlFor="active" className="cursor-pointer">Show this banner on Home Page</Label>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => { setShowAddModal(false); setEditingBanner(null); }} className="rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl bg-primary hover:bg-primary/90 font-bold px-8 shadow-lg shadow-primary/20"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingBanner ? "Update Banner" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete)}
        title="Delete Banner?"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="No, Keep it"
        variant="destructive"
      />
    </div>
  );
};

export default Banners;

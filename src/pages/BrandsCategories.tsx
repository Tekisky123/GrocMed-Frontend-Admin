import { useState, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ImagePlus,
  Loader2,
  X,
  Tags,
  FolderOpen,
  Power,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { brandApi, Brand } from "@/api/brandApi";
import { categoryApi, CategoryAdminResponse } from "@/api/categoryApi";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const BrandsCategories = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("brands");

  // Search states
  const [brandSearch, setBrandSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // Brand Modal States
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [brandActive, setBrandActive] = useState(true);

  // Category Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryAdminResponse | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryActive, setCategoryActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  // Delete Confirmations
  const [confirmDeleteBrand, setConfirmDeleteBrand] = useState<string | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);

  // --- BRAND QUERIES & MUTATIONS ---
  const { data: brandsRes, isLoading: isBrandsLoading } = useQuery({
    queryKey: ["brands-admin"],
    queryFn: brandApi.getAllBrandsAdmin,
  });

  const createBrandMutation = useMutation({
    mutationFn: brandApi.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-admin"] });
      toast.success("Brand created successfully");
      closeBrandModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create brand");
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => brandApi.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-admin"] });
      toast.success("Brand updated successfully");
      closeBrandModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update brand");
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: brandApi.deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-admin"] });
      toast.success("Brand deleted successfully");
      setConfirmDeleteBrand(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete brand");
    },
  });

  // --- CATEGORY QUERIES & MUTATIONS ---
  const { data: categoriesRes, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: categoryApi.getAllCategoriesAdmin,
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      toast.success("Category created successfully");
      closeCategoryModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create category");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => categoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      toast.success("Category updated successfully");
      closeCategoryModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update category");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      toast.success("Category deleted successfully");
      setConfirmDeleteCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete category");
    },
  });

  // --- HANDLERS ---
  const openBrandModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandName(brand.name);
      setBrandDesc(brand.description || "");
      setBrandActive(brand.isActive);
    } else {
      setEditingBrand(null);
      setBrandName("");
      setBrandDesc("");
      setBrandActive(true);
    }
    setShowBrandModal(true);
  };

  const closeBrandModal = () => {
    setShowBrandModal(false);
    setEditingBrand(null);
    setBrandName("");
    setBrandDesc("");
    setBrandActive(true);
  };

  const handleBrandSave = () => {
    if (!brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    const payload = {
      name: brandName.trim(),
      description: brandDesc.trim(),
      isActive: brandActive,
    };
    if (editingBrand) {
      updateBrandMutation.mutate({ id: editingBrand._id, data: payload });
    } else {
      createBrandMutation.mutate(payload);
    }
  };

  const openCategoryModal = (cat?: CategoryAdminResponse) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
      setCategoryActive(cat.isActive);
      setImagePreview(cat.image || null);
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategoryActive(true);
      setImagePreview(null);
    }
    setSelectedFile(null);
    setRemoveCurrentImage(false);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryActive(true);
    setSelectedFile(null);
    setImagePreview(null);
    setRemoveCurrentImage(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveCurrentImage(false);
    }
  };

  const handleCategorySave = () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const formData = new FormData();
    formData.append("name", categoryName.trim());
    formData.append("isActive", String(categoryActive));
    if (selectedFile) {
      formData.append("image", selectedFile);
    }
    if (removeCurrentImage) {
      formData.append("removeImage", "true");
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory._id, data: formData });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  // --- FILTERS ---
  const filteredBrands = useMemo(() => {
    const list = brandsRes?.data || [];
    if (!brandSearch.trim()) return list;
    return list.filter((b: Brand) =>
      b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
      b.description?.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [brandsRes, brandSearch]);

  const filteredCategories = useMemo(() => {
    const list = categoriesRes?.data || [];
    if (!categorySearch.trim()) return list;
    return list.filter((c: CategoryAdminResponse) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categoriesRes, categorySearch]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Tags className="w-8 h-8 text-primary" />
            Brands & Categories
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">
            Manage brands and product categories available in the marketplace catalog.
          </p>
        </div>
        <Button
          onClick={() => {
            if (activeTab === "brands") {
              openBrandModal();
            } else {
              openCategoryModal();
            }
          }}
          className="bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest rounded-2xl h-11 px-6 shadow-lg shadow-accent/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add {activeTab === "brands" ? "Brand" : "Category"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-gray-100 p-1.5 rounded-2xl h-14 w-full sm:w-[400px] shadow-sm mb-6 flex gap-1">
          <TabsTrigger
            value="brands"
            className="flex-1 rounded-xl font-bold text-sm tracking-tight h-10 data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
          >
            <Tags className="w-4 h-4 mr-2" />
            Brands
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="flex-1 rounded-xl font-bold text-sm tracking-tight h-10 data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Brands Content */}
        <TabsContent value="brands" className="space-y-6">
          <Card className="p-4 sm:p-5 border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search brands by identity..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="pl-11 h-14 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all font-normal"
              />
            </div>
          </Card>

          <Card className="border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Brand Name</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isBrandsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                        <p className="text-sm font-normal text-primary mt-6 tracking-widest uppercase">Loading Brands...</p>
                      </td>
                    </tr>
                  ) : filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 font-normal uppercase text-xs tracking-widest">No brands found</td>
                    </tr>
                  ) : (
                    filteredBrands.map((brand: Brand) => (
                      <tr key={brand._id} className="group hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-gray-900 tracking-tight">{brand.name}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-500 font-normal max-w-sm truncate">{brand.description || "No description"}</p>
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className={`px-2.5 py-1 rounded-lg font-normal text-[9px] uppercase tracking-wider ${brand.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-700 border-gray-100"}`}>
                            {brand.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openBrandModal(brand)}
                            className="w-10 h-10 rounded-xl text-accent hover:bg-accent/5 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newStatus = !brand.isActive;
                              updateBrandMutation.mutate({
                                id: brand._id,
                                data: { ...brand, isActive: newStatus },
                              });
                            }}
                            className="w-10 h-10 rounded-xl text-indigo-500 hover:bg-indigo-50 p-0"
                            title="Toggle Status"
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteBrand(brand._id)}
                            className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 p-0"
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
          </Card>
        </TabsContent>

        {/* Categories Content */}
        <TabsContent value="categories" className="space-y-6">
          <Card className="p-4 sm:p-5 border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search categories by name..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-11 h-14 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all font-normal"
              />
            </div>
          </Card>

          <Card className="border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Image</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Name</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Products</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isCategoriesLoading ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                        <p className="text-sm font-normal text-primary mt-6 tracking-widest uppercase">Loading Categories...</p>
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-400 font-normal uppercase text-xs tracking-widest">No categories found</td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat: CategoryAdminResponse) => (
                      <tr key={cat._id} className="group hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-5">
                          {cat.image ? (
                            <img src={cat.image} className="w-12 h-12 rounded-xl object-cover bg-gray-50 ring-1 ring-gray-100 shadow-sm" alt="" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center ring-1 ring-gray-100">
                              <FolderOpen className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-black text-gray-900 tracking-tight">{cat.name}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold ring-1 ring-violet-100">
                            {cat.productCount} Items
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className={`px-2.5 py-1 rounded-lg font-normal text-[9px] uppercase tracking-wider ${cat.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-700 border-gray-100"}`}>
                            {cat.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCategoryModal(cat)}
                            className="w-10 h-10 rounded-xl text-accent hover:bg-accent/5 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const formData = new FormData();
                              formData.append("isActive", String(!cat.isActive));
                              updateCategoryMutation.mutate({
                                id: cat._id,
                                data: formData,
                              });
                            }}
                            className="w-10 h-10 rounded-xl text-indigo-500 hover:bg-indigo-50 p-0"
                            title="Toggle Status"
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteCategory(cat._id)}
                            className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 p-0"
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
          </Card>
        </TabsContent>
      </Tabs>

      {/* Brand Dialog */}
      <Dialog open={showBrandModal} onOpenChange={(open) => !open && closeBrandModal()}>
        <DialogContent className="max-w-xl rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
              {editingBrand ? "Edit Brand Details" : "Add Brand"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Brand Name</Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Britannia, Parle"
                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Description</Label>
              <Textarea
                value={brandDesc}
                onChange={(e) => setBrandDesc(e.target.value)}
                placeholder="Provide a brief description..."
                className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white min-h-[100px] text-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="brand-active"
                checked={brandActive}
                onChange={(e) => setBrandActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
              />
              <Label htmlFor="brand-active" className="text-sm font-bold text-gray-700 cursor-pointer">
                Mark as active
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeBrandModal} className="rounded-xl font-bold h-12">
              Cancel
            </Button>
            <Button
              onClick={handleBrandSave}
              disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
              className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-6 h-12 shadow-lg shadow-primary/20"
            >
              {(createBrandMutation.isPending || updateBrandMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingBrand ? "Save Changes" : "Create Brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryModal} onOpenChange={(open) => !open && closeCategoryModal()}>
        <DialogContent className="max-w-xl rounded-[32px] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
              {editingCategory ? "Edit Category Details" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Category Banner Image</Label>
              <div className="relative aspect-[21/9] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} className="w-full h-full object-cover" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 rounded-full w-8 h-8"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedFile(null);
                        setRemoveCurrentImage(true);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-500">Upload Category Banner (21:9)</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Category Name</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Chips & Snacks, Beverages"
                className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cat-active"
                checked={categoryActive}
                onChange={(e) => setCategoryActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
              />
              <Label htmlFor="cat-active" className="text-sm font-bold text-gray-700 cursor-pointer">
                Mark as active
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeCategoryModal} className="rounded-xl font-bold h-12">
              Cancel
            </Button>
            <Button
              onClick={handleCategorySave}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-6 h-12 shadow-lg shadow-primary/20"
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={!!confirmDeleteBrand}
        onClose={() => setConfirmDeleteBrand(null)}
        onConfirm={() => confirmDeleteBrand && deleteBrandMutation.mutate(confirmDeleteBrand)}
        title="Delete Brand?"
        description="Are you sure you want to delete this brand? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="No, Keep it"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={!!confirmDeleteCategory}
        onClose={() => setConfirmDeleteCategory(null)}
        onConfirm={() => confirmDeleteCategory && deleteCategoryMutation.mutate(confirmDeleteCategory)}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="No, Keep it"
        variant="destructive"
      />
    </div>
  );
};

export default BrandsCategories;

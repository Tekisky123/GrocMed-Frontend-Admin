import { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Search, Plus, Edit2, Loader2, Trash2, ImagePlus, X, Package, Crop, Calendar, TrendingUp, Calculator, ChevronDown, ChevronUp, PackagePlus } from "lucide-react";
import { productApi } from "@/api/productApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ImageCropper } from "@/components/products/ImageCropper";
import { brandApi } from "@/api/brandApi";
import { categoryApi } from "@/api/categoryApi";


const Products = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch active categories and brands dynamically
  const { data: categoriesRes } = useQuery({
    queryKey: ["categories-active"],
    queryFn: categoryApi.getAllCategories,
  });

  const { data: brandsRes } = useQuery({
    queryKey: ["brands-active"],
    queryFn: brandApi.getAllBrands,
  });

  const categoriesList = useMemo(() => {
    return categoriesRes?.data?.map((c: any) => c.name) || [];
  }, [categoriesRes]);

  const brandsList = useMemo(() => {
    return brandsRes?.data?.map((b: any) => b.name) || [];
  }, [brandsRes]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Image handling
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [croppingImage, setCroppingImage] = useState<{ index: number; url: string } | null>(null);

  // Confirmation states
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: "product" | "image"; url?: string } | null>(null);

  // Form states
  const [formCategory, setFormCategory] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formGstRate, setFormGstRate] = useState("0");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Multi-Packaging Options state ──────────────────────────────────────────
  interface PackagingOption {
    id: string;
    label: string;
    unitsPerPack: number | string;
    mrp: number | string;
    salePrice: number | string;
    minQty: number | string;
    stock: number | string;
    expanded: boolean;
  }
  const [packagingOptions, setPackagingOptions] = useState<PackagingOption[]>([]);

  const addPackagingOption = () => {
    setPackagingOptions(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      label: "",
      unitsPerPack: 1,
      mrp: "",
      salePrice: "",
      minQty: 1,
      stock: "",
      expanded: true,
    }]);
  };

  const removePackagingOption = (id: string) => {
    setPackagingOptions(prev => prev.filter(o => o.id !== id));
  };

  const updatePackagingOption = (id: string, field: keyof PackagingOption, value: any) => {
    setPackagingOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const togglePackagingExpanded = (id: string) => {
    setPackagingOptions(prev => prev.map(o => o.id === id ? { ...o, expanded: !o.expanded } : o));
  };

  const itemsPerPage = 8;

  // Fetch all products for admin
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ["products-admin"],
    queryFn: productApi.getAllProductsForAdmin,
  });

  const products = productsResponse?.data || [];

  // Reset form states when modal opens/closes
  useEffect(() => {
    if (editingProduct && selectedProduct) {
      setFormCategory(selectedProduct.category || "");
      setFormBrand(selectedProduct.brand || "");
      setFormGstRate(selectedProduct.gstRate?.toString() || "0");
      // Load existing packaging options for editing
      if (selectedProduct.packagingOptions?.length > 0) {
        setPackagingOptions(selectedProduct.packagingOptions.map((o: any) => ({
          id: o._id || Math.random().toString(36).slice(2),
          label: o.label || "",
          unitsPerPack: o.unitsPerPack || 1,
          mrp: o.mrp ?? "",
          salePrice: o.salePrice ?? "",
          minQty: o.minQty || 1,
          stock: o.stock ?? "",
          expanded: false,
        })));
      } else {
        setPackagingOptions([]);
      }
    } else if (showAddModal) {
      setFormCategory("");
      setFormBrand("");
      setFormGstRate("0");
      setPackagingOptions([]);
    }
  }, [editingProduct, showAddModal, selectedProduct]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || "Product created successfully");
        queryClient.invalidateQueries({ queryKey: ["products-admin"] });
        handleCloseModal();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => productApi.updateProduct(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || "Product updated successfully");
        queryClient.invalidateQueries({ queryKey: ["products-admin"] });
        handleCloseModal();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message || "Product deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["products-admin"] });
        setConfirmDelete(null);
      }
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => productApi.deleteProductImage(id, url),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Image removed");
        queryClient.invalidateQueries({ queryKey: ["products-admin"] });
        setSelectedProduct(response.data);
        setConfirmDelete(null);
      }
    },
  });

  const [statFilter, setStatFilter] = useState<"all" | "active" | "low_stock" | "expiring_soon" | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || product.category === categoryFilter;

      let matchesStat = true;
      if (statFilter === "active") {
        matchesStat = !!product.isActive;
      } else if (statFilter === "low_stock") {
        matchesStat = product.stock > 0 && product.stock < 10;
      } else if (statFilter === "expiring_soon") {
        matchesStat = !!(product.expiryDate && new Date(product.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      }

      return matchesSearch && matchesCategory && matchesStat;
    });
  }, [searchQuery, categoryFilter, statFilter, products]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleCloseModal = () => {
    setEditingProduct(false);
    setShowAddModal(false);
    setSelectedProduct(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setFormCategory("");
    setFormBrand("");
    setFormGstRate("0");
    setFormErrors({});
    setPackagingOptions([]);
  };

  const handleEditClick = (product: any) => {
    setSelectedProduct(product);
    setEditingProduct(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    if (croppingImage) {
      const { index } = croppingImage;
      const croppedFile = new File([croppedBlob], selectedImages[index].name, { type: 'image/jpeg' });

      const newSelectedImages = [...selectedImages];
      newSelectedImages[index] = croppedFile;
      setSelectedImages(newSelectedImages);

      const newPreviews = [...imagePreviews];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews[index] = URL.createObjectURL(croppedFile);
      setImagePreviews(newPreviews);

      setCroppingImage(null);
      toast.success("Image cropped successfully");
    }
  }, [croppingImage, selectedImages, imagePreviews]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Brand Normalization (e.g., TATA -> Tata, tata -> Tata, GOOD DAY -> Good Day)
    const normalizedBrand = formBrand.trim()
      ? formBrand.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : "";

    // Add controlled values
    formData.set('category', formCategory);
    formData.set('brand', normalizedBrand);
    formData.set('gstRate', formGstRate);

    // Add boolean values for checkboxes
    const notifyCustomers = (e.currentTarget.elements.namedItem('notifyCustomers') as HTMLInputElement)?.checked || false;
    const isOffer = (e.currentTarget.elements.namedItem('isOffer') as HTMLInputElement)?.checked || false;
    const isActive = (e.currentTarget.elements.namedItem('isActive') as HTMLInputElement)?.checked || false;

    formData.set('notifyCustomers', String(notifyCustomers));
    formData.set('isOffer', String(isOffer));
    formData.set('isActive', String(isActive));

    // Validations
    const errors: Record<string, string> = {};
    const name = formData.get('name') as string;
    const singleUnitPrice = parseFloat(formData.get('singleUnitPrice') as string);
    const stock = formData.get('stock') as string;
    const mfgDate = formData.get('manfDate') as string;
    const expDate = formData.get('expiryDate') as string;

    if (!name?.trim()) errors.name = "Product name is required";
    if (!formCategory) errors.category = "Please select a category";

    if (mfgDate && expDate) {
      const mfg = new Date(mfgDate);
      const exp = new Date(expDate);
      if (exp <= mfg) {
        errors.expiryDate = "Expiry must be after manufacturing date";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the highlighted errors");
      return;
    }

    setFormErrors({});

    // Add new images
    selectedImages.forEach(file => {
      formData.append('images', file);
    });

    // Append packagingOptions as JSON
    if (packagingOptions.length > 0) {
      const validOptions = packagingOptions.filter(o => o.label && o.mrp !== "" && o.salePrice !== "");
      if (validOptions.length > 0) {
        formData.set('packagingOptions', JSON.stringify(validOptions.map(o => ({
          label: o.label,
          unitsPerPack: Number(o.unitsPerPack) || 1,
          mrp: Number(o.mrp),
          salePrice: Number(o.salePrice),
          minQty: Number(o.minQty) || 1,
          stock: Number(o.stock) || 0,
        }))));
      }
    }

    if (showAddModal) {
      createMutation.mutate(formData);
    } else if (editingProduct && selectedProduct) {
      updateMutation.mutate({ id: selectedProduct._id, data: formData });
    }
  };

  const performDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "product") {
      deleteMutation.mutate(confirmDelete.id);
    } else if (confirmDelete.type === "image" && confirmDelete.url) {
      deleteImageMutation.mutate({ id: confirmDelete.id, url: confirmDelete.url });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Manage your store items and stock levels.</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest rounded-2xl h-11 px-6 shadow-lg shadow-accent/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Quick View (Clickable Filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <Card
          onClick={() => { setStatFilter(null); setCurrentPage(1); }}
          className={`p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-green-50/50 via-white to-green-50/30 ring-1 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            !statFilter ? "ring-2 ring-primary shadow-primary/20 scale-[1.02]" : "ring-green-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            {!statFilter && (
              <Badge className="bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE FILTER</Badge>
            )}
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Products</p>
          <p className="text-2xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">{products.length}</p>
        </Card>

        {/* Active Listing */}
        <Card
          onClick={() => { setStatFilter("active"); setCurrentPage(1); }}
          className={`p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 ring-1 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statFilter === "active" ? "ring-2 ring-blue-500 shadow-blue-500/20 scale-[1.02]" : "ring-blue-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            {statFilter === "active" && (
              <Badge className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE FILTER</Badge>
            )}
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Listing</p>
          <p className="text-2xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">{products.filter((p: any) => p.isActive).length}</p>
        </Card>

        {/* Low Stock */}
        <Card
          onClick={() => { setStatFilter("low_stock"); setCurrentPage(1); }}
          className={`p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 ring-1 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statFilter === "low_stock" ? "ring-2 ring-orange-500 shadow-orange-500/20 scale-[1.02]" : "ring-orange-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            {statFilter === "low_stock" && (
              <Badge className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE FILTER</Badge>
            )}
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Low Stock</p>
          <p className="text-2xl font-black bg-gradient-to-r from-orange-500 to-accent bg-clip-text text-transparent">{products.filter((p: any) => p.stock > 0 && p.stock < 10).length}</p>
        </Card>

        {/* Expiring Soon */}
        <Card
          onClick={() => { setStatFilter("expiring_soon"); setCurrentPage(1); }}
          className={`p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-red-50/50 via-white to-red-50/30 ring-1 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
            statFilter === "expiring_soon" ? "ring-2 ring-red-500 shadow-red-500/20 scale-[1.02]" : "ring-red-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            {statFilter === "expiring_soon" && (
              <Badge className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE FILTER</Badge>
            )}
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Expiring Soon</p>
          <p className="text-2xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">{products.filter((p: any) => p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}</p>
        </Card>
      </div>

      {/* Top Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
        <button
          onClick={() => { setCategoryFilter(null); setCurrentPage(1); }}
          className={`whitespace-nowrap px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${!categoryFilter ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-white text-gray-400 hover:bg-gray-50 ring-1 ring-gray-100"}`}
        >
          All Items
        </button>
        {categoriesList.map((cat: string) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${categoryFilter === cat ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-white text-gray-400 hover:bg-gray-50 ring-1 ring-gray-100"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Listing Section */}
      <div className="space-y-6">
        <Card className="p-4 sm:p-5 border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search products by identity..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-11 h-14 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all font-normal"
            />
          </div>
        </Card>

        <Card className="border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Information</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing Details</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock & Specs</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                      <p className="text-sm font-normal text-primary mt-6 tracking-widest uppercase">Loading Products...</p>
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-400 font-normal uppercase text-xs tracking-widest">No products found</td>
                  </tr>
                ) : (
                  paginatedProducts.map((product: any) => (
                    <tr key={product._id} className="group hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} className="w-14 h-14 rounded-2xl object-cover bg-gray-50 ring-1 ring-gray-100 shadow-sm" alt="" />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center ring-1 ring-gray-100">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate tracking-tight">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded-lg bg-orange-50 text-accent text-[9px] font-black uppercase tracking-widest border border-orange-100 truncate">{product.brand || "Local Brand"}</span>
                              <span className="text-[10px] text-gray-400 font-normal truncate">{product.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          {product.packagingOptions && product.packagingOptions.length > 0 ? (
                            <>
                              <p className="text-sm font-normal text-gray-900">Starts at ₹{product.packagingOptions[0].salePrice || product.packagingOptions[0].mrp} <span className="text-[10px] text-primary ml-1 bg-orange-50 px-1 py-0.5 rounded border border-orange-100">{product.packagingOptions.length} Options</span></p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-400 font-normal truncate">
                                  Default: {product.packagingOptions[0].label}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-normal text-gray-900">₹{product.offerPrice} <span className="text-[10px] text-gray-400 ml-1">/{product.unitType}</span></p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-primary font-normal">₹{product.singleUnitPrice || "N/A"} per unit</span>
                                {product.mrp && <span className="text-[10px] text-gray-400 font-normal line-through">₹{product.mrp} MRP</span>}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          {product.packagingOptions && product.packagingOptions.length > 0 ? (
                            product.packagingOptions.map((opt: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${Number(opt.stock) < 5 ? "text-accent" : "text-gray-900"}`}>
                                  {opt.stock}
                                </span>
                                <span className="text-[10px] text-gray-400 font-normal uppercase tracking-tight truncate max-w-[80px]">
                                  {opt.label}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className={`text-sm font-normal ${product.stock < 10 ? "text-accent" : "text-gray-900"}`}>{product.stock} Units</p>
                          )}
                          <p className="text-[10px] text-gray-400 font-normal border-t border-gray-50 pt-1 mt-1">
                            {product.perUnitWeightVolume || "No weight"}
                            {product.unitsPerUnitType > 1 && ` • ${product.unitsPerUnitType} in ${product.unitType}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className={`px-2.5 py-1 rounded-lg font-normal text-[9px] uppercase tracking-wider ${product.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-700 border-gray-100"}`}>
                          {product.isActive ? "Active Listing" : "Deactivated"}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(product)}
                          className="w-10 h-10 rounded-xl text-accent hover:bg-accent/5 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete({ id: product._id, type: "product" })}
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

          <div className="px-6 py-5 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">
              Entry <span className="text-gray-900">{currentPage}</span> / {totalPages || 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="h-10 px-5 rounded-xl font-normal text-[10px] uppercase tracking-widest border-gray-100 disabled:opacity-20"
              >
                Back
              </Button>
              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="h-10 px-5 rounded-xl font-normal text-[10px] uppercase tracking-widest border-gray-100 disabled:opacity-20"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {(editingProduct || showAddModal) && (
        <Dialog open={editingProduct || showAddModal} onOpenChange={(val) => { if (!val) handleCloseModal(); }}>
          <DialogContent className="max-w-4xl w-[95vw] sm:w-full rounded-[40px] p-8 sm:p-10 border-none shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSave} className="space-y-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">
                  {showAddModal ? "Add New Product" : "Edit Product Details"}
                </DialogTitle>
                <p className="text-sm text-gray-400 font-normal">Fill in the pricing, brand, and stock details below.</p>
              </DialogHeader>

              <div className="space-y-10 pt-4">
                {/* 1. Basic Identity */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <Package className="w-4 h-4 text-primary" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Basic Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Product Name <span className="text-red-500 font-black">*</span></Label>
                      <Input
                        name="name"
                        defaultValue={selectedProduct?.name}
                        className={`h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-normal transition-all ${formErrors.name ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                        placeholder="e.g. Good Day Cashew Biscuits"
                      />
                      {formErrors.name && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Brand</Label>
                      <SearchableSelect options={brandsList} value={formBrand} onChange={setFormBrand} placeholder="Choose Brand" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Category <span className="text-red-500 font-black">*</span></Label>
                      <SearchableSelect
                        options={categoriesList}
                        value={formCategory}
                        onChange={(val) => { setFormCategory(val); setFormErrors(prev => ({ ...prev, category: "" })); }}
                        placeholder="Pick Category"
                        className={formErrors.category ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}
                      />
                      {formErrors.category && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.category}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Single Piece/Pack Weight</Label>
                      <Input
                        name="perUnitWeightVolume"
                        defaultValue={selectedProduct?.perUnitWeightVolume}
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-normal transition-all"
                        placeholder="e.g. 250g, 1L, 500ml"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Detailed Description</Label>
                    <Textarea name="description" required defaultValue={selectedProduct?.description} className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white min-h-[120px] text-sm font-normal" placeholder="Describe the product features and ingredients..." />
                  </div>
                </div>

                {/* ── Packaging / Buying Options ───────────────────────────── */}
                <div className="space-y-4">
                  {/* Section header */}
                  <div className="flex items-start justify-between px-1 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <PackagePlus className="w-4 h-4 text-primary flex-shrink-0" />
                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Buying Options</h3>
                      </div>
                      <p className="text-xs text-gray-400 font-normal mt-1 ml-6">
                        Define how your product is sold — e.g. a full <strong>Carton of 24 packs</strong>, a <strong>Strip of 15 pieces</strong>, or a <strong>Single unit</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addPackagingOption}
                      className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-2xl transition-colors border border-primary/10 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Option
                    </button>
                  </div>

                  {packagingOptions.length === 0 ? (
                    <button
                      type="button"
                      onClick={addPackagingOption}
                      className="w-full border-2 border-dashed border-violet-100 rounded-2xl p-8 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-all group"
                    >
                      <PackagePlus className="w-10 h-10 text-violet-200 group-hover:text-violet-400 mx-auto mb-3 transition-colors" />
                      <p className="text-sm font-bold text-gray-500 group-hover:text-violet-600 transition-colors">Click to add your first buying option</p>
                      <p className="text-xs text-gray-300 mt-1.5 font-normal">
                        Examples: <span className="text-gray-400">Carton of 24 packs</span> · <span className="text-gray-400">Strip of 15 pieces</span> · <span className="text-gray-400">Single chocolate bar</span>
                      </p>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {packagingOptions.map((opt, idx) => (
                        <div key={opt.id} className="rounded-2xl border border-violet-100 bg-white overflow-hidden shadow-sm">

                          {/* ── Accordion Header ── */}
                          <button
                            type="button"
                            onClick={() => togglePackagingExpanded(opt.id)}
                            className="w-full flex items-center justify-between px-5 py-5 hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <span className="w-8 h-8 rounded-2xl bg-primary text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                                {idx + 1}
                              </span>
                              <div className="text-left">
                                <p className="text-sm font-bold text-gray-800">
                                  {opt.label || <span className="text-gray-300 font-normal italic">Option name not set...</span>}
                                </p>
                                {!opt.expanded && opt.mrp !== "" && (
                                  <p className="text-xs text-gray-400 font-normal mt-0.5">
                                    {opt.unitsPerPack} {Number(opt.unitsPerPack) === 1 ? "unit" : "units"} per pack
                                    &nbsp;·&nbsp;MRP ₹{opt.mrp}
                                    &nbsp;·&nbsp;Selling ₹{opt.salePrice}
                                    &nbsp;·&nbsp;{opt.stock !== "" ? `${opt.stock} in stock` : "no stock set"}
                                    &nbsp;·&nbsp;Min {opt.minQty} to order
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removePackagingOption(opt.id); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors"
                                title="Remove this option"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              {opt.expanded
                                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </div>
                          </button>

                          {/* ── Accordion Body ── */}
                          {opt.expanded && (
                            <div className="px-6 pb-8 pt-5 bg-primary/5 border-t border-primary/10 space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">

                              {/* 1. Option Name */}
                              <div>
                                <Label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
                                  Option Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  value={opt.label}
                                  onChange={(e) => updatePackagingOption(opt.id, 'label', e.target.value)}
                                  placeholder="e.g. Carton of 24 packs, Strip of 15 pieces, Single unit"
                                  className="h-14 rounded-2xl border-gray-100 bg-white focus:ring-primary/10 text-sm font-normal"
                                />
                                <p className="text-[11px] text-gray-400 mt-1.5 font-normal">
                                  💡 This name appears on the customer app as a buying option. Be descriptive — <em>"Carton (24 packs)"</em> is better than just <em>"Carton"</em>.
                                </p>
                              </div>

                              {/* 2. Four fields grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* Units per Pack */}
                                <div>
                                  <Label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
                                    How many units are inside this pack?
                                  </Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={opt.unitsPerPack}
                                    onChange={(e) => updatePackagingOption(opt.id, 'unitsPerPack', e.target.value)}
                                    placeholder="e.g. 24"
                                    className="h-12 rounded-xl border-violet-100 bg-white focus:bg-white text-sm font-normal"
                                  />
                                  <p className="text-[11px] text-gray-400 mt-1.5 font-normal">
                                    If 1 Carton holds 24 individual packs, enter <strong>24</strong>. For a single piece, enter <strong>1</strong>.
                                  </p>
                                </div>

                                {/* Min Buy Qty */}
                                <div>
                                  <Label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
                                    Minimum Packs Customer Must Buy
                                  </Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={opt.minQty}
                                    onChange={(e) => updatePackagingOption(opt.id, 'minQty', e.target.value)}
                                    placeholder="e.g. 1"
                                    className="h-12 rounded-xl border-violet-100 bg-white focus:bg-white text-sm font-normal"
                                  />
                                  <p className="text-[11px] text-gray-400 mt-1.5 font-normal">
                                    Set to <strong>1</strong> if there's no minimum. Set to <strong>2</strong> if customer must buy at least 2 cartons at a time, etc.
                                  </p>
                                </div>

                                {/* MRP */}
                                <div>
                                  <Label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
                                    MRP — Maximum Retail Price (₹) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={opt.mrp}
                                    onChange={(e) => updatePackagingOption(opt.id, 'mrp', e.target.value)}
                                    placeholder="e.g. 480.00"
                                    className="h-12 rounded-xl border-violet-100 bg-white focus:bg-white text-sm font-normal"
                                  />
                                  <p className="text-[11px] text-gray-400 mt-1.5 font-normal">
                                    The highest price printed on the pack / government regulated price. Customers see this as the <em>original price</em> (struck through if there's a discount).
                                  </p>
                                </div>

                                {/* Sale Price */}
                                <div>
                                  <Label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
                                    Your Selling Price (₹) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={opt.salePrice}
                                    onChange={(e) => updatePackagingOption(opt.id, 'salePrice', e.target.value)}
                                    placeholder="e.g. 420.00"
                                    className="h-12 rounded-xl border-orange-100 bg-primary/5 focus:bg-white text-sm font-normal ring-1 ring-primary/10"
                                  />
                                  <p className="text-[11px] text-gray-400 mt-1.5 font-normal">
                                    The price the customer actually pays. Must be ≤ MRP. If same as MRP, no discount badge is shown.
                                  </p>
                                </div>

                                {/* Stock for this option */}
                                <div>
                                  <Label className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
                                    Stock Available for This Option
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={opt.stock}
                                    onChange={(e) => updatePackagingOption(opt.id, 'stock', e.target.value)}
                                    placeholder="e.g. 50"
                                    className="h-12 rounded-xl border-green-100 bg-green-50/30 focus:bg-white text-sm font-normal ring-1 ring-green-100/50"
                                  />
                                  <p className="text-[11px] text-gray-400 mt-1.5 font-normal">
                                    How many of <em>this pack type</em> are currently available. e.g. if you have 10 Cartons in stock, enter <strong>10</strong>.
                                  </p>
                                </div>
                              </div>

                              {/* Live Customer Preview */}
                              {opt.label && opt.mrp !== "" && opt.salePrice !== "" && (
                                <div className="rounded-xl border border-violet-100 bg-white p-4">
                                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">
                                    👁 Customer Preview — How this will look on the app
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                                      <Package className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-gray-800 truncate">{opt.label}</p>
                                      <p className="text-xs text-gray-400 font-normal mt-0.5">
                                        Contains {opt.unitsPerPack} {Number(opt.unitsPerPack) === 1 ? "unit" : "units"}
                                        {Number(opt.minQty) > 1 ? ` · Min order: ${opt.minQty} packs` : ""}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-base font-black text-primary">₹{opt.salePrice}</p>
                                      {Number(opt.mrp) > Number(opt.salePrice) && (
                                        <p className="text-xs text-gray-400 line-through font-normal">₹{opt.mrp}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addPackagingOption}
                        className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-violet-500 border border-dashed border-violet-200 rounded-2xl hover:bg-violet-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Another Buying Option
                      </button>
                    </div>
                  )}
                </div>


                {/* Accounting & Taxation */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <Calculator className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Accounting & Taxation</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">HSN/SAC Code</Label>
                      <Input 
                        name="hsnCode" 
                        defaultValue={selectedProduct?.hsnCode} 
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-normal" 
                        placeholder="e.g. 1905" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">GST Bracket (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={formGstRate}
                        onChange={(e) => setFormGstRate(e.target.value)}
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal pl-4"
                        placeholder="e.g. 18"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Supply Chain Integrity */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Dates & Limits</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1 text-blue-600">MFG Date</Label>
                      <div className="relative">
                        <Input type="date" name="manfDate" defaultValue={selectedProduct?.manfDate ? new Date(selectedProduct.manfDate).toISOString().split('T')[0] : ""} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal pl-4" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1 text-red-500">EXP Date</Label>
                      <div className="relative">
                        <Input
                          type="date"
                          name="expiryDate"
                          defaultValue={selectedProduct?.expiryDate ? new Date(selectedProduct.expiryDate).toISOString().split('T')[0] : ""}
                          className={`h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal pl-4 transition-all ${formErrors.expiryDate ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                        />
                        {formErrors.expiryDate && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.expiryDate}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Media & Assets */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <X className="w-4 h-4 text-gray-400" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Media Gallery</h3>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {selectedProduct?.images?.map((url: string, i: number) => (
                      <div key={`exist-${i}`} className="relative aspect-square rounded-[24px] overflow-hidden group ring-1 ring-gray-100 shadow-sm">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ id: selectedProduct._id, type: "image", url })}
                          className="absolute inset-0 bg-red-600/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-[24px]"
                        >
                          <Trash2 className="w-6 h-6 scale-90" />
                        </button>
                      </div>
                    ))}

                    {imagePreviews.map((preview, i) => (
                      <div key={`new-${i}`} className="relative aspect-square rounded-[24px] overflow-hidden group ring-2 ring-primary/30 shadow-md">
                        <img src={preview} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button type="button" onClick={() => removeSelectedImage(i)} className="bg-red-500 text-white p-2 rounded-xl"><X className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setCroppingImage({ index: i, url: preview })} className="bg-blue-500 text-white p-2 rounded-xl"><Crop className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-[24px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-orange-50/50 hover:border-primary/40 transition-all group"
                    >
                      <ImagePlus className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors" />
                      <span className="text-[8px] font-normal text-gray-400 group-hover:text-primary uppercase tracking-widest">Add Media</span>
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} multiple accept="image/*" className="hidden" />
                </div>




                {/* 5. Marketing & Visibility */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Marketing & Visibility</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-4 p-5 rounded-[24px] bg-orange-50/30 border border-orange-100 group transition-all hover:bg-orange-50">
                      <input
                        type="checkbox"
                        name="notifyCustomers"
                        defaultChecked={selectedProduct?.notifyCustomers}
                        id="notifyCustomers"
                        className="w-5 h-5 mt-0.5 rounded-lg border-orange-200 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                      />
                      <div>
                        <Label htmlFor="notifyCustomers" className="text-xs font-semibold text-gray-900 cursor-pointer block">Broadcast to Customers</Label>
                        <p className="text-[9px] text-gray-500 font-normal uppercase tracking-wide mt-1 leading-relaxed">Send a push notification to all users about this product.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 rounded-[24px] bg-blue-50/30 border border-blue-100 group transition-all hover:bg-blue-50">
                      <input
                        type="checkbox"
                        name="isOffer"
                        defaultChecked={selectedProduct?.isOffer}
                        id="isOffer"
                        className="w-5 h-5 mt-0.5 rounded-lg border-blue-200 text-blue-600 focus:ring-blue/20 transition-all cursor-pointer"
                      />
                      <div>
                        <Label htmlFor="isOffer" className="text-xs font-semibold text-gray-900 cursor-pointer block">Add to Special Offers</Label>
                        <p className="text-[9px] text-gray-500 font-normal uppercase tracking-wide mt-1 leading-relaxed">Feature this product in the hot deals and discount section.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-6 rounded-[28px] bg-gray-50/50 border-2 border-dashed border-gray-100 ring-4 ring-white">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={selectedProduct?.isActive ?? true}
                      id="isActive"
                      className="w-6 h-6 rounded-xl border-gray-200 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    />
                    <div>
                      <Label htmlFor="isActive" className="text-sm font-normal text-gray-900 cursor-pointer block">Public Availability</Label>
                      <p className="text-[10px] text-gray-400 font-normal uppercase tracking-widest mt-0.5">Toggle to show or hide from customer catalogue.</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-8 flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="h-16 flex-1 rounded-[24px] border-gray-100 font-normal uppercase text-xs tracking-widest text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200 transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="h-16 flex-1 rounded-[24px] bg-accent text-white font-normal uppercase text-xs tracking-widest shadow-xl shadow-accent/30 active:scale-95 transition-all hover:bg-accent/90"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
                    {showAddModal ? "Save Product" : "Save Changes"}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={performDelete}
        title={confirmDelete?.type === "product" ? "Delete Product?" : "Remove Image?"}
        description={
          confirmDelete?.type === "product"
            ? "This will permanently delete this product and all its details. This action cannot be undone."
            : "This will remove this image from the product gallery. Continue?"
        }
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending || deleteImageMutation.isPending}
      />

      {/* Tool Integration */}
      {croppingImage && (
        <ImageCropper
          image={croppingImage.url}
          isOpen={!!croppingImage}
          onClose={() => setCroppingImage(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default Products;

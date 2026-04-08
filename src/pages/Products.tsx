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
import { Search, Plus, Edit2, Loader2, Trash2, ImagePlus, X, Package, Crop, Calendar, Box, Weight, ShoppingBag, TrendingUp, Calculator } from "lucide-react";
import { productApi } from "@/api/productApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ImageCropper } from "@/components/products/ImageCropper";

const CATEGORIES = [
  "Biscuits & Bakery",
  "Chips & Snacks",
  "Namkeen & Sweets",
  "Chocolates & Candies",
  "Beverages",
  "Tea & Coffee",
  "Personal Care",
  "Home Care",
  "Baby Care",
  "Grocery & Food"
];

const BRANDS = [
  "Britannia",
  "Parle",
  "ITC",
  "GOPAL",
  "HUL",
  "SHREE",
  "PERFETTI",
  "Pepsico",
  "P&G",
  "Mamy Poko",
  "Haldirams"
];

const UNIT_TYPES = [
  "Single Item",
  "Pack",
  "Box (Carton)"
];

const Products = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [formUnitType, setFormUnitType] = useState("Single Item");
  const [formGstRate, setFormGstRate] = useState("0");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
      setFormUnitType(selectedProduct.unitType || "Piece");
      setFormGstRate(selectedProduct.gstRate?.toString() || "0");
    } else if (showAddModal) {
      setFormCategory("");
      setFormBrand("");
      setFormUnitType("Piece");
      setFormGstRate("0");
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

  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter, products]);

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
    setFormUnitType("Single Item");
    setFormGstRate("0");
    setFormErrors({});
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
    formData.set('unitType', formUnitType);
    formData.set('gstRate', formGstRate);

    // Broadcast Flag
    const notifyCheckbox = document.getElementById("notifyCustomers") as HTMLInputElement;
    if (notifyCheckbox && notifyCheckbox.checked && !editingProduct) {
      formData.append("notifyCustomers", "true");
    }

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
    if (isNaN(singleUnitPrice) || singleUnitPrice < 0) errors.singleUnitPrice = "Price cannot be negative";
    if (!stock?.trim()) errors.stock = "Stock quantity is required";
    if (parseInt(stock) < 0) errors.stock = "Stock cannot be negative";

    // Map Single Price to Backend Fields
    if (formUnitType === "Single Item") {
      formData.set('mrp', singleUnitPrice.toString());
      formData.set('offerPrice', singleUnitPrice.toString());
    } else {
      formData.set('perUnitMrp', singleUnitPrice.toString());
      formData.set('singleUnitPrice', singleUnitPrice.toString());

      const unitsPerUnitType = parseInt(formData.get('unitsPerUnitType') as string);
      if (isNaN(unitsPerUnitType) || unitsPerUnitType <= 0) {
        errors.unitsPerUnitType = "Count per " + formUnitType + " is required";
      }

      const masterMrp = parseFloat(formData.get('mrp') as string);
      const masterOfferPrice = parseFloat(formData.get('offerPrice') as string);

      if (isNaN(masterMrp) || masterMrp < 0) errors.mrp = "Required";
      if (isNaN(masterOfferPrice) || masterOfferPrice < 0) errors.offerPrice = "Required";
      if (!isNaN(masterMrp) && !isNaN(masterOfferPrice) && masterOfferPrice > masterMrp) {
        errors.offerPrice = "Cannot exceed MRP";
      }
    }

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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Manage your store items and stock levels.</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-accent hover:bg-accent/90 text-white font-normal rounded-2xl h-11 px-6 shadow-lg shadow-accent/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Quick View */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 gap-4 custom-scrollbar">
        <div className="flex-shrink-0 w-[200px] sm:w-auto p-4 rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-1">Total Products</p>
          <p className="text-xl font-normal text-gray-900">{products.length}</p>
        </div>
        <div className="flex-shrink-0 w-[200px] sm:w-auto p-4 rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-1">Active Listing</p>
          <p className="text-xl font-normal text-primary">{products.filter((p: any) => p.isActive).length}</p>
        </div>
        <div className="flex-shrink-0 w-[200px] sm:w-auto p-4 rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-1">Low Stock</p>
          <p className="text-xl font-normal text-accent">{products.filter((p: any) => p.stock > 0 && p.stock < 10).length}</p>
        </div>
        <div className="flex-shrink-0 w-[200px] sm:w-auto p-4 rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-1">Expiring Soon</p>
          <p className="text-xl font-normal text-red-500">{products.filter((p: any) => p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}</p>
        </div>
      </div>

      {/* Top Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
        <button
          onClick={() => { setCategoryFilter(null); setCurrentPage(1); }}
          className={`whitespace-nowrap px-6 py-2.5 rounded-full font-normal text-xs uppercase tracking-widest transition-all ${!categoryFilter ? "bg-accent text-white shadow-lg shadow-accent/20 scale-105" : "bg-white text-gray-400 hover:bg-gray-50 ring-1 ring-gray-100"}`}
        >
          All Items
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-normal text-xs uppercase tracking-widest transition-all ${categoryFilter === cat ? "bg-accent text-white shadow-lg shadow-accent/20 scale-105" : "bg-white text-gray-400 hover:bg-gray-50 ring-1 ring-gray-100"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Listing Section */}
      <div className="space-y-6">
        <Card className="p-4 sm:p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search products by identity..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-11 h-12 border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-primary/10 rounded-2xl transition-all font-normal"
            />
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Product Information</th>
                  <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Pricing Details</th>
                  <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Stock & Specs</th>
                  <th className="px-6 py-5 text-left text-[11px] font-normal text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-right text-[11px] font-normal text-gray-400 uppercase tracking-widest">Action</th>
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
                            <p className="text-sm font-normal text-gray-900 truncate tracking-tight">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded bg-orange-50 text-primary text-[9px] font-normal uppercase tracking-widest border border-orange-100 truncate">{product.brand || "Local Brand"}</span>
                              <span className="text-[10px] text-gray-400 font-normal truncate">{product.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="text-sm font-normal text-gray-900">₹{product.offerPrice} <span className="text-[10px] text-gray-400 ml-1">/{product.unitType}</span></p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-primary font-normal">₹{product.singleUnitPrice || "N/A"} per unit</span>
                            {product.mrp && <span className="text-[10px] text-gray-400 font-normal line-through">₹{product.mrp} MRP</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className={`text-sm font-normal ${product.stock < 10 ? "text-accent" : "text-gray-900"}`}>{product.stock} Units</p>
                          <p className="text-[10px] text-gray-400 font-normal">
                            {product.perUnitWeightVolume || "No weight"}
                            {product.unitsPerUnitType > 1 && ` * ${product.unitsPerUnitType} in ${product.unitType}`}
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
                <DialogTitle className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
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
                      <SearchableSelect options={BRANDS} value={formBrand} onChange={setFormBrand} placeholder="Choose Brand" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Category <span className="text-red-500 font-black">*</span></Label>
                      <SearchableSelect
                        options={CATEGORIES}
                        value={formCategory}
                        onChange={(val) => { setFormCategory(val); setFormErrors(prev => ({ ...prev, category: "" })); }}
                        placeholder="Pick Category"
                        className={formErrors.category ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}
                      />
                      {formErrors.category && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.category}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Detailed Description</Label>
                    <Textarea name="description" required defaultValue={selectedProduct?.description} className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white min-h-[120px] text-sm font-normal" placeholder="Describe the product features and ingredients..." />
                  </div>
                </div>

                {/* 2. Packaging & Packaging Details */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <Box className="w-4 h-4 text-purple-500" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Packaging Spec</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Packaging Type <span className="text-red-500 font-black">*</span></Label>
                      <Select value={formUnitType} onValueChange={setFormUnitType}>
                        <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal">
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 pb-2">
                          {UNIT_TYPES.map(unit => (
                            <SelectItem key={unit} value={unit} className="font-normal text-xs uppercase tracking-widest">{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Single Unit Weight</Label>
                      <Input name="perUnitWeightVolume" defaultValue={selectedProduct?.perUnitWeightVolume} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-sm font-normal" placeholder="e.g. 100g, 10ml" />
                    </div>
                  </div>
                  {["Pack", "Box (Carton)"].includes(formUnitType) && (
                    <div className="p-5 rounded-2xl bg-orange-50/30 border border-orange-100 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label className="text-[11px] font-black text-primary uppercase tracking-widest ml-1">Units per {formUnitType} <span className="text-red-500 font-black">*</span></Label>
                      <div className="mt-3">
                        <p className="text-[10px] text-gray-500 font-normal mb-2 uppercase tracking-wide">How many single units are inside one {formUnitType}?</p>
                        <Input
                          type="number"
                          name="unitsPerUnitType"
                          min="0"
                          defaultValue={selectedProduct?.unitsPerUnitType}
                          className={`h-12 rounded-xl border-orange-100 bg-white font-normal transition-all ${formErrors.unitsPerUnitType ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                          placeholder="e.g. 12 units in 1 box"
                        />
                        {formErrors.unitsPerUnitType && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.unitsPerUnitType}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Pricing & Master Inventory */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Pricing & Inventory</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">
                        {formUnitType === "Single Item" ? "Unit Price (₹)" : "Single Unit Price (₹)"}
                        <span className="text-red-500 font-black ml-1">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        name="singleUnitPrice"
                        defaultValue={selectedProduct?.singleUnitPrice}
                        className={`h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal ${formErrors.singleUnitPrice ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                        placeholder="0.00"
                      />
                      {formErrors.singleUnitPrice && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1">{formErrors.singleUnitPrice}</p>}
                    </div>

                    {formUnitType === "Single Item" && (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Available Units <span className="text-red-500 font-black">*</span></Label>
                        <Input
                          type="number"
                          name="stock"
                          min="0"
                          defaultValue={selectedProduct?.stock}
                          className={`h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal transition-all ${formErrors.stock ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                          placeholder="qty"
                        />
                        {formErrors.stock && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1">{formErrors.stock}</p>}
                      </div>
                    )}
                  </div>

                  {formUnitType !== "Single Item" && (
                    <div className="pt-4 border-t border-gray-50 space-y-6">
                      <div className="flex items-center gap-2 px-1">
                        <ShoppingBag className="w-4 h-4 text-orange-500" />
                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Master {formUnitType} Details</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Total {formUnitType} MRP (₹) <span className="text-red-500 font-black">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            name="mrp"
                            defaultValue={selectedProduct?.mrp}
                            className={`h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal transition-all ${formErrors.mrp ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                            placeholder="0.00"
                          />
                          {formErrors.mrp && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.mrp}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">Total {formUnitType} Sale Price (₹) <span className="text-red-500 font-black">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            name="offerPrice"
                            defaultValue={selectedProduct?.offerPrice || selectedProduct?.price}
                            className={`h-14 rounded-2xl border-primary/10 bg-primary/5 focus:bg-white font-normal ring-1 ring-primary/5 transition-all ${formErrors.offerPrice ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                            placeholder="0.00"
                          />
                          {formErrors.offerPrice && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.offerPrice}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1">{formUnitType} Stocks Available <span className="text-red-500 font-black">*</span></Label>
                          <Input
                            type="number"
                            min="0"
                            name="stock"
                            defaultValue={selectedProduct?.stock}
                            className={`h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal transition-all ${formErrors.stock ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                            placeholder="0"
                          />
                          {formErrors.stock && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.stock}</p>}
                        </div>
                      </div>
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
                    <div className="space-y-1">
                      <Label className="text-[11px] font-normal text-gray-400 uppercase tracking-widest ml-1 text-primary">Min Order Qty</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          name="minimumQuantity"
                          min="1"
                          defaultValue={selectedProduct?.minimumQuantity || 1}
                          className={`h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-normal pl-4 transition-all ${formErrors.minimumQuantity ? "border-red-500 ring-1 ring-red-500 bg-red-50/20" : ""}`}
                          placeholder="1"
                        />
                        {formErrors.minimumQuantity && <p className="text-[10px] text-red-500 font-normal mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{formErrors.minimumQuantity}</p>}
                      </div>
                      <p className="text-[9px] text-gray-400 font-normal mt-1 ml-1">Minimum units per order</p>
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
                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <div className="flex items-center space-x-2 border p-3 rounded-md">
                        <input
                          type="checkbox"
                          id="notifyCustomers"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true} // Default to true for engagement? Or false for safety.
                        />
                        <Label htmlFor="notifyCustomers" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                          Broadcast to Customers
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        If checked, a push notification will be sent to all customers announcing this product.
                      </p>
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

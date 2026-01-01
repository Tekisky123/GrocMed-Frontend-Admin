import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Package,
  TrendingUp,
} from "lucide-react";
import { products, productCategories } from "@/lib/mockData";
import { Label } from "@/components/ui/label";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Expand products
  const allProducts = [
    ...products,
    ...products.map((p, i) => ({
      ...p,
      id: `PROD-${String(100 + i).slice(-3)}`,
      name: `${p.name} Variant ${i + 1}`,
    })),
  ];

  // Filter and search
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const getStockStatus = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      low_stock: "bg-yellow-100 text-yellow-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const stockStats = allProducts.reduce(
    (acc, p) => {
      if (p.status === "active") acc.active++;
      if (p.status === "low_stock") acc.lowStock++;
      if (p.status === "critical") acc.critical++;
      acc.totalItems += p.stock;
      return acc;
    },
    { active: 0, lowStock: 0, critical: 0, totalItems: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product inventory and categories</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{allProducts.length}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-600">{stockStats.active}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{stockStats.lowStock}</p>
        </Card>
        <Card className="p-4 border border-gray-200">
          <p className="text-xs text-gray-600 uppercase mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-600">{stockStats.critical}</p>
        </Card>
      </div>

      {/* Categories and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <Card className="lg:col-span-1 p-6 border border-gray-200 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setCategory(null);
                setCurrentPage(1);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                !categoryFilter
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Categories
            </button>
            {productCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.name);
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                  categoryFilter === cat.name
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  {cat.name}
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {cat.productCount}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Products List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <Card className="p-4 border border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10"
              />
            </div>
          </Card>

          {/* Products Table */}
          <Card className="border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Stock
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
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{product.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{product.stock}</div>
                        <div className="text-xs text-gray-500">
                          Reorder: {product.reorderLevel}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={getStockStatus(product.status)}>
                          {product.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setEditingProduct(true);
                          }}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Edit2 className="w-4 h-4" />
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
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && selectedProduct && (
        <Dialog open={editingProduct} onOpenChange={setEditingProduct}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product - {selectedProduct.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Product Name</Label>
                  <Input
                    defaultValue={selectedProduct.name}
                    placeholder="Product name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">SKU</Label>
                  <Input
                    defaultValue={selectedProduct.id}
                    disabled
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <Input
                    type="number"
                    defaultValue={selectedProduct.price}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Stock Level</Label>
                  <Input
                    type="number"
                    defaultValue={selectedProduct.stock}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <Select defaultValue={selectedProduct.category}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reorder Level</Label>
                  <Input
                    type="number"
                    defaultValue={selectedProduct.reorderLevel}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingProduct(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setEditingProduct(false)}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Product Name</Label>
                  <Input placeholder="Product name" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">SKU</Label>
                  <Input placeholder="SKU" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <Input type="number" placeholder="0.00" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Initial Stock</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reorder Level</Label>
                  <Input type="number" placeholder="0" className="mt-1" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowAddModal(false)}
                >
                  Create Product
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Products;

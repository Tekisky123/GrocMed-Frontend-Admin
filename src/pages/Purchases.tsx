import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    DialogDescription
} from "@/components/ui/dialog";
import {
    ShoppingBag, Building2, Plus, Search,
    Download, CheckCircle2, Clock, Info,
    Trash2, Calendar as CalendarIcon, Eye, Edit2, AlertTriangle
} from "lucide-react";
import { accountingApi, Vendor } from "@/api/accountingApi";
import { productApi } from "@/api/productApi";
import { exportToCSV } from "@/utils/exportUtils";
import { downloadPurchaseInvoicePDF } from "@/utils/exportPurchasePdfUtils";
import { ScrollArea } from "@/components/ui/scroll-area";

type ActiveView = "invoices" | "vendors";

interface PurchaseItem {
    id: string;
    invoiceNo: string;
    date: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    mrp: number;
    rate: number;
    hsn: string;
    gstRate: number;
    mfgDate: string;
    expiryDate: string;
    taxableAmount: number;
    total: number;
}

const Purchases = () => {
    const [activeView, setActiveView] = useState<ActiveView>("invoices");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewPurchase, setViewPurchase] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // --- Vendors State ---
    const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [newVendorName, setNewVendorName] = useState("");
    const [newVendorGSTIN, setNewVendorGSTIN] = useState("");
    const [newVendorAddress, setNewVendorAddress] = useState("");
    const [newVendorPhone, setNewVendorPhone] = useState("");
    const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);

    // --- Dynamic Data ---
    const [purchases, setPurchases] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State (Header)
    const [vendorName, setVendorName] = useState("");
    const [vendorGSTIN, setVendorGSTIN] = useState("");
    
    // Line Items State
    const [items, setItems] = useState<PurchaseItem[]>([{
        id: Math.random().toString(36).substr(2, 9),
        invoiceNo: "",
        date: new Date().toISOString().split('T')[0],
        productId: "",
        productName: "",
        sku: "Pack",
        quantity: 0,
        mrp: 0,
        rate: 0,
        hsn: "",
        gstRate: 0,
        mfgDate: "",
        expiryDate: "",
        taxableAmount: 0,
        total: 0
    }]);

    const fetchVendors = async () => {
        try {
            const res = await accountingApi.getVendors();
            if (res.success) {
                setVendorsList(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
        }
    };

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const [purRes, prodRes] = await Promise.all([
                accountingApi.getPurchases(),
                productApi.getAllProductsForAdmin()
            ]);
            setPurchases(purRes?.data || []);
            setAllProducts(prodRes?.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
        fetchVendors();
    }, []);

    const handleSaveVendor = async () => {
        if (!newVendorName || !newVendorName.trim()) {
            return toast.error("Vendor Name is required");
        }
        try {
            const payload = {
                name: newVendorName.trim(),
                gstin: newVendorGSTIN.trim().toUpperCase(),
                address: newVendorAddress.trim(),
                phone: newVendorPhone.trim(),
            };

            let savedVendor;
            if (editingVendor?._id) {
                const res = await accountingApi.updateVendor(editingVendor._id, payload);
                savedVendor = res.data;
                toast.success("Vendor updated successfully");
            } else {
                const res = await accountingApi.createVendor(payload);
                savedVendor = res.data;
                toast.success("Vendor created successfully");
                
                // Auto-populate when created during recording purchase
                if (savedVendor) {
                    setVendorName(savedVendor.name);
                    setVendorGSTIN(savedVendor.gstin || "");
                }
            }
            setShowVendorModal(false);
            fetchVendors();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save vendor");
        }
    };

    const handleEditVendor = (v: any) => {
        setEditingVendor(v);
        setNewVendorName(v.name);
        setNewVendorGSTIN(v.gstin || "");
        setNewVendorAddress(v.address || "");
        setNewVendorPhone(v.phone || "");
        setShowVendorModal(true);
    };

    const handleDeleteVendorClick = (id: string) => {
        setDeleteVendorId(id);
    };

    const confirmDeleteVendor = async () => {
        if (!deleteVendorId) return;
        try {
            await accountingApi.deleteVendor(deleteVendorId);
            toast.success("Vendor deleted successfully");
            fetchVendors();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete vendor");
        } finally {
            setDeleteVendorId(null);
        }
    };
    
    const vendors = useMemo(() => {
        return vendorsList.map(v => {
            let totalBusiness = 0;
            let invoiceCount = 0;
            let lastTransaction: string | null = null;
            
            purchases.forEach(p => {
                const nameMatch = p.supplierName && v.name && p.supplierName.trim().toLowerCase() === v.name.trim().toLowerCase();
                const gstinMatch = p.gstin && v.gstin && p.gstin.trim().toLowerCase() === v.gstin.trim().toLowerCase();
                
                if (nameMatch || (v.gstin && v.gstin !== 'URD' && gstinMatch)) {
                    totalBusiness += p.totalAmount || 0;
                    invoiceCount += 1;
                    if (!lastTransaction || new Date(p.date) > new Date(lastTransaction)) {
                        lastTransaction = p.date;
                    }
                }
            });
            
            return {
                ...v,
                totalBusiness,
                invoiceCount,
                lastTransaction
            };
        });
    }, [vendorsList, purchases]);

    const addRow = () => {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            invoiceNo: items[items.length - 1]?.invoiceNo || "",
            date: items[items.length - 1]?.date || new Date().toISOString().split('T')[0],
            productId: "",
            productName: "",
            sku: "Pack",
            quantity: 0,
            mrp: 0,
            rate: 0,
            hsn: "",
            gstRate: 0,
            mfgDate: "",
            expiryDate: "",
            taxableAmount: 0,
            total: 0
        }]);
    };

    const removeRow = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            
            const updated = { ...item, [field]: value };
            
            // Auto-calculate Taxable Value & Total
            if (field === "quantity" || field === "rate" || field === "gstRate") {
                const qty = field === "quantity" ? Number(value) : item.quantity;
                const rate = field === "rate" ? Number(value) : item.rate;
                const gst = field === "gstRate" ? Number(value) : item.gstRate;
                
                updated.taxableAmount = qty * rate;
                updated.total = updated.taxableAmount + (updated.taxableAmount * gst / 100);
            }

            // Auto-populate from Product selection
            if (field === "productId") {
                const prod = allProducts.find(p => p._id === value);
                if (prod) {
                    updated.productName = prod.name;
                    updated.hsn = prod.hsnCode || "";
                    updated.gstRate = prod.gstRate || 0;
                    
                    if (prod.packagingOptions && prod.packagingOptions.length > 0) {
                        updated.sku = prod.packagingOptions[0].label;
                        updated.mrp = prod.packagingOptions[0].mrp || 0;
                        updated.rate = prod.packagingOptions[0].salePrice || 0;
                    } else {
                        updated.sku = prod.unitType || "Single";
                        updated.mrp = prod.mrp || 0;
                        updated.rate = prod.singleUnitPrice || prod.offerPrice || 0;
                    }

                    // Recalculate based on new GST
                    updated.taxableAmount = updated.quantity * updated.rate;
                    updated.total = updated.taxableAmount + (updated.taxableAmount * updated.gstRate / 100);
                }
            }

            return updated;
        }));
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await accountingApi.updatePurchaseStatus(id, newStatus);
            toast.success(`Status updated to ${newStatus}`);
            fetchPurchases();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update status");
        }
    };

    const handleEditPurchase = (purchase: any) => {
        setVendorName(purchase.supplierName);
        setVendorGSTIN(purchase.gstin === 'URD' ? '' : purchase.gstin);
        setItems(purchase.items.map((i: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            invoiceNo: purchase.invoiceNo,
            date: new Date(purchase.date).toISOString().split('T')[0],
            productId: i.productId?._id || i.productId,
            productName: i.productName || i.productId?.name,
            sku: i.sku,
            quantity: i.quantity,
            mrp: i.mrp,
            rate: i.rate,
            hsn: i.hsn,
            gstRate: i.gstRate,
            mfgDate: i.mfgDate ? new Date(i.mfgDate).toISOString().split('T')[0] : "",
            expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString().split('T')[0] : "",
            taxableAmount: i.taxableAmount,
            total: i.total
        })));
        setEditingPurchaseId(purchase._id);
        setShowAddModal(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await accountingApi.deletePurchase(deleteConfirmId);
            toast.success("Purchase deleted and stock reverted");
            fetchPurchases();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete purchase");
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const resetForm = () => {
        setVendorName("");
        setVendorGSTIN("");
        setEditingPurchaseId(null);
        setItems([{
            id: Math.random().toString(36).substr(2, 9),
            invoiceNo: "",
            date: new Date().toISOString().split('T')[0],
            productId: "",
            productName: "",
            sku: "Pack",
            quantity: 0,
            mrp: 0,
            rate: 0,
            hsn: "",
            gstRate: 0,
            mfgDate: "",
            expiryDate: "",
            taxableAmount: 0,
            total: 0
        }]);
    };

    const handleSavePurchase = async () => {
        // Enforce strong validation - all items must have a product selected
        const hasEmptyProduct = items.some(i => !i.productId || !i.productName);
        const hasInvalidQuantity = items.some(i => i.quantity <= 0);

        if (!vendorName) {
            return toast.error("Vendor Name is required");
        }
        if (hasEmptyProduct) {
            return toast.error("All line items must have a selected Product");
        }
        if (hasInvalidQuantity) {
            return toast.error("Quantity must be greater than zero for all items");
        }

        try {
            // Map table entries to backend structure
            const payload = {
                supplierName: vendorName,
                gstin: vendorGSTIN || "URD",
                invoiceNo: items[0].invoiceNo, 
                date: new Date(items[0].date).toISOString(),
                items: items.map(i => ({
                    productId: i.productId, // REQUIRED - No dummy fallback
                    productName: i.productName,
                    invoiceNo: i.invoiceNo,
                    date: i.date,
                    sku: i.sku,
                    quantity: i.quantity,
                    mrp: i.mrp,
                    rate: i.rate,
                    hsn: i.hsn,
                    gstRate: i.gstRate,
                    mfgDate: i.mfgDate ? new Date(i.mfgDate).toISOString() : null,
                    expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString() : null,
                    taxableAmount: i.taxableAmount,
                    total: i.total
                })),
                status: "Unpaid"
            };

            if (editingPurchaseId) {
                await accountingApi.updatePurchase(editingPurchaseId, payload);
                toast.success("Purchase updated successfully");
            } else {
                await accountingApi.createPurchase(payload);
                toast.success("Purchase recorded successfully");
            }
            
            setShowAddModal(false);
            resetForm();
            fetchPurchases();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save purchase");
        }
    };

    const handleExport = () => {
        toast.loading("Exporting purchase register...", { id: "pur-export" });
        const csvData = purchases.map(p => ({
            Date: new Date(p.date).toLocaleDateString(),
            "Invoice No": p.invoiceNo,
            Vendor: p.supplierName,
            GSTIN: p.gstin,
            "Taxable Total": p.taxableTotal,
            "Grand Total": p.totalAmount,
            Status: p.status
        }));
        exportToCSV(csvData, "Purchase_Register");
        toast.success("Purchase register exported!", { id: "pur-export" });
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            Paid: "bg-green-50 text-green-700 border-green-200",
            Unpaid: "bg-yellow-50 text-yellow-700 border-yellow-200",
            "Partially Paid": "bg-blue-50 text-blue-700 border-blue-200",
        };
        return map[status] || "bg-gray-50 text-gray-700 border-gray-200";
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Purchases</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Professional Purchase Register & Batch Entry</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2 bg-white">
                        <Download className="w-4 h-4 text-primary" /> Export
                    </Button>
                    <Button
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                        className="h-11 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-accent/30 gap-2 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" /> Record Purchase
                    </Button>
                </div>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit border border-gray-100">
                {([["invoices", "Purchase Invoices", ShoppingBag], ["vendors", "Vendors", Building2]] as const).map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => setActiveView(key as ActiveView)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeView === key ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            {activeView === "invoices" && (
                <Card className="border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-8 py-7 border-b border-gray-100 flex items-center gap-4 bg-gray-50/30">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by vendor, invoice number or date..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-14 pl-12 rounded-2xl border-gray-100 bg-white shadow-inner focus:ring-primary/10"
                            />
                        </div>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    {["S.No", "Invoice No", "Date", "Vendor", "Items", "Taxable Total", "Grand Total", "Status", "Actions"].map(h => (
                                        <th key={h} className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-20 text-gray-400 font-medium italic">Synchronizing database...</td></tr>
                                ) : purchases.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-20 text-gray-400 italic">No purchase entries recorded yet.</td></tr>
                                ) : purchases
                                    .filter(p => !search || p.supplierName?.toLowerCase().includes(search.toLowerCase()) || p.invoiceNo?.includes(search))
                                    .map((p, idx) => (
                                        <tr key={p._id} className="hover:bg-orange-50/20 transition-all duration-200 group">
                                            <td className="px-6 py-5 text-xs font-black text-gray-400">{idx + 1}</td>
                                            <td className="px-6 py-5 text-sm font-mono font-bold text-gray-800 tracking-tighter">{p.invoiceNo}</td>
                                            <td className="px-6 py-5 text-sm font-semibold text-gray-500">{new Date(p.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-5">
                                               <div className="flex flex-col">
                                                 <span className="text-sm font-black text-gray-900 leading-none mb-1">{p.supplierName}</span>
                                                 <span className="text-[10px] font-mono text-gray-400">{p.gstin}</span>
                                               </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-500 font-medium">{p.items?.length || 0} items</td>
                                            <td className="px-6 py-5 text-sm font-black text-gray-700">₹{p.taxableTotal?.toLocaleString()}</td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">₹{p.totalAmount?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Select value={p.status} onValueChange={(val) => handleUpdateStatus(p._id, val)}>
                                                    <SelectTrigger className={`w-[130px] h-9 text-[10px] font-black uppercase tracking-tighter px-3 rounded-xl border ${getStatusBadge(p.status)}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Unpaid" className="text-[10px] font-black uppercase">Unpaid</SelectItem>
                                                        <SelectItem value="Partially Paid" className="text-[10px] font-black uppercase">Partially Paid</SelectItem>
                                                        <SelectItem value="Paid" className="text-[10px] font-black uppercase">Paid</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => {
                                                            setViewPurchase(p);
                                                            setShowViewModal(true);
                                                        }}
                                                        className="h-8 w-8 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleEditPurchase(p)}
                                                        className="h-8 w-8 rounded-xl hover:bg-green-50 hover:text-green-600 text-gray-400 transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => downloadPurchaseInvoicePDF(p)}
                                                        className="h-8 w-8 rounded-xl hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-all"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDeleteClick(p._id)}
                                                        className="h-8 w-8 rounded-xl hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
            
            {activeView === "vendors" && (
                <Card className="border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-8 py-7 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-4 bg-gray-50/30">
                        <div className="flex-1 relative group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by vendor name, gstin, phone or address..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-14 pl-12 rounded-2xl border-gray-100 bg-white shadow-inner focus:ring-primary/10"
                            />
                        </div>
                        <Button 
                            onClick={() => {
                                setEditingVendor(null);
                                setNewVendorName("");
                                setNewVendorGSTIN("");
                                setNewVendorAddress("");
                                setNewVendorPhone("");
                                setShowVendorModal(true);
                            }}
                            className="h-14 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-2 whitespace-nowrap w-full sm:w-auto"
                        >
                            <Plus className="w-5 h-5" />
                            Add Vendor
                        </Button>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    {["S.No", "Vendor", "GSTIN", "Phone", "Address", "Invoices", "Total Business", "Actions"].map(h => (
                                        <th key={h} className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-20 text-gray-400 font-medium italic">Calculating metrics...</td></tr>
                                ) : vendors.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-20 text-gray-400 italic">No vendors found. Add your first vendor above.</td></tr>
                                ) : vendors
                                    .filter(v => !search || 
                                        (v.name || '').toLowerCase().includes(search.toLowerCase()) || 
                                        (v.gstin || '').toLowerCase().includes(search.toLowerCase()) || 
                                        (v.phone || '').toLowerCase().includes(search.toLowerCase()) || 
                                        (v.address || '').toLowerCase().includes(search.toLowerCase())
                                    )
                                    .map((v, idx) => (
                                        <tr key={v._id || idx} className="hover:bg-orange-50/20 transition-all duration-200 group">
                                            <td className="px-6 py-5 text-xs font-black text-gray-400">{idx + 1}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs uppercase">
                                                        {v.name ? v.name.charAt(0) : '?'}
                                                    </div>
                                                    <span className="text-sm font-black text-gray-900">{v.name || "Unknown Vendor"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-mono font-bold text-gray-500">{v.gstin || "URD"}</td>
                                            <td className="px-6 py-5 text-sm font-semibold text-gray-500">{v.phone || "-"}</td>
                                            <td className="px-6 py-5 text-sm text-gray-500 max-w-[200px] truncate" title={v.address}>{v.address || "-"}</td>
                                            <td className="px-6 py-5 text-sm font-black text-gray-700">{v.invoiceCount} Invoices</td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">₹{v.totalBusiness?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleEditVendor(v)}
                                                        className="h-8 w-8 rounded-xl hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDeleteVendorClick(v._id || "")}
                                                        className="h-8 w-8 rounded-xl hover:bg-red-50 hover:text-red-600 text-gray-400 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Record Purchase Modal - Table Based */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-7xl xl:max-w-[1400px] w-full rounded-[40px] p-0 border-none shadow-3xl overflow-hidden bg-white ring-1 ring-black/5 animate-in zoom-in-95 duration-300">
                    <div className="flex h-full flex-col max-h-[90vh] w-full max-w-full min-w-0 overflow-hidden">
                        <div className="p-8 sm:p-10 pb-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-1.5">
                                    <DialogTitle className="text-3xl font-black tracking-tight text-gray-900">Record Purchase Entry</DialogTitle>
                                    <p className="text-sm text-gray-500 font-normal flex items-center gap-2">
                                        <Info className="w-4 h-4 text-orange-500" /> Use the table below for multi-item invoices.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 items-end w-full sm:w-[48rem]">
                                    <div className="flex-1 flex gap-2 items-end w-full">
                                        <div className="flex-1 min-w-0">
                                            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 block ml-1">Select Vendor</label>
                                            <Select 
                                                value={vendorsList.find(v => v.name === vendorName)?._id || ""}
                                                onValueChange={(val) => {
                                                    const selected = vendorsList.find(v => v._id === val);
                                                    if (selected) {
                                                        setVendorName(selected.name);
                                                        setVendorGSTIN(selected.gstin || "");
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-white font-bold text-sm shadow-sm focus:ring-orange-200 transition-all w-full">
                                                    <SelectValue placeholder="Select Vendor..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vendorsList.map(v => (
                                                        <SelectItem key={v._id} value={v._id || ""} className="text-xs font-bold">
                                                            {v.name} {v.gstin ? `(${v.gstin})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button 
                                            type="button"
                                            onClick={() => {
                                                setEditingVendor(null);
                                                setNewVendorName("");
                                                setNewVendorGSTIN("");
                                                setNewVendorAddress("");
                                                setNewVendorPhone("");
                                                setShowVendorModal(true);
                                            }}
                                            className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 flex items-center justify-center p-0 shrink-0"
                                            title="Add New Vendor"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <div className="w-full sm:w-48 shrink-0">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">GSTIN</label>
                                        <Input 
                                            value={vendorGSTIN} 
                                            onChange={(e) => setVendorGSTIN(e.target.value)} 
                                            placeholder="Optional" 
                                            className="h-12 rounded-2xl border-gray-100 bg-white font-mono text-sm shadow-sm focus:ring-orange-200 transition-all" 
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar min-w-0 w-full">
                            <div className="px-8 py-6 min-w-0 w-full">
                                <div className="border border-gray-100 rounded-[32px] overflow-hidden shadow-sm bg-white ring-1 ring-gray-100/50 w-full">
                                    <div className="rtable-wrap w-full overflow-x-auto">
                                        <table className="w-full text-sm border-collapse min-w-[1800px]">
                                            <thead className="sticky top-0 z-10 bg-gray-900">
                                                <tr>
                                                    <th className="sticky-left z-20 bg-gray-900 px-3 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap min-w-[50px]">S.NO</th>
                                                    <th className="sticky-left z-20 bg-gray-900 px-3 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap min-w-[140px] sticky-shadow" style={{ left: '50px' }}>INVOICE NO</th>
                                                    {["DATE", "PRODUCT NAME", "TYPE / VOLUME", "QTY", "MRP", "PURCHASE PRICE", "HSN", "GST %", "MFG", "EXPIRY", "TAXABLE", "TOTAL", ""].map((h, i) => (
                                                        <th key={i} className="px-3 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {items.map((item, index) => {
                                                    const selectedProductObj = allProducts.find(p => p._id === item.productId);
                                                    const packagingOptions = selectedProductObj?.packagingOptions || [];
                                                    const hasPackagingOptions = packagingOptions.length > 0;
                                                    
                                                    return (
                                                    <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                                                        <td className="sticky-left z-10 bg-white px-2 py-3 text-center text-xs font-black text-gray-300 min-w-[50px]">{index + 1}</td>
                                                        <td className="sticky-left z-10 bg-white px-1 py-3 w-32 min-w-[140px] sticky-shadow" style={{ left: '50px' }}>
                                                            <Input value={item.invoiceNo} onChange={(e) => updateItem(item.id, "invoiceNo", e.target.value)} className="h-9 text-xs rounded-lg border-gray-100 font-mono" />
                                                        </td>
                                                        <td className="px-1 py-3 w-36 min-w-[140px]">
                                                            <Input type="date" value={item.date} onChange={(e) => updateItem(item.id, "date", e.target.value)} className="h-9 text-xs rounded-lg border-gray-100" />
                                                        </td>
                                                        <td className="px-1 py-3 w-64 min-w-[240px]">
                                                            <Select value={item.productId} onValueChange={(val) => updateItem(item.id, "productId", val)}>
                                                                <SelectTrigger className="h-9 text-xs rounded-lg border-gray-100 font-bold bg-white">
                                                                    <SelectValue placeholder="Search Product..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {allProducts.map(p => (
                                                                        <SelectItem key={p._id} value={p._id} className="text-xs font-bold">{p.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="px-1 py-3 w-28 min-w-[110px]">
                                                            <Select value={item.sku} onValueChange={(val: any) => updateItem(item.id, "sku", val)}>
                                                                <SelectTrigger className="h-9 text-xs rounded-lg border-gray-100 font-bold">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {hasPackagingOptions ? (
                                                                        packagingOptions.map((opt: any) => (
                                                                            <SelectItem key={opt._id || opt.id || opt.label} value={opt.label}>
                                                                                {opt.label}
                                                                            </SelectItem>
                                                                        ))
                                                                    ) : (
                                                                        <SelectItem value={selectedProductObj?.unitType || "Single"}>
                                                                            {selectedProductObj?.unitType || "Single"}
                                                                        </SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="px-1 py-3 w-20 min-w-[80px]">
                                                            <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} className="h-9 text-xs text-center rounded-lg border-gray-100 font-bold" />
                                                        </td>
                                                        <td className="px-1 py-3 w-24 min-w-[100px]">
                                                            <Input type="number" value={item.mrp} onChange={(e) => updateItem(item.id, "mrp", e.target.value)} className="h-9 text-xs text-center rounded-lg border-gray-100 font-bold" />
                                                        </td>
                                                        <td className="px-1 py-3 w-24 min-w-[120px]">
                                                            <div className="relative">
                                                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₹</span>
                                                              <Input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", e.target.value)} className="h-9 text-xs pl-5 text-center rounded-lg border-gray-100 font-black text-orange-600" />
                                                            </div>
                                                        </td>
                                                        <td className="px-1 py-3 w-24 min-w-[100px]">
                                                            <Input value={item.hsn} onChange={(e) => updateItem(item.id, "hsn", e.target.value)} className="h-9 text-[10px] text-center rounded-lg border-gray-100 font-mono text-gray-400" />
                                                        </td>
                                                        <td className="px-1 py-3 w-24 min-w-[100px]">
                                                            <div className="relative">
                                                              <Input type="number" value={item.gstRate} onChange={(e) => updateItem(item.id, "gstRate", e.target.value)} className="h-9 text-xs pr-6 text-center rounded-lg border-gray-100 font-bold" />
                                                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-1 py-3 w-32 min-w-[130px]">
                                                            <Input type="date" value={item.mfgDate} onChange={(e) => updateItem(item.id, "mfgDate", e.target.value)} className="h-9 text-[10px] rounded-lg border-gray-100" />
                                                        </td>
                                                        <td className="px-1 py-3 w-32 min-w-[130px]">
                                                            <Input type="date" value={item.expiryDate} onChange={(e) => updateItem(item.id, "expiryDate", e.target.value)} className="h-9 text-[10px] rounded-lg border-gray-100" />
                                                        </td>
                                                        <td className="px-1 py-3 w-28 min-w-[110px] text-center">
                                                            <span className="text-xs font-black text-gray-900">₹{item.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        </td>
                                                        <td className="px-1 py-3 w-28 min-w-[110px] text-center">
                                                            <span className="text-xs font-black text-orange-600">₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        </td>
                                                        <td className="px-2 py-3">
                                                            <Button variant="ghost" size="icon" onClick={() => removeRow(item.id)} className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                                <tr>
                                                    <td colSpan={12} className="px-6 py-4">
                                                        <Button onClick={addRow} variant="outline" className="h-10 rounded-xl border-dashed border-gray-300 font-bold text-[10px] uppercase tracking-widest gap-2 text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-all">
                                                            <Plus className="w-4 h-4" /> Add Row
                                                        </Button>
                                                    </td>
                                                    <td className="text-center font-black text-gray-900 py-4">
                                                        <p className="text-[9px] uppercase text-gray-400">Total Taxable</p>
                                                        <span>₹{items.reduce((s, i) => s + i.taxableAmount, 0).toLocaleString()}</span>
                                                    </td>
                                                    <td className="text-center py-4">
                                                        <p className="text-[9px] uppercase text-orange-400 font-black">Grand Total</p>
                                                        <span className="text-lg font-black text-orange-600">₹{items.reduce((s, i) => s + i.total, 0).toLocaleString()}</span>
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                                </div>

                        <DialogFooter className="p-8 sm:p-10 pt-4 bg-gray-50/50 border-t border-gray-100 gap-4">
                            <Button variant="ghost" onClick={() => setShowAddModal(false)} className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Cancel</Button>
                            <Button onClick={handleSavePurchase} className="h-14 px-12 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                {editingPurchaseId ? "Update Purchase" : "Record Purchase Entry"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Purchase Details Modal */}
            <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                <DialogContent className="max-w-[95vw] lg:max-w-4xl w-full rounded-[40px] p-0 border-none shadow-3xl overflow-hidden bg-white ring-1 ring-black/5 animate-in zoom-in-95 duration-300">
                    {viewPurchase && (
                        <div className="flex h-full flex-col max-h-[90vh] w-full min-w-0 overflow-hidden">
                            <div className="p-8 pb-6 bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100 flex justify-between items-start">
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight text-gray-900">Purchase Details</DialogTitle>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Invoice #{viewPurchase.invoiceNo}</p>
                                </div>
                                <Badge className={getStatusBadge(viewPurchase.status)}>{viewPurchase.status}</Badge>
                            </div>

                            <ScrollArea className="flex-1 p-8">
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier</label>
                                        <p className="text-base font-black text-gray-900">{viewPurchase.supplierName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GSTIN</label>
                                        <p className="text-base font-mono text-gray-700">{viewPurchase.gstin || "URD"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
                                        <p className="text-base font-semibold text-gray-700">{new Date(viewPurchase.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</label>
                                        <p className="text-base font-black text-orange-600">₹{viewPurchase.totalAmount?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Item</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type/Vol</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">GST</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {viewPurchase.items?.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 font-semibold text-gray-900">{item.productName || 'Unknown Product'}</td>
                                                    <td className="px-4 py-3 text-gray-500 font-medium">{item.sku}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-700">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-gray-700">₹{item.rate}</td>
                                                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{item.gstRate}%</td>
                                                    <td className="px-4 py-3 text-right font-black text-orange-600">₹{item.total?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ScrollArea>

                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                                <Button onClick={() => setShowViewModal(false)} variant="outline" className="px-6 rounded-xl font-bold uppercase tracking-wider">Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="p-8 pb-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <DialogTitle className="text-xl font-black text-gray-900 mb-2">Delete Purchase Invoice?</DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium mb-6 leading-relaxed">
                            Are you sure you want to delete this purchase? This action will <span className="font-bold text-red-600">revert the inventory stock</span> and delete the associated accounting records. This cannot be undone.
                        </DialogDescription>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50 flex gap-3 sm:justify-center border-t border-gray-100">
                        <Button 
                            variant="ghost" 
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmDelete}
                            className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
                        >
                            Yes, Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Vendor Dialog */}
            <Dialog open={showVendorModal} onOpenChange={setShowVendorModal}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-3xl bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">
                            {editingVendor ? "Edit Vendor Details" : "Register New Vendor"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 font-normal">
                            Fill in the vendor credentials. These details will be saved for future purchases.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 my-6">
                        <div>
                            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 block">Vendor Name *</label>
                            <Input 
                                value={newVendorName} 
                                onChange={(e) => setNewVendorName(e.target.value)} 
                                placeholder="e.g. Acme Pharma" 
                                className="h-12 rounded-xl border-gray-100 bg-white font-bold text-sm" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">GSTIN</label>
                            <Input 
                                value={newVendorGSTIN} 
                                onChange={(e) => setNewVendorGSTIN(e.target.value)} 
                                placeholder="e.g. 07AAAAA1111A1Z1" 
                                className="h-12 rounded-xl border-gray-100 bg-white font-mono text-sm uppercase" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                            <Input 
                                value={newVendorPhone} 
                                onChange={(e) => setNewVendorPhone(e.target.value)} 
                                placeholder="e.g. 9876543210" 
                                className="h-12 rounded-xl border-gray-100 bg-white text-sm" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Address</label>
                            <Input 
                                value={newVendorAddress} 
                                onChange={(e) => setNewVendorAddress(e.target.value)} 
                                placeholder="Vendor full business address" 
                                className="h-12 rounded-xl border-gray-100 bg-white text-sm" 
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowVendorModal(false)}
                            className="rounded-xl font-bold h-12"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveVendor}
                            className="rounded-xl font-bold h-12 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {editingVendor ? "Update Vendor" : "Save Vendor"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Vendor Confirmation Dialog */}
            <Dialog open={deleteVendorId !== null} onOpenChange={(open) => !open && setDeleteVendorId(null)}>
                <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <div className="p-8 pb-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <DialogTitle className="text-xl font-black text-gray-900 mb-2">Delete Vendor</DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium mb-6 leading-relaxed">
                            Are you sure you want to delete this vendor? This action cannot be undone.
                        </DialogDescription>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50 flex gap-3 sm:justify-center border-t border-gray-100">
                        <Button variant="ghost" onClick={() => setDeleteVendorId(null)} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-200">
                            Cancel
                        </Button>
                        <Button onClick={confirmDeleteVendor} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white animate-pulse">
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Purchases;

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
} from "@/components/ui/dialog";
import {
    ShoppingBag, Building2, Plus, Search,
    Download, CheckCircle2, Clock, Info,
    Trash2, Calendar as CalendarIcon
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
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
    sku: "Carton" | "Pack" | "Single" | "Bag" | "Kilograms";
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
    const [search, setSearch] = useState("");

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
    }, []);
    
    const vendors = useMemo(() => {
        const vendorMap = new Map<string, any>();
        purchases.forEach(p => {
            const key = `${p.supplierName}::${p.gstin}`;
            if (!vendorMap.has(key)) {
                vendorMap.set(key, {
                    name: p.supplierName,
                    gstin: p.gstin,
                    totalBusiness: 0,
                    invoiceCount: 0,
                    lastTransaction: p.date
                });
            }
            const v = vendorMap.get(key);
            v.totalBusiness += p.totalAmount || 0;
            v.invoiceCount += 1;
            if (new Date(p.date) > new Date(v.lastTransaction)) {
                v.lastTransaction = p.date;
            }
        });
        return Array.from(vendorMap.values());
    }, [purchases]);

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
                    updated.mrp = prod.mrp || 0;
                    // Recalculate based on new GST
                    updated.taxableAmount = item.quantity * item.rate;
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

            await accountingApi.createPurchase(payload);
            toast.success("Purchase register updated successfully!");
            setShowAddModal(false);
            
            // Reset
            setVendorName(""); setVendorGSTIN("");
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
                        onClick={() => setShowAddModal(true)}
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
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => downloadPurchaseInvoicePDF(p)}
                                                    className="h-9 w-9 rounded-xl hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
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
                    <div className="px-8 py-7 border-b border-gray-100 flex items-center gap-4 bg-gray-50/30">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by vendor name or gstin..."
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
                                    {["S.No", "Vendor", "GSTIN", "Invoices", "Total Business", "Last Transaction"].map(h => (
                                        <th key={h} className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-20 text-gray-400 font-medium italic">Calculating metrics...</td></tr>
                                ) : vendors.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-20 text-gray-400 italic">No vendors found in your purchase history.</td></tr>
                                ) : vendors
                                    .filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.gstin.toLowerCase().includes(search.toLowerCase()))
                                    .map((v, idx) => (
                                        <tr key={idx} className="hover:bg-orange-50/20 transition-all duration-200 group">
                                            <td className="px-6 py-5 text-xs font-black text-gray-400">{idx + 1}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs uppercase">
                                                        {v.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-black text-gray-900">{v.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-mono font-bold text-gray-500">{v.gstin}</td>
                                            <td className="px-6 py-5 text-sm font-black text-gray-700">{v.invoiceCount} Invoices</td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">₹{v.totalBusiness?.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-semibold text-gray-500">{new Date(v.lastTransaction).toLocaleDateString()}</td>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                    <div className="w-full sm:w-64">
                                        <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 block ml-1">Vendor Name</label>
                                        <Input 
                                            value={vendorName} 
                                            onChange={(e) => setVendorName(e.target.value)} 
                                            placeholder="Enter Party Name..." 
                                            className="h-12 rounded-2xl border-gray-100 bg-white font-bold text-sm shadow-sm focus:ring-orange-200 transition-all" 
                                        />
                                    </div>
                                    <div className="w-full sm:w-48">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">GSTIN</label>
                                        <Input 
                                            value={vendorGSTIN} 
                                            onChange={(e) => setVendorGSTIN(e.target.value)} 
                                            placeholder="Optional" 
                                            className="h-12 rounded-2xl border-gray-100 bg-white font-mono text-sm shadow-sm focus:ring-orange-200 transition-all" 
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
                                                {items.map((item, index) => (
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
                                                                    <SelectItem value="Carton">Carton</SelectItem>
                                                                    <SelectItem value="Pack">Pack</SelectItem>
                                                                    <SelectItem value="Single">Single</SelectItem>
                                                                    <SelectItem value="Bag">Bag</SelectItem>
                                                                    <SelectItem value="Kilograms">Kilograms</SelectItem>
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
                                                ))}
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
                            <Button onClick={handleSavePurchase} className="h-14 px-12 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Record Purchase Entry</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Purchases;

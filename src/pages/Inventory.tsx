import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
    AlertTriangle, Package, BarChart3, Download, Search, Plus, ArrowUpRight, ArrowDownRight, RefreshCw,
} from "lucide-react";

import { accountingApi } from "@/api/accountingApi";
import { productApi } from "@/api/productApi";
import { exportToCSV } from "@/utils/exportUtils";

type View = "stock" | "movements";

const Inventory = () => {
    const [view, setView] = useState<View>("stock");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showAdjust, setShowAdjust] = useState(false);

    // Data State
    const [products, setProducts] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State for Adjustment
    const [adjProductId, setAdjProductId] = useState("");
    const [selectedProductData, setSelectedProductData] = useState<any>(null);
    const [adjOptionId, setAdjOptionId] = useState("");
    const [adjType, setAdjType] = useState("");
    const [adjQty, setAdjQty] = useState("");
    const [adjReason, setAdjReason] = useState("");
    const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, movRes] = await Promise.all([
                productApi.getAllProductsForAdmin(),
                accountingApi.getAdjustments()
            ]);
            setProducts(prodRes?.products || prodRes?.data || []);
            setMovements(movRes?.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load inventory data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        toast.loading("Exporting inventory...", { id: "inv-export" });

        let dataToExport = [];
        if (view === "stock") {
            dataToExport = filtered.map(item => ({
                SKU: item.id,
                Product: item.name,
                "Buying Type": item.label,
                Category: item.category,
                "HSN": item.hsn,
                "GST %": item.gst,
                Price: item.cost,
                Closing: item.closing,
                Value: item.value,
                Status: item.alert ? "Low Stock" : "In Stock"
            }));
        } else {
            dataToExport = movements.map(m => ({
                Date: new Date(m.date).toLocaleDateString(),
                Product: m.productId?.name || "Unknown",
                Type: m.type,
                Quantity: m.quantity,
                Reason: m.reason,
                Status: m.status
            }));
        }

        exportToCSV(dataToExport, `Inventory_Export_${view}`);
        toast.success("Inventory report exported!", { id: "inv-export" });
    };

    const handleReorder = (name: string) => {
        toast.success(`Reorder request raised for "${name}"!`, { description: "Vendor will be notified." });
    };

    const handleSaveAdjustment = async () => {
        if (!adjProductId || !adjType || !adjQty || !adjReason) {
            return toast.error("Please fill all required fields");
        }

        try {
            const payload = {
                productId: adjProductId,
                optionId: adjOptionId || undefined,
                date: new Date(adjDate).toISOString(),
                movementType: adjType,
                quantity: Number(adjQty),
                reason: adjReason,
            };

            await accountingApi.createAdjustment(payload);
            toast.success("Stock adjustment saved successfully!");
            setShowAdjust(false);

            // Reset
            setAdjProductId(""); setSelectedProductData(null); setAdjOptionId(""); setAdjType(""); setAdjQty(""); setAdjReason("");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save stock adjustment");
        }
    };

    // Derived Statistics - Flattening for multi-packaging support
    const mappedStock: any[] = [];
    products.forEach(p => {
        if (p.packagingOptions && p.packagingOptions.length > 0) {
            p.packagingOptions.forEach((opt: any) => {
                mappedStock.push({
                    id: p._id.substring(0, 6) + "-" + opt.label.substring(0, 3).toUpperCase(),
                    fullId: p._id,
                    optionId: opt._id || opt.id,
                    name: p.name,
                    label: opt.label,
                    category: p.category || "General",
                    hsn: p.hsnCode || "N/A",
                    gst: p.gstRate || 0,
                    closing: Number(opt.stock) || 0,
                    cost: opt.salePrice || opt.mrp || 0,
                    value: (Number(opt.stock) || 0) * (opt.salePrice || opt.mrp || 0),
                    alert: (Number(opt.stock) || 0) <= (opt.minQty || 5)
                });
            });
        } else {
            // Fallback for legacy products without packagingOptions
            const cost = p.offerPrice || p.mrp || 0;
            const closing = p.stock || 0;
            mappedStock.push({
                id: p._id.substring(0, 8).toUpperCase(),
                fullId: p._id,
                optionId: null,
                name: p.name,
                label: "Default Pack",
                category: p.category || "General",
                hsn: p.hsnCode || "N/A",
                gst: p.gstRate || 0,
                closing,
                cost,
                value: closing * cost,
                alert: closing <= 10
            });
        }
    });

    const totalSKUs = mappedStock.length;
    const lowStockCount = mappedStock.filter(i => i.alert).length;
    const lowStockNames = mappedStock.filter(i => i.alert).map(i => `${i.name} (${i.label})`).slice(0, 3).join(", ");
    const totalValue = mappedStock.reduce((a, i) => a + i.value, 0);
    const outOfStock = mappedStock.filter(i => i.closing === 0).length;

    const filtered = mappedStock.filter(i =>
        (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search)) &&
        (categoryFilter === "all" || i.category === categoryFilter)
    );

    const categories = Array.from(new Set(mappedStock.map(i => i.category)));

    const typeColor: Record<string, string> = {
        Inward: "bg-green-50 text-green-700 border-green-200",
        Outward: "bg-red-50 text-red-700 border-red-200",
        "Shrinkage/Damaged": "bg-orange-50 text-orange-700 border-orange-200",
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Stock Ledger & Advanced Adjustments</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2 bg-white">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Button onClick={() => setShowAdjust(true)} className="h-11 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-accent/30 gap-2">
                        <Plus className="w-4 h-4" /> Adjust Stock
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-green-50/50 via-white to-green-50/30 ring-1 ring-green-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Stock Variations</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">{totalSKUs}</p>
                </Card>
                <Card className="p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-red-50/50 via-white to-red-50/30 ring-1 ring-red-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Low Stock Alerts</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">{lowStockCount}</p>
                </Card>
                <Card className="p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 ring-1 ring-emerald-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Ledger Value</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">₹{(totalValue / 1000).toFixed(1)}k</p>
                </Card>
                <Card className="p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 ring-1 ring-orange-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-accent flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
                        <RefreshCw className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Out of Stock</p>
                    <p className="text-2xl font-black text-accent">{outOfStock}</p>
                </Card>
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-700 flex-1 truncate">
                        {lowStockCount} items are running low {lowStockNames ? `(${lowStockNames}...)` : ''}. Precision reordering required.
                    </p>
                    <Button size="sm" onClick={() => handleReorder("Low Stock Items")} className="ml-auto h-9 px-4 rounded-xl bg-red-500 text-white text-xs font-normal flex-shrink-0">Reorder Now</Button>
                </div>
            )}

            {/* Tab Toggle */}
            <div className="flex gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {([["stock", "Stock Ledger"], ["movements", "Stock Adjustments"]] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setView(key as View)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${view === key ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Stock Ledger */}
            {view === "stock" && (
                <Card className="border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="Search product or Buying Type..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-11 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-11 w-40 rounded-2xl border-gray-100 bg-gray-50/50 text-sm">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50 font-black">
                                    {["Ref ID", "Product & Buying Type", "Compliance", "Price", "In Stock (Closing)", "Stock Value", "Status"].map(h => (
                                        <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Syncing with warehouse...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No matching variations found.</td></tr>
                                ) : filtered.map(item => (
                                    <tr key={`${item.fullId}-${item.optionId}`} className={`hover:bg-gray-50/30 transition-colors ${item.alert ? "bg-red-50/20" : ""}`}>
                                        <td className="px-5 py-4 text-[10px] font-mono font-bold text-gray-400">{item.id}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    {item.alert && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                                    <span className="text-sm font-bold text-gray-900">{item.name}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-primary uppercase tracking-tight mt-0.5">{item.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-bold text-gray-500">HSN: {item.hsn}</span>
                                                <span className="text-[10px] font-normal text-gray-400">GST: {item.gst}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-600">₹{item.cost?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-black text-gray-900">{item.closing.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-black text-primary">₹{item.value.toLocaleString()}</td>
                                        <td className="px-5 py-4">
                                            <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.alert ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                                                {item.alert ? "CRITICAL" : "OPTIMAL"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50/50 border-t border-gray-100">
                                    <td colSpan={5} className="px-5 py-4 text-xs font-black text-gray-900 uppercase tracking-widest">Aggregate Ledger Value</td>
                                    <td className="px-5 py-4 text-sm font-black text-primary">₹{totalValue.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>
            )}

            {/* Stock Adjustments (Movements) */}
            {view === "movements" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-gray-900">Stock Movement Registry</h3>
                            <p className="text-xs text-gray-400 font-normal mt-0.5">Audit trail of all manual and automated adjustments</p>
                        </div>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["Date", "Product & Variation", "Type", "Quantity", "Reason", "Voucher"].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading registry...</td></tr>
                                ) : movements.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No adjustment history found.</td></tr>
                                ) : movements.map(m => (
                                    <tr key={m._id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(m.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{m.productId?.name || "Deleted Product"}</span>
                                                <span className="text-[9px] font-normal text-indigo-500">{
                                                    m.optionId ? (m.productId?.packagingOptions?.find((o: any) => o._id === m.optionId)?.label || "Specific Option") : "Universal Stock"
                                                }</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit ${typeColor[m.movementType] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                                                {m.movementType === "Inward" ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                {m.movementType?.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-black ${m.movementType === "Inward" ? "text-emerald-600" : "text-red-500"}`}>
                                            {m.movementType === "Inward" ? "+" : ""}{m.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-normal text-gray-500">{m.reason}</td>
                                        <td className="px-6 py-4 text-[10px] font-bold text-gray-900 uppercase">{m.journalEntryId ? "POSTED" : "UNVOUCHERED"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Adjust Stock Modal */}
            <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
                <DialogContent className="max-w-md rounded-[40px] p-8 sm:p-10 border-none shadow-2xl overflow-visible">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">Precise Stock Adjustment</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">Record inward/outward movement for a specific buying type.</p>
                    </DialogHeader>
                    <div className="space-y-5 py-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Product</p>
                            <Select value={adjProductId} onValueChange={(val) => {
                                setAdjProductId(val);
                                const p = products.find(prod => prod._id === val);
                                setSelectedProductData(p);
                                setAdjOptionId(""); // Reset option on product change
                            }}>
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue placeholder="Search warehouse product..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {products.map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedProductData?.packagingOptions?.length > 0 && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Choose Buying Type (Variation)</p>
                                <Select value={adjOptionId} onValueChange={setAdjOptionId}>
                                    <SelectTrigger className="h-14 rounded-2xl border-indigo-100 bg-indigo-50/20 text-indigo-600 font-bold">
                                        <SelectValue placeholder="Select Variation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedProductData.packagingOptions.map((opt: any) => (
                                            <SelectItem key={opt._id} value={opt._id}>{opt.label} (Current: {opt.stock})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Movement Type</p>
                                <Select value={adjType} onValueChange={setAdjType}>
                                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50">
                                        <SelectValue placeholder="Entry Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Inward">Inward (+)</SelectItem>
                                        <SelectItem value="Outward">Outward (-)</SelectItem>
                                        <SelectItem value="Shrinkage/Damaged">Shrinkage (-)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</p>
                                <Input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} placeholder="0" className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reference Reason</p>
                            <Input value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="e.g. Stock Arrival, Sample Dispatched" className="h-14 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">As of Date</p>
                            <Input type="date" value={adjDate} onChange={e => setAdjDate(e.target.value)} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:flex-row flex-col">
                        <Button variant="ghost" onClick={() => setShowAdjust(false)} className="flex-1 h-14 rounded-2xl font-bold text-xs uppercase tracking-widest text-gray-400">Cancel</Button>
                        <Button onClick={handleSaveAdjustment} className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-accent/30">Commit Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Inventory;

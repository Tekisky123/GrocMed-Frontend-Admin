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
                Category: item.category,
                "Cost/Unit": item.cost,
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
                date: new Date(adjDate).toISOString(),
                type: adjType,
                quantity: Number(adjQty),
                reason: adjReason,
                narration: `${adjType} Adjustment: ${adjReason}`
            };

            await accountingApi.createAdjustment(payload);
            toast.success("Stock adjustment saved successfully!");
            setShowAdjust(false);

            // Reset
            setAdjProductId(""); setAdjType(""); setAdjQty(""); setAdjReason("");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save stock adjustment");
        }
    };

    // Derived Statistics
    const mappedStock = products.map(p => {
        const cost = p.price || 0;
        const closing = p.stock || 0;
        const alert = closing <= 10; // Simple threshold
        return {
            id: p._id.substring(0, 8).toUpperCase(),
            fullId: p._id,
            name: p.name,
            category: p.category?.name || "General",
            unit: "Unit",
            closing,
            cost,
            value: closing * cost,
            alert
        };
    });

    const totalSKUs = mappedStock.length;
    const lowStockCount = mappedStock.filter(i => i.alert).length;
    const lowStockNames = mappedStock.filter(i => i.alert).map(i => i.name).slice(0, 3).join(", ");
    const totalValue = mappedStock.reduce((a, i) => a + i.value, 0);
    const outOfStock = mappedStock.filter(i => i.closing === 0).length;

    const filtered = mappedStock.filter(i =>
        (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search)) &&
        (categoryFilter === "all" || i.category === categoryFilter)
    );

    const categories = Array.from(new Set(mappedStock.map(i => i.category)));

    const typeColor: Record<string, string> = {
        Addition: "bg-green-50 text-green-700 border-green-200",
        Reduction: "bg-red-50 text-red-700 border-red-200",
        Damage: "bg-orange-50 text-orange-700 border-orange-200",
        Theft: "bg-gray-100 text-gray-800 border-gray-300"
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Inventory</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Stock Ledger & Adjustments</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Button onClick={() => setShowAdjust(true)} className="h-11 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/30 gap-2">
                        <Plus className="w-4 h-4" /> Adjust Stock
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 ring-1 ring-indigo-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total SKUs</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent">{totalSKUs}</p>
                </Card>
                <Card className="p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br from-red-50 via-white to-red-50/30 ring-1 ring-red-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Low Stock</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">{lowStockCount} items</p>
                </Card>
                <Card className="p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 ring-1 ring-emerald-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Stock Value</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">₹{(totalValue / 1000).toFixed(1)}k</p>
                </Card>
                <Card className="p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-50/30 ring-1 ring-gray-200">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-4">
                        <RefreshCw className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Out of Stock</p>
                    <p className="text-2xl font-black text-gray-500">{outOfStock}</p>
                </Card>
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-700 flex-1 truncate">
                        {lowStockCount} products are running low on stock {lowStockNames ? `(${lowStockNames}...)` : ''}. Consider reordering.
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
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${view === key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Stock Ledger */}
            {view === "stock" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="Search product or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-11 rounded-2xl border-gray-100 bg-gray-50/50" />
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
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["SKU", "Product Name", "Category", "Cost/Unit", "In Stock (Closing)", "Stock Value", "Status"].map(h => (
                                        <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading inventory...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No products found.</td></tr>
                                ) : filtered.map(item => (
                                    <tr key={item.id} className={`hover:bg-gray-50/30 transition-colors ${item.alert ? "bg-red-50/20" : ""}`}>
                                        <td className="px-5 py-4 text-xs font-mono font-bold text-gray-500">{item.id}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {item.alert && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                                                <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4"><Badge className="bg-gray-100 text-gray-600 text-xs font-normal px-2 py-0.5 rounded-lg border-0">{item.category}</Badge></td>
                                        <td className="px-5 py-4 text-sm text-gray-600">₹{item.cost?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-900">{item.closing} {item.unit}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-900">₹{item.value.toLocaleString()}</td>
                                        <td className="px-5 py-4">
                                            <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${item.alert ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                                                {item.alert ? "Low Stock" : "In Stock"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50/50 border-t border-gray-100">
                                    <td colSpan={5} className="px-5 py-4 text-sm font-black text-gray-900 uppercase">Total Stock Value</td>
                                    <td className="px-5 py-4 text-sm font-black text-indigo-600">₹{totalValue.toLocaleString()}</td>
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
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h3 className="font-black text-gray-900">Recent Stock Adjustments</h3>
                        <p className="text-xs text-gray-400 font-normal mt-0.5">All manual additions and reductions</p>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["Date", "Product", "Adjustment Type", "Quantity", "Reason", "Status"].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading adjustments...</td></tr>
                                ) : movements.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No stock adjustments found.</td></tr>
                                ) : movements.map(m => (
                                    <tr key={m._id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(m.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{m.productId?.name || "Unknown Product"}</td>
                                        <td className="px-6 py-4">
                                            <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit ${typeColor[m.type] || typeColor.Reduction}`}>
                                                {m.type === "Addition" ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                {m.type}
                                            </Badge>
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-bold ${m.type === "Addition" ? "text-green-600" : "text-red-500"}`}>
                                            {m.type === "Addition" ? "+" : "-"}{m.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{m.reason}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{m.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Adjust Stock Modal */}
            <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl overflow-visible">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">Adjust Stock</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">Record inward, outward or adjustment entry</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Product / SKU</p>
                            <Select value={adjProductId} onValueChange={setAdjProductId}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue placeholder="Select Product" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56">
                                    {products.map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Adjustment Type</p>
                            <Select value={adjType} onValueChange={setAdjType}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue placeholder="Addition / Reduction" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Addition">Addition</SelectItem>
                                    <SelectItem value="Reduction">Reduction</SelectItem>
                                    <SelectItem value="Damage">Damage / Spoilage</SelectItem>
                                    <SelectItem value="Theft">Loss / Theft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Quantity</p>
                            <Input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} placeholder="0" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason</p>
                            <Input value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="e.g. Expiry write-off" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</p>
                            <Input type="date" value={adjDate} onChange={e => setAdjDate(e.target.value)} className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowAdjust(false)} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleSaveAdjustment} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-normal text-xs uppercase tracking-widest">Save Adjustment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Inventory;

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
    Plus, Download, Monitor, Car, Armchair, Server, Search, Package, CheckCircle2, Zap
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { exportToCSV } from "@/utils/exportUtils";

const categoryIcon: Record<string, any> = {
    Computer: Monitor,
    Vehicle: Car,
    Furniture: Armchair,
    Machinery: Server,
};

const FixedAssets = () => {
    const [showAdd, setShowAdd] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [search, setSearch] = useState("");

    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [cost, setCost] = useState("");
    const [depreciationRate, setDepreciationRate] = useState("");

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await accountingApi.getAssets();
            setAssets(res?.data || []);
        } catch (error) {
            console.error("Failed to load assets", error);
            toast.error("Failed to load fixed assets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleExport = () => {
        toast.loading("Exporting asset register...", { id: "asset-export" });

        const csvData = assets.map(a => ({
            "Asset ID": a.assetId,
            "Asset Name": a.assetName,
            Category: a.category,
            "Purchase Date": new Date(a.purchaseDate).toLocaleDateString(),
            "Purchase Value": a.purchaseValue,
            "Depreciation Rate": a.depreciationRate + "%",
            "Accumulated Dep.": a.accumulatedDepreciation,
            "Current Value": a.currentValue,
            Status: a.status
        }));

        exportToCSV(csvData, "Fixed_Asset_Register");
        toast.success("Asset register exported!", { id: "asset-export" });
    };

    const handleSaveAsset = async () => {
        if (!name || !category || !purchaseDate || !cost || !depreciationRate) {
            return toast.error("Please fill all required fields");
        }
        toast.loading("Registering new asset...", { id: "asset-add" });
        try {
            const payload = {
                name,
                category,
                purchaseDate: new Date(purchaseDate).toISOString(),
                cost: Number(cost),
                depreciationRate: Number(depreciationRate),
                accumulatedDepreciation: 0,
                location: "Main Office", // default for form simplicty
                status: "Active"
            };
            await accountingApi.createAsset(payload);
            toast.success("Asset added to register!", { id: "asset-add", description: "Depreciation schedule will be computed automatically." });
            setShowAdd(false);

            // Reset
            setName(""); setCategory(""); setPurchaseDate(""); setCost(""); setDepreciationRate("");

            fetchAssets();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save asset", { id: "asset-add" });
        }
    };

    const handleRunDepreciation = async () => {
        toast.loading("Calculating depreciation & posting entries...", { id: "asset-dep" });
        try {
            const response = await accountingApi.runDepreciation();
            toast.success("Depreciation Run Completed!", { id: "asset-dep", description: "Journal entries posted successfully." });
            fetchAssets(); // Refresh values
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to run depreciation", { id: "asset-dep" });
        }
    };

    const totalCost = assets.reduce((a, x) => a + (x.cost || 0), 0);
    const totalAccumulated = assets.reduce((a, x) => a + (x.accumulatedDepreciation || 0), 0);
    const totalNetValue = totalCost - totalAccumulated;
    const activeCount = assets.filter(x => x.status === "Active").length;

    const filtered = assets.filter(a =>
        (categoryFilter === "all" || a.category === categoryFilter) &&
        (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.assetId?.includes(search))
    );

    // Default categories if list is empty
    const uniqueCategories = Array.from(new Set(assets.map(a => a.category)));
    const categories = uniqueCategories.length > 0 ? uniqueCategories : ["Computer", "Furniture", "Vehicle", "Machinery"];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Fixed Assets</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Asset Register with Depreciation Schedule</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleRunDepreciation} className="h-11 px-5 rounded-2xl border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest gap-2 bg-white hover:bg-gray-50">
                        <Zap className="w-4 h-4 text-amber-500" /> Run Depreciation
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Button onClick={() => setShowAdd(true)} className="h-11 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-amber-500/30 gap-2">
                        <Plus className="w-4 h-4" /> Add Asset
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Assets", value: activeCount.toString(), sub: "Active", color: "from-amber-500 to-amber-600", bg: "from-amber-50", ring: "ring-amber-100" },
                    { label: "Purchase Cost", value: `₹${(totalCost / 1000).toFixed(1)}k`, sub: "Gross block", color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "Depreciation", value: `₹${(totalAccumulated / 1000).toFixed(1)}k`, sub: "Till today", color: "from-red-500 to-red-600", bg: "from-red-50", ring: "ring-red-100" },
                    { label: "Net Book Value", value: `₹${(totalNetValue / 1000).toFixed(1)}k`, sub: "Current value", color: "from-primary to-green-600", bg: "from-green-50", ring: "ring-green-100" },
                ].map(({ label, value, sub, color, bg, ring }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white ${ring} ring-1`}>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-wrap gap-2">
                    {["all", ...categories].map(c => (
                        <button
                            key={c}
                            onClick={() => setCategoryFilter(c)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${categoryFilter === c ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"}`}
                        >
                            {c === "all" ? "All Categories" : c}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search assets..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-10 pl-9 rounded-xl border-gray-200 bg-white"
                    />
                </div>
            </div>

            {/* Asset Table */}
            <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                <div className="rtable-wrap">
                    <table className="rtable">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50">
                                {["Asset ID", "Name", "Category", "Purchase Date", "Cost", "Depr. Rate", "Accumulated Depr.", "Net Book Value", "Location", "Status"].map(h => (
                                    <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading assets...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No assets found. Add an asset to start tracking.</td></tr>
                            ) : filtered.map(a => {
                                const Icon = categoryIcon[a.category] || Package;
                                const netValue = a.cost - (a.accumulatedDepreciation || 0);
                                return (
                                    <tr key={a._id} className={`hover:bg-gray-50/30 transition-colors ${a.status === "Disposed" ? "opacity-50" : ""}`}>
                                        <td className="px-5 py-4 text-xs font-mono font-bold text-gray-500">{a.assetId}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-100 flex-shrink-0">
                                                    <Icon className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 line-clamp-1">{a.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge className="bg-gray-100 text-gray-600 text-xs font-normal px-2 py-0.5 rounded-lg border-0">{a.category}</Badge>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(a.purchaseDate).toLocaleDateString()}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-900">₹{a.cost.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-600">{a.depreciationRate}% <span className="text-gray-400 text-xs font-normal">WDV</span></td>
                                        <td className="px-5 py-4 text-sm text-red-500 font-semibold">₹{(a.accumulatedDepreciation || 0).toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-black text-gray-900">
                                            {netValue > 0 ? `₹${netValue.toLocaleString()}` : <span className="text-gray-400">Fully Dep.</span>}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-500">{a.location || '—'}</td>
                                        <td className="px-5 py-4">
                                            <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${a.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                {a.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50/50 border-t border-gray-100">
                                <td colSpan={4} className="px-5 py-4 text-sm font-black text-gray-900 uppercase">Totals</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{totalCost.toLocaleString()}</td>
                                <td></td>
                                <td className="px-5 py-4 text-sm font-black text-red-500">₹{totalAccumulated.toLocaleString()}</td>
                                <td className="px-5 py-4 text-sm font-black text-amber-600">₹{totalNetValue.toLocaleString()}</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>

            {/* Add Asset Modal */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">Add New Asset</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">Record a new fixed asset to the ledger</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Asset Name</p>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MacBook Pro M3" className="h-12 rounded-xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</p>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Computer">Computer</SelectItem>
                                    <SelectItem value="Furniture">Furniture</SelectItem>
                                    <SelectItem value="Machinery">Machinery</SelectItem>
                                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Purchase Date</p>
                            <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="h-12 rounded-xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cost (₹)</p>
                                <Input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" className="h-12 rounded-xl border-gray-100 bg-gray-50/50" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Depr Rate (%)</p>
                                <Input type="number" value={depreciationRate} onChange={e => setDepreciationRate(e.target.value)} placeholder="e.g. 40" className="h-12 rounded-xl border-gray-100 bg-gray-50/50" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleSaveAsset} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-normal text-xs uppercase tracking-widest">Save Asset</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FixedAssets;

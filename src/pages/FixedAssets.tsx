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
    Plus, Download, Monitor, Car, Armchair, Server, Search, Package, CheckCircle2, Zap, Building2, FileText, Info
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { exportToCSV } from "@/utils/exportUtils";
import { formatDateDDMMYYYY } from "@/utils/dateUtils";

const categoryIcon: Record<string, any> = {
    'Computers & Peripherals': Monitor,
    'Vehicles': Car,
    'Furniture & Fixtures': Armchair,
    'Plant & Machinery': Server,
    'Buildings': Building2,
};

const FixedAssets = () => {
    const [showAdd, setShowAdd] = useState(false);
    const [showDepreciationConfirm, setShowDepreciationConfirm] = useState(false);
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
            // Critical safety: filter out any null/undefined entries from API
            const cleanData = (res?.data || []).filter((a: any) => a && typeof a === 'object');
            setAssets(cleanData);
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
        const csvData = (assets || []).filter(a => a).map(a => ({
            "Asset ID": a.assetId || "N/A",
            "Asset Name": a.assetName || a.name || "Unnamed",
            Category: a.assetClass || a.category || "General",
            "Purchase Date": a.purchaseDate ? formatDateDDMMYYYY(a.purchaseDate) : "—",
            "Purchase Value": a.purchaseValue || a.cost || 0,
            "Depreciation Rate": (a.depreciationRate || 0) + "%",
            "Accumulated Dep.": a.accumulatedDepreciation || 0,
            "Current Value": a.netBookValue || ((a.purchaseValue || a.cost || 0) - (a.accumulatedDepreciation || 0)),
            Status: a.status || "Active"
        }));
        exportToCSV(csvData, "Fixed_Asset_Register");
        toast.success("Asset register exported!", { id: "asset-export" });
    };

    const handleSaveAsset = async () => {
        if (!name || !category || !purchaseDate || !cost || !depreciationRate) {
            return toast.error("Please fill all required fields");
        }
        const val = Number(cost);
        if (isNaN(val) || val <= 0) return toast.error("Please enter a valid cost");

        toast.loading("Registering new asset...", { id: "asset-add" });
        try {
            const payload = {
                assetName: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
                assetClass: category,
                purchaseDate: new Date(purchaseDate).toISOString(),
                purchaseValue: val,
                depreciationRate: Number(depreciationRate),
                accumulatedDepreciation: 0,
                netBookValue: val,
                location: "Main Office",
                status: "Active"
            };
            await accountingApi.createAsset(payload);
            toast.success("Asset added to register!", { id: "asset-add" });
            setShowAdd(false);
            setName(""); setCategory(""); setPurchaseDate(""); setCost(""); setDepreciationRate("");
            fetchAssets();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save asset", { id: "asset-add" });
        }
    };

    const handleRunDepreciation = async () => {
        setShowDepreciationConfirm(false);
        toast.loading("Calculating depreciation & posting entries...", { id: "asset-dep" });
        try {
            await accountingApi.runDepreciation();
            toast.success("Depreciation Run Completed!", { id: "asset-dep" });
            fetchAssets();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to run depreciation", { id: "asset-dep" });
        }
    };

    // Safe Aggregations
    const safeAssets = assets || [];
    const totalCost = safeAssets.reduce((acc, x) => acc + (x?.purchaseValue || x?.cost || 0), 0);
    const totalAccumulated = safeAssets.reduce((acc, x) => acc + (x?.accumulatedDepreciation || 0), 0);
    const totalNetValue = safeAssets.reduce((acc, x) => acc + (x?.netBookValue || (x?.purchaseValue || x?.cost || 0) - (x?.accumulatedDepreciation || 0)), 0);
    const activeCount = safeAssets.filter(x => x && x.status === "Active").length;

    const filtered = safeAssets.filter(a =>
        a && 
        (categoryFilter === "all" || (a.assetClass || a.category) === categoryFilter) &&
        (!search || (a.assetName || a.name || "").toLowerCase().includes(search.toLowerCase()) || (a.assetId || "").includes(search))
    );

    const categories = ['Plant & Machinery', 'Furniture & Fixtures', 'Computers & Peripherals', 'Vehicles', 'Buildings'];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Fixed Assets</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Asset Register with Depreciation Schedule</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => setShowDepreciationConfirm(true)} className="h-11 px-5 rounded-2xl border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest gap-2 bg-white hover:bg-gray-50">
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

            {/* Educational Info Banner */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-amber-600 shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-amber-900">Asset Register & Depreciation Schedule</p>
                    <p className="text-xs text-amber-700/80 mt-1 leading-relaxed max-w-2xl">
                        Keep track of your company's physical assets (Furniture, IT, Machinery). 
                        Use the <strong>Run Depreciation</strong> button periodically to calculate the Written Down Value (WDV) and automatically post depreciation expense entries to your P&L.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Assets", value: activeCount.toString(), sub: "Active", color: "from-amber-500 to-amber-600", bg: "from-amber-50", ring: "ring-amber-100" },
                    { label: "Purchase Cost", value: `₹${(totalCost).toLocaleString()}`, sub: "Gross block", color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "Depreciation", value: `₹${(totalAccumulated).toLocaleString()}`, sub: "Till today", color: "from-red-500 to-red-600", bg: "from-red-50", ring: "ring-red-100" },
                    { label: "Net Book Value", value: `₹${(totalNetValue).toLocaleString()}`, sub: "Current value", color: "from-primary to-green-600", bg: "from-green-50", ring: "ring-green-100" },
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
                <div className="flex flex-wrap gap-2 text-wrap">
                    {["all", ...categories].map(c => (
                        <button
                            key={c}
                            onClick={() => setCategoryFilter(c)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${categoryFilter === c ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"}`}
                        >
                            {c === "all" ? "All" : c}
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

            <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                <div className="rtable-wrap">
                    <table className="rtable">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50">
                                {["Asset ID", "Name", "Category", "Purchase Date", "Cost", "Depr.", "Accumulated", "Net Value", "Status"].map(h => (
                                    <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading assets...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                                                <Package className="w-8 h-8 text-amber-300" />
                                            </div>
                                            <p className="text-gray-500 font-bold">No assets found in register</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map((a, idx) => {
                                if (!a) return null;
                                const aCategory = a.assetClass || a.category || "General";
                                const aName = a.assetName || a.name || "Unnamed Asset";
                                const aCost = a.purchaseValue || a.cost || 0;
                                const netValue = a.netBookValue || (aCost - (a.accumulatedDepreciation || 0));
                                const Icon = categoryIcon[aCategory] || Package;
                                const trKey = a._id || a.id || `asset-${idx}`;

                                return (
                                    <tr key={trKey} className={`hover:bg-gray-50/30 transition-colors ${a.status === "Disposed" ? "opacity-50" : ""}`}>
                                        <td className="px-5 py-4 text-xs font-mono font-bold text-gray-500">{a.assetId || "NEW"}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-100 flex-shrink-0">
                                                    <Icon className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 line-clamp-1">{aName}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge className="bg-gray-100 text-gray-600 text-xs font-normal px-2 py-0.5 rounded-lg border-0 whitespace-nowrap">{aCategory}</Badge>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{a.purchaseDate ? formatDateDDMMYYYY(a.purchaseDate) : "—"}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-900">₹{aCost.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-600">{a.depreciationRate || 0}%</td>
                                        <td className="px-5 py-4 text-sm text-red-500 font-semibold">₹{(a.accumulatedDepreciation || 0).toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-black text-gray-900 whitespace-nowrap font-mono">
                                            ₹{netValue.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${a.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                {a.status || "Active"}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
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
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

            {/* Run Depreciation Confirmation Modal */}
            <Dialog open={showDepreciationConfirm} onOpenChange={setShowDepreciationConfirm}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mb-4 ring-8 ring-amber-50/50 mx-auto">
                            <Zap className="w-8 h-8 text-amber-500 animate-pulse" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-gray-900 text-center">Run Depreciation?</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-2 text-center">
                            This action will automatically calculate depreciation for all <strong>{activeCount} active assets</strong> based on their WDV rates.
                        </p>
                    </DialogHeader>
                    
                    <div className="bg-gray-50/50 rounded-2xl p-5 my-4 border border-gray-100 space-y-3">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-semibold text-gray-600">Creates Journal Entries for all expenses</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-semibold text-gray-600">Updates Net Book Value in Asset Register</span>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:flex-row flex-col">
                        <Button variant="outline" onClick={() => setShowDepreciationConfirm(false)} className="flex-1 h-12 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest">
                            Cancel
                        </Button>
                        <Button onClick={handleRunDepreciation} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/30">
                            Confirm & Post
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FixedAssets;

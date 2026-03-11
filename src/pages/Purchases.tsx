import { useState, useEffect } from "react";
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
    Download, CheckCircle2, Clock,
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { exportToCSV } from "@/utils/exportUtils";

type ActiveView = "invoices" | "vendors";

const Purchases = () => {
    const [activeView, setActiveView] = useState<ActiveView>("invoices");
    const [showAddModal, setShowAddModal] = useState(false);
    const [search, setSearch] = useState("");

    // --- Dynamic Data ---
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [vendorName, setVendorName] = useState("");
    const [vendorGSTIN, setVendorGSTIN] = useState("");
    const [invoiceNo, setInvoiceNo] = useState("");
    const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
    const [taxableAmt, setTaxableAmt] = useState("");
    const [gstAmt, setGstAmt] = useState("");

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const res = await accountingApi.getPurchases();
            setPurchases(res?.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, []);

    const handleExport = () => {
        toast.loading("Exporting purchase register...", { id: "pur-export" });

        const csvData = purchases.map(p => ({
            Date: new Date(p.date).toLocaleDateString(),
            "Invoice No": p.invoiceNumber,
            Vendor: p.vendorDetails.name,
            GSTIN: p.vendorDetails.gstin,
            "Taxable Amount": p.taxableAmount,
            "GST Amount": p.gstAmount,
            "Total Value": p.totalValue,
            Status: p.status
        }));

        exportToCSV(csvData, "Purchase_Register");
        toast.success("Purchase register exported!", { id: "pur-export" });
    };

    const handleSavePurchase = async () => {
        if (!vendorName || !invoiceNo || !billingDate || !taxableAmt || !gstAmt) {
            return toast.error("Please fill all required fields");
        }

        try {
            const payload = {
                vendorName,
                vendorGSTIN: vendorGSTIN || "URD", // Unregistered Dealer if empty
                invoiceNo,
                billingDate: new Date(billingDate).toISOString(),
                totalTaxable: Number(taxableAmt),
                totalGST: Number(gstAmt),
                grandTotal: Number(taxableAmt) + Number(gstAmt),
                status: "Pending", // Default 
                items: [{
                    productId: "60b9b0b9b0b9b0b9b0b9b0b9", // Dummy Object ID for system requirements
                    quantity: 1,
                    unitPrice: Number(taxableAmt),
                    taxRate: 18
                }]
            };

            await accountingApi.createPurchase(payload);
            toast.success("Purchase invoice recorded successfully!");
            setShowAddModal(false);

            // Reset
            setVendorName(""); setVendorGSTIN(""); setInvoiceNo("");
            setTaxableAmt(""); setGstAmt("");
            fetchPurchases();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save purchase");
        }
    };

    // --- Derived Data for Vendors View & Dashboard ---
    const vendorsMap = new Map<string, any>();
    purchases.forEach(p => {
        if (!vendorsMap.has(p.vendorName)) {
            vendorsMap.set(p.vendorName, { name: p.vendorName, gstin: p.vendorGSTIN, outstanding: 0, total: 0, purchases: 0, status: "Active" });
        }
        const v = vendorsMap.get(p.vendorName);
        v.total += p.grandTotal;
        if (p.status !== "Paid") v.outstanding += p.grandTotal;
        v.purchases += 1;
    });
    const vendors = Array.from(vendorsMap.values());

    const totalPurchases = purchases.reduce((a, p) => a + p.grandTotal, 0);
    const totalITC = purchases.reduce((a, p) => a + p.totalGST, 0);
    const pendingPayments = purchases.filter(p => p.status !== "Paid").reduce((a, p) => a + p.grandTotal, 0);

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            Paid: "bg-green-50 text-green-700 border-green-200",
            Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
            Partial: "bg-blue-50 text-blue-700 border-blue-200",
        };
        return map[status] || "bg-gray-50 text-gray-700 border-gray-200";
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Purchases</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Purchase Register & Vendor Management</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="h-11 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-accent/30 gap-2"
                    >
                        <Plus className="w-4 h-4" /> Record Purchase
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Purchases", value: `₹${(totalPurchases / 1000).toFixed(1)}k`, color: "from-orange-500 to-accent", ring: "ring-orange-100", bg: "from-orange-50", icon: ShoppingBag },
                    { label: "Input Tax Credit", value: `₹${(totalITC / 1000).toFixed(1)}k`, color: "from-blue-500 to-blue-600", ring: "ring-blue-100", bg: "from-blue-50", icon: CheckCircle2 },
                    { label: "Pending Payments", value: `₹${(pendingPayments / 1000).toFixed(1)}k`, color: "from-yellow-500 to-yellow-600", ring: "ring-yellow-100", bg: "from-yellow-50", icon: Clock },
                    { label: "Active Vendors", value: vendors.filter(v => v.status === "Active").length.toString(), color: "from-purple-500 to-purple-600", ring: "ring-purple-100", bg: "from-purple-50", icon: Building2 },
                ].map(({ label, value, color, ring, bg, icon: Icon }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white to-${bg}/30 ${ring} ring-1`}>
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                    </Card>
                ))}
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {([["invoices", "Purchase Invoices", ShoppingBag], ["vendors", "Vendors", Building2]] as const).map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => setActiveView(key as ActiveView)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeView === key ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Purchase Invoices */}
            {activeView === "invoices" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by vendor or PO number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 pl-11 rounded-2xl border-gray-100 bg-gray-50/50"
                            />
                        </div>
                        <Select defaultValue="all">
                            <SelectTrigger className="h-11 w-40 rounded-2xl border-gray-100 bg-gray-50/50 text-sm">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["PO No.", "Date", "Vendor", "GSTIN", "Taxable Amt", "GST", "Total", "Status"].map(h => (
                                        <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : purchases.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No purchases found</td></tr>
                                ) : purchases
                                    .filter(p => !search || p.vendorName?.toLowerCase().includes(search.toLowerCase()) || p.invoiceNo?.includes(search))
                                    .map(p => (
                                        <tr key={p._id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-5 py-4 text-sm font-mono font-bold text-gray-700">{p.invoiceNo}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{new Date(p.billingDate).toLocaleDateString()}</td>
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">{p.vendorName}</td>
                                            <td className="px-5 py-4 text-xs font-mono text-gray-400">{p.vendorGSTIN || "N/A"}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">₹{p.totalTaxable?.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm text-blue-600 font-semibold">₹{p.totalGST?.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm font-bold text-gray-900">₹{p.grandTotal?.toLocaleString()}</td>
                                            <td className="px-5 py-4">
                                                <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${getStatusBadge(p.status)}`}>{p.status}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50/50 border-t border-gray-100">
                                    <td colSpan={4} className="px-5 py-4 text-sm font-black text-gray-900 uppercase tracking-wider">Totals</td>
                                    <td className="px-5 py-4 text-sm font-black text-gray-900">₹{purchases.reduce((a, p) => a + (p.totalTaxable || 0), 0).toLocaleString()}</td>
                                    <td className="px-5 py-4 text-sm font-black text-blue-600">₹{totalITC.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-sm font-black text-gray-900">₹{totalPurchases.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>
            )}

            {/* Vendors View */}
            {activeView === "vendors" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h3 className="font-black text-gray-900">Vendor Directory</h3>
                        <p className="text-xs text-gray-400 font-normal mt-0.5">All suppliers and their outstanding balances</p>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["Vendor Name", "GSTIN", "Total Purchases", "Outstanding", "Invoices", "Status"].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {vendors.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No vendors found</td></tr>
                                ) : vendors.map(v => (
                                    <tr key={v.name} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm border border-orange-100">
                                                    {v.name.charAt(0)}
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-400">{v.gstin || "N/A"}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{v.total.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-red-500">{v.outstanding > 0 ? `₹${v.outstanding.toLocaleString()}` : "—"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{v.purchases} invoices</td>
                                        <td className="px-6 py-4">
                                            <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${v.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{v.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Add Purchase Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black bg-gradient-to-r from-orange-500 to-accent bg-clip-text text-transparent">Record Purchase</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">Add a new purchase invoice</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vendor Name</p>
                            <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. FoodBev Supplies Pvt Ltd" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vendor GSTIN (Optional)</p>
                            <Input value={vendorGSTIN} onChange={(e) => setVendorGSTIN(e.target.value)} placeholder="22AAAAA0000A1Z5" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice No</p>
                                <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="INV-2026" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</p>
                                <Input type="date" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Taxable (₹)</p>
                                <Input type="number" value={taxableAmt} onChange={(e) => setTaxableAmt(e.target.value)} placeholder="0.00" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total GST (₹)</p>
                                <Input type="number" value={gstAmt} onChange={(e) => setGstAmt(e.target.value)} placeholder="0.00" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleSavePurchase} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-accent/30">Save Invoice</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Purchases;

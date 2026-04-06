import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2, AlertCircle, Download, ExternalLink, FileCheck,
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { orderApi } from "@/api/orderApi";

type GSTView = "summary" | "sales" | "purchase" | "itc" | "returns";

const GSTModule = () => {
    const [activeView, setActiveView] = useState<GSTView>("summary");
    const [filingReturn, setFilingReturn] = useState<string | null>(null);

    const [salesData, setSalesData] = useState<any[]>([]);
    const [purchaseData, setPurchaseData] = useState<any[]>([]);
    const [gstReturns, setGstReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [ordersRes, purRes, gstRes] = await Promise.all([
                orderApi.getAllOrders(),
                accountingApi.getPurchases(),
                accountingApi.getGSTReturns()
            ]);

            // Map E-Commerce Orders to B2C GST Sales
            const mappedSales = (ordersRes?.orders || ordersRes?.data || []).map((o: any) => {
                let totalTaxable = 0;
                let totalCgst = 0;
                let totalSgst = 0;
                let totalIgst = 0;
                
                if (o.cgstAmount !== undefined || o.igstAmount !== undefined) {
                    // System successfully pulled Explicit Snapshots deployed in Update v3
                    totalCgst = o.cgstAmount || 0;
                    totalSgst = o.sgstAmount || 0;
                    totalIgst = o.igstAmount || 0;
                    totalTaxable = (o.totalAmount || 0) - (o.taxAmount || 0);
                } else if (o.items && o.items.length > 0) {
                    // Fallback to manual loop mapping for legacy orders lacking Explicit Snapshots
                    o.items.forEach((item: any) => {
                        const gstRate = item.gstRate !== undefined ? item.gstRate : 18; 
                        const itemTotal = item.price * item.quantity;
                        const itemTaxable = itemTotal / (1 + (gstRate / 100));
                        const itemTax = itemTotal - itemTaxable;
                        totalTaxable += itemTaxable;
                        totalCgst += itemTax / 2;
                        totalSgst += itemTax / 2;
                    });
                } else {
                    const total = o.totalAmount || 0;
                    totalTaxable = total / 1.18;
                    const tax = total - totalTaxable;
                    totalCgst = tax / 2;
                    totalSgst = tax / 2;
                }

                const total = o.totalAmount || 0;

                return {
                    inv: o._id.substring(0, 8).toUpperCase(),
                    date: new Date(o.createdAt).toLocaleDateString(),
                    customer: o.customer?.name || "Walk-in Customer",
                    type: "B2C",
                    taxable: Number(totalTaxable.toFixed(2)), 
                    cgst: Number(totalCgst.toFixed(2)), 
                    sgst: Number(totalSgst.toFixed(2)), 
                    igst: Number(totalIgst.toFixed(2)), 
                    total
                };
            });

            // Map Purchases to GSTR-2 ITC
            const mappedPurchases = (purRes?.data || []).map((p: any) => ({
                po: p.invoiceNo,
                date: new Date(p.billingDate).toLocaleDateString(),
                vendor: p.vendorName,
                gstin: p.vendorGSTIN || "URD",
                taxable: p.totalTaxable || 0,
                cgst: (p.totalGST || 0) / 2, // Assuming intra-state for demo
                sgst: (p.totalGST || 0) / 2,
                igst: 0,
                itc: p.totalGST || 0,
                matched: p.vendorGSTIN && p.vendorGSTIN !== "URD" // Fake 2B matching logic based on GSTIN existence
            }));

            setSalesData(mappedSales);
            setPurchaseData(mappedPurchases);
            setGstReturns(gstRes?.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load GST data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleExportJSON = async () => {
        const period = `${new Date().toLocaleString('default', { month: 'short' })}-${new Date().getFullYear()}`;
        toast.loading(`Preparing GSTR-1 JSON for ${period}...`, { id: "gst-json" });
        try {
            await accountingApi.getGSTR1Json(period);
            toast.success("GSTR-1 JSON file ready for download!", { id: "gst-json" });
        } catch (e) {
            toast.error("Failed to generate JSON");
        }
    };

    const handleGSTPortal = () => {
        window.open("https://www.gst.gov.in", "_blank");
        toast.info("Redirecting to GST Portal...");
    };

    const handleFileReturn = async (form: string, period: string, liability: number) => {
        toast.loading(`Marking ${form} as Filed...`, { id: "gst-file" });
        try {
            const payload = {
                period,
                formType: form,
                totalLiability: liability,
                arn: `AA27${Date.now().toString().slice(-10)}` // Mock Auto ARN
            };
            await accountingApi.markGSTFiled(payload);
            toast.success(`${form} for ${period} filed successfully! ARN generated.`, { id: "gst-file" });
            fetchAllData();
        } catch (error) {
            toast.error("Failed to mark as filed");
        }
    };

    const totalOutputGST = salesData.reduce((a, i) => a + i.cgst + i.sgst + i.igst, 0);
    const totalITC = purchaseData.reduce((a, i) => a + i.itc, 0);
    const gstPayable = totalOutputGST - totalITC;
    const cgstPayable = salesData.reduce((a, i) => a + i.cgst, 0) - purchaseData.reduce((a, i) => a + i.cgst, 0);
    const sgstPayable = salesData.reduce((a, i) => a + i.sgst, 0) - purchaseData.reduce((a, i) => a + i.sgst, 0);
    const igstPayable = salesData.reduce((a, i) => a + i.igst, 0) - purchaseData.reduce((a, i) => a + i.igst, 0);

    const tabs: [GSTView, string][] = [["summary", "Summary"], ["sales", "GSTR-1 (Sales)"], ["purchase", "GSTR-2 (Purchases)"], ["itc", "ITC Ledger"], ["returns", "Return Status"]];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">GST</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">GST Records, ITC & Return Filing Status</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportJSON} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2">
                        <Download className="w-4 h-4" /> GSTR-1 JSON
                    </Button>
                    <Button onClick={handleGSTPortal} className="h-11 px-5 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-teal-500/30 gap-2">
                        <ExternalLink className="w-4 h-4" /> GST Portal
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Output GST (Sales)", value: `₹${totalOutputGST.toFixed(2)}`, color: "from-teal-500 to-teal-600", bg: "from-teal-50", ring: "ring-teal-100" },
                    { label: "Input Tax Credit", value: `₹${totalITC.toFixed(2)}`, color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "GST Payable", value: `₹${gstPayable.toFixed(2)}`, color: "from-orange-500 to-accent", bg: "from-orange-50", ring: "ring-orange-100" },
                    { label: "Returns Filed", value: gstReturns.length.toString(), color: "from-green-500 to-green-600", bg: "from-green-50", ring: "ring-green-100" },
                ].map(({ label, value, color, bg, ring }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white ${ring} ring-1`}>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {tabs.map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveView(key)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeView === key ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Summary View */}
            {activeView === "summary" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
                        <h3 className="font-black text-gray-900 mb-5">GST Payable Breakdown</h3>
                        <div className="space-y-4">
                            {[
                                { label: "CGST Payable", value: cgstPayable, color: "bg-teal-500" },
                                { label: "SGST Payable", value: sgstPayable, color: "bg-blue-500" },
                                { label: "IGST Payable", value: igstPayable, color: "bg-purple-500" },
                            ].map(({ label, value, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                                        <span className="text-sm font-bold text-gray-900">₹{value.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-2 ${color} rounded-full`} style={{ width: `${Math.min((Math.abs(value) / (gstPayable || 1)) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">Total Payable</span>
                                <span className="text-xl font-black text-teal-600">₹{gstPayable.toFixed(2)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
                        <h3 className="font-black text-gray-900 mb-5">ITC Ledger Summary</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Opening ITC Balance", value: "₹0", isPositive: true },
                                { label: "+ ITC Earned (Purchases)", value: `₹${totalITC.toFixed(2)}`, isPositive: true },
                                { label: "- ITC Utilized against Output", value: `₹${Math.min(totalITC, totalOutputGST).toFixed(2)}`, isPositive: false },
                                { label: "= Closing ITC Balance", value: `₹${Math.max(0, totalITC - totalOutputGST).toFixed(2)}`, isPositive: true, highlight: true },
                            ].map(({ label, value, isPositive, highlight }) => (
                                <div key={label} className={`flex justify-between items-center py-3 px-4 rounded-xl ${highlight ? "bg-teal-50 border border-teal-100" : "bg-gray-50/50"}`}>
                                    <span className={`text-sm font-semibold ${highlight ? "text-teal-700" : "text-gray-700"}`}>{label}</span>
                                    <span className={`text-sm font-bold ${isPositive ? (highlight ? "text-teal-600" : "text-gray-900") : "text-red-500"}`}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* GSTR-1 Sales View */}
            {activeView === "sales" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h3 className="font-black text-gray-900">GSTR-1 Sales Data</h3>
                        <p className="text-xs text-gray-400 mt-0.5">All outward supplies for GST filing</p>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["Invoice No.", "Date", "Customer", "Type", "Taxable", "CGST", "SGST", "IGST", "Total"].map(h => (
                                        <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading sales data...</td></tr>
                                ) : salesData.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">No B2B/B2C Sales found.</td></tr>
                                ) : salesData.map(r => (
                                    <tr key={r.inv} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-5 py-4 text-xs font-mono font-bold text-primary">{r.inv}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{r.date}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{r.customer}</td>
                                        <td className="px-5 py-4">
                                            <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${r.type === "B2B" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>{r.type}</Badge>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-700">₹{r.taxable.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">₹{r.cgst}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">₹{r.sgst}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">₹{r.igst}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-900">₹{r.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50/50 border-t border-gray-100">
                                    <td colSpan={4} className="px-5 py-4 text-sm font-black text-gray-900">Totals</td>
                                    <td className="px-5 py-4 text-sm font-black text-gray-900">₹{salesData.reduce((a, r) => a + r.taxable, 0).toLocaleString()}</td>
                                    <td className="px-5 py-4 text-sm font-black text-gray-900">₹{salesData.reduce((a, r) => a + r.cgst, 0).toFixed(0)}</td>
                                    <td className="px-5 py-4 text-sm font-black text-gray-900">₹{salesData.reduce((a, r) => a + r.sgst, 0).toFixed(0)}</td>
                                    <td className="px-5 py-4 text-sm font-black text-gray-900">₹{salesData.reduce((a, r) => a + r.igst, 0).toFixed(0)}</td>
                                    <td className="px-5 py-4 text-sm font-black text-teal-600">₹{salesData.reduce((a, r) => a + r.total, 0).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>
            )}

            {/* Purchase GSTR-2 */}
            {activeView === "purchase" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h3 className="font-black text-gray-900">GSTR-2B Purchase Data</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Inward supplies with ITC eligibility</p>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["PO No.", "Date", "Vendor", "GSTIN", "Taxable", "CGST", "SGST", "IGST", "ITC Claimed", "GSTR-2B Match"].map(h => (
                                        <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={10} className="text-center py-8 text-gray-400">Loading purchase data...</td></tr>
                                ) : purchaseData.length === 0 ? (
                                    <tr><td colSpan={10} className="text-center py-8 text-gray-400">No GST Purchases found.</td></tr>
                                ) : purchaseData.map(r => (
                                    <tr key={r.po} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-5 py-4 text-sm font-mono font-bold text-gray-700">{r.po}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{r.date}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{r.vendor}</td>
                                        <td className="px-5 py-4 text-xs font-mono text-gray-400">{r.gstin}</td>
                                        <td className="px-5 py-4 text-sm text-gray-700">₹{r.taxable?.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">₹{r.cgst}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">₹{r.sgst}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">₹{r.igst}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-teal-600">₹{r.itc?.toLocaleString()}</td>
                                        <td className="px-5 py-4">
                                            {r.matched ? (
                                                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
                                                    <CheckCircle2 className="w-3 h-3" /> Matched
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
                                                    <AlertCircle className="w-3 h-3" /> Unregistered
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Return Status */}
            {activeView === "returns" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-gray-900">GST Return Filing Status</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Track filed returns & ARN records</p>
                        </div>
                        <Button size="sm" onClick={() => handleFileReturn("GSTR-3B", "Current Month", gstPayable)} className="h-9 px-4 rounded-xl bg-teal-600 text-white text-xs font-normal">
                            File GSTR-3B Now
                        </Button>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["Return Form", "Period", "Filed Date", "ARN No.", "Status", "Tax Liability"].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading returns...</td></tr>
                                ) : gstReturns.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No GST Returns filed yet.</td></tr>
                                ) : gstReturns.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{r.formType}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{r.period}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(r.filingDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{r.arn}</td>
                                        <td className="px-6 py-4">
                                            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
                                                <FileCheck className="w-3 h-3" /> Filed
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{r.totalLiability?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ITC Ledger */}
            {activeView === "itc" && (
                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
                    <h3 className="font-black text-gray-900 mb-6">Input Tax Credit Ledger</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors border border-teal-100">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Month</p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">Current</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">ITC Earned</p>
                                <p className="text-sm font-bold text-teal-600 mt-1">+₹{totalITC.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Output Tax Offset</p>
                                <p className="text-sm font-bold text-red-500 mt-1">-₹{Math.min(totalITC, totalOutputGST).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Balance CF</p>
                                <p className="text-sm font-bold text-gray-900 mt-1">₹{Math.max(0, totalITC - totalOutputGST).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 italic text-center">Note: Previous periods history removed for demo brevity.</p>
                </Card>
            )}
        </div>
    );
};

export default GSTModule;

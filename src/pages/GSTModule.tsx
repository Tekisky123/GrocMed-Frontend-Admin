import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
    CheckCircle2, AlertCircle, Download, ExternalLink, FileCheck, Receipt, BarChart3, History, ArrowRightLeft, ShieldCheck, Scale, Info
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { orderApi } from "@/api/orderApi";

type GSTView = "summary" | "sales" | "purchase" | "itc" | "returns";

const GSTModule = () => {
    const [activeView, setActiveView] = useState<GSTView>("summary");
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
    });

    const [showFileConfirm, setShowFileConfirm] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<{ type: string, liability: number } | null>(null);

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

            // Filter data by month (e.g., "Apr-2026")
            const filterByMonth = (dateStr: string) => {
                const d = new Date(dateStr);
                return `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}` === month;
            };

            const mappedSales = (ordersRes?.orders || ordersRes?.data || [])
                .filter((o: any) => filterByMonth(o.createdAt))
                .map((o: any) => {
                    const cgst = o.cgstAmount || 0;
                    const sgst = o.sgstAmount || 0;
                    const igst = o.igstAmount || 0;
                    const taxable = (o.totalAmount || 0) - (cgst + sgst + igst);

                    return {
                        inv: o._id.substring(0, 8).toUpperCase(),
                        date: new Date(o.createdAt).toLocaleDateString(),
                        customer: o.customer?.name || "Walk-in Customer",
                        type: "B2C",
                        taxable: Number(taxable.toFixed(2)),
                        cgst: Number(cgst.toFixed(2)),
                        sgst: Number(sgst.toFixed(2)),
                        igst: Number(igst.toFixed(2)),
                        total: o.totalAmount || 0
                    };
                });

            const mappedPurchases = (purRes?.data || [])
                .filter((p: any) => filterByMonth(p.date || p.billingDate))
                .map((p: any) => ({
                    po: p.invoiceNo,
                    date: new Date(p.date || p.billingDate).toLocaleDateString(),
                    vendor: p.supplierName || p.vendorName,
                    gstin: p.gstin || p.vendorGSTIN || "URD",
                    taxable: p.taxableTotal || p.totalTaxable || 0,
                    cgst: p.taxBreakup?.cgst || 0,
                    sgst: p.taxBreakup?.sgst || 0,
                    igst: p.taxBreakup?.igst || 0,
                    itc: (p.taxBreakup?.cgst || 0) + (p.taxBreakup?.sgst || 0) + (p.taxBreakup?.igst || 0),
                    matched: p.gstin && p.gstin !== "URD"
                }));

            setSalesData(mappedSales);
            setPurchaseData(mappedPurchases);
            setGstReturns(gstRes?.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load GST records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [month]);

    const handleExportJSON = async () => {
        toast.loading(`Drafting GSTR-1 JSON for ${month}...`, { id: "gst-json" });
        try {
            const res = await accountingApi.getGSTR1Json(month);
            if (res.success && res.data) {
                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `GSTR1_${month}_Offline_Tool.json`;
                link.click();
                toast.success("GSTR-1 JSON downloaded successfully!", { id: "gst-json" });
            }
        } catch (e) {
            toast.error("JSON generation failed", { id: "gst-json" });
        }
    };

    const handleFileReturn = async () => {
        if (!selectedReturn) return;
        setShowFileConfirm(false);

        toast.loading(`Filing ${selectedReturn.type}...`, { id: "gst-file" });
        try {
            const payload = {
                period: month,
                returnType: selectedReturn.type,
                totalLiability: selectedReturn.liability,
                arnNumber: `AA27${Date.now().toString().slice(-10)}`
            };
            await accountingApi.markGSTFiled(payload);
            toast.success(`${returnType} marked as Filed! Registry updated.`, { id: "gst-file" });
            fetchAllData();
        } catch (error) {
            toast.error("Return filing record failed");
        }
    };

    const cgstOutput = salesData.reduce((a, i) => a + (i.cgst || 0), 0);
    const sgstOutput = salesData.reduce((a, i) => a + (i.sgst || 0), 0);
    const igstOutput = salesData.reduce((a, i) => a + (i.igst || 0), 0);
    const totalOutputGST = cgstOutput + sgstOutput + igstOutput;

    const cgstInput = purchaseData.reduce((a, i) => a + (i.cgst || 0), 0);
    const sgstInput = purchaseData.reduce((a, i) => a + (i.sgst || 0), 0);
    const igstInput = purchaseData.reduce((a, i) => a + (i.igst || 0), 0);
    const totalITC = cgstInput + sgstInput + igstInput;

    const cgstPayable = Math.max(0, cgstOutput - cgstInput);
    const sgstPayable = Math.max(0, sgstOutput - sgstInput);
    const igstPayable = Math.max(0, igstOutput - igstInput);
    const gstPayable = cgstPayable + sgstPayable + igstPayable;

    const isFiled = gstReturns.some(r => r.period === month && r.status === "Filed");

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Professional Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">GST Compliance</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Tax Management & Returns Dashboard</p>
                </div>
                <div className="flex gap-3">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="h-11 w-44 rounded-2xl border-gray-100 bg-white font-semibold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 6 }).map((_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const value = `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
                                return <SelectItem key={value} value={value}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExportJSON} className="h-11 px-5 rounded-2xl border-gray-100 font-bold text-[11px] uppercase tracking-widest gap-2 bg-white hover:bg-gray-50">
                        <Download className="w-4 h-4 text-teal-600" /> GSTR-1 JSON
                    </Button>
                    <Button onClick={() => window.open("https://www.gst.gov.in", "_blank")} className="h-11 px-5 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-teal-500/30 gap-2">
                        <ExternalLink className="w-4 h-4" /> Portals
                    </Button>
                </div>
            </div>

            {/* Statutory Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className={`col-span-1 lg:col-span-2 p-5 border-none shadow-sm rounded-3xl ring-1 ${isFiled ? "ring-green-100 bg-green-50/30" : "ring-teal-100 bg-teal-50/30"} flex items-center gap-5`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isFiled ? "bg-white text-green-600" : "bg-white text-teal-600"}`}>
                        {isFiled ? <ShieldCheck className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{isFiled ? "Tax Period Finalized" : "Monthly Compliance Checklist"}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {isFiled 
                                ? "Returns for this period have been successfully marked as FILED. All accounting entries have been synchronized."
                                : "Review your outward sales and input credits for this period. Ensure all purchases are matched in GSTR-2B before filing GSTR-3B."}
                        </p>
                    </div>
                    {!isFiled && (
                        <Button 
                            size="sm" 
                            onClick={() => {
                                setSelectedReturn({ type: "GSTR-3B", liability: gstPayable });
                                setShowFileConfirm(true);
                            }} 
                            className="ml-auto shrink-0 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] uppercase rounded-xl h-9 px-4"
                        >
                            File Now
                        </Button>
                    )}
                </Card>
                <Card className="p-5 border-none shadow-sm rounded-3xl bg-gray-900 ring-1 ring-gray-800 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-teal-400"><History className="w-5 h-5" /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Net Payable</p>
                        <p className="text-xl font-black text-white mt-0.5">₹{gstPayable.toLocaleString()}</p>
                    </div>
                </Card>
            </div>

            {/* Dynamic Educational Guidance */}
            <div className="bg-teal-50/30 border border-teal-100 rounded-3xl p-5 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-teal-600 shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-teal-900 uppercase tracking-tight">
                        {activeView === "summary" && "GST Overview & Liability"}
                        {activeView === "sales" && "Outward Supplies (GSTR-1)"}
                        {activeView === "purchase" && "Inward Supplies & ITC"}
                        {activeView === "returns" && "Statutory Filing Registry"}
                    </p>
                    <p className="text-xs text-teal-700/80 mt-1 leading-relaxed max-w-3xl">
                        {activeView === "summary" && "This dashboard calculates your net GST payable by subtracting eligible Input Tax Credit (ITC) from your total Output tax collected on sales."}
                        {activeView === "sales" && "Review all sales invoices for the month. The 'GSTR-1 JSON' button generates a file compatible with the government's offline utility tool."}
                        {activeView === "purchase" && "Verify GST amounts paid on purchases. Ensure vendors have provided valid GSTINs to claim Input Tax Credit and reduce your tax liability."}
                        {activeView === "returns" && "Once you file returns on the government portal, record the ARN (Application Reference Number) here to update your compliance history."}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "B2C Sales (Draft)", value: `₹${totalOutputGST.toLocaleString()}`, color: "from-teal-500 to-teal-600", bg: "from-teal-50", ring: "ring-teal-100" },
                    { label: "Eligible ITC", value: `₹${totalITC.toLocaleString()}`, color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "Tax Liability", value: `₹${gstPayable.toLocaleString()}`, color: "from-orange-500 to-accent", bg: "from-orange-50", ring: "ring-orange-100" },
                    { label: "Returns Filed", value: gstReturns.filter(r => r.status === "Filed").length.toString(), color: "from-green-500 to-green-600", bg: "from-green-50", ring: "ring-green-100" },
                ].map(({ label, value, color, bg, ring }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white ${ring} ring-1`}>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                    </Card>
                ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {([["summary", "Analytics"], ["sales", "GSTR-1 (Sales)"], ["purchase", "GSTR-2B (Purchases)"], ["returns", "Registry"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setActiveView(key)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeView === key ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            {activeView === "summary" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><BarChart3 className="w-32 h-32" /></div>
                        <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">Compliance Breakdown <ArrowRightLeft className="w-4 h-4 text-gray-400" /></h3>
                        <div className="space-y-5">
                            {[
                                { label: "CGST", out: cgstOutput, in: cgstInput, pay: cgstPayable, color: "teal" },
                                { label: "SGST", out: sgstOutput, in: sgstInput, pay: sgstPayable, color: "blue" },
                                { label: "IGST", out: igstOutput, in: igstInput, pay: igstPayable, color: "purple" },
                            ].map((tax) => (
                                <div key={tax.label} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div><p className="text-xs font-black text-gray-900 uppercase tracking-widest">{tax.label}</p><p className="text-[10px] text-gray-400 mt-0.5">Out: ₹{tax.out.toLocaleString()} | In: ₹{tax.in.toLocaleString()}</p></div>
                                        <p className="text-sm font-black text-gray-900">₹{tax.pay.toLocaleString()}</p>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                        <div className={`h-full bg-${tax.color}-500 transition-all`} style={{ width: `${Math.min(100, (tax.pay / (gstPayable || 1)) * 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
                        <h3 className="font-black text-gray-900 mb-6">Input Tax Credit Utilization</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Opening ITC Balance", value: "₹0", type: "neutral" },
                                { label: "Current Month ITC", value: `₹${totalITC.toLocaleString()}`, type: "positive" },
                                { label: "ITC Offset Utilized", value: `₹${Math.min(totalITC, totalOutputGST).toLocaleString()}`, type: "negative" },
                                { label: "Closing ITC Ledger", value: `₹${Math.max(0, totalITC - totalOutputGST).toLocaleString()}`, type: "highlight" },
                            ].map((row, idx) => (
                                <div key={idx} className={`flex justify-between p-3.5 rounded-2xl ${row.type === "highlight" ? "bg-teal-50 border border-teal-100" : "bg-gray-50/50"}`}>
                                    <span className="text-xs font-bold text-gray-600">{row.label}</span>
                                    <span className={`text-sm font-black ${row.type === "positive" ? "text-green-600" : row.type === "negative" ? "text-red-500" : row.type === "highlight" ? "text-teal-600" : "text-gray-900"}`}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {activeView === "sales" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead><tr className="bg-gray-50/50 border-b border-gray-100">{["Inv No.", "Date", "Customer", "Taxable", "CGST", "SGST", "IGST", "Final Total"].map(h => <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {salesData.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400 italic text-sm font-semibold">No outward supplies recorded for {month}</td></tr> : salesData.map(r => (
                                    <tr key={r.inv} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-5 py-4 text-xs font-mono font-bold text-teal-600">{r.inv}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{r.date}</td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-900">{r.customer}</td>
                                        <td className="px-5 py-4 text-sm">₹{r.taxable.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-xs font-bold text-gray-400">₹{r.cgst}</td>
                                        <td className="px-5 py-4 text-xs font-bold text-gray-400">₹{r.sgst}</td>
                                        <td className="px-5 py-4 text-xs font-bold text-gray-400">₹{r.igst}</td>
                                        <td className="px-5 py-4 text-sm font-black text-gray-900">₹{r.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeView === "purchase" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead><tr className="bg-gray-50/50 border-b border-gray-100">{["Invoice", "Vendor", "Taxable", "ITC (GST)", "Matching"].map(h => <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {purchaseData.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400 italic text-sm font-semibold">No inward supplies found for {month}</td></tr> : purchaseData.map(r => (
                                    <tr key={r.po} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-mono font-bold">{r.po}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{r.vendor}</p>
                                            <p className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{r.gstin}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm">₹{r.taxable.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm font-black text-blue-600">₹{r.itc.toLocaleString()}</td>
                                        <td className="px-6 py-4"><Badge className={`text-[10px] font-bold uppercase rounded-lg border-0 ${r.matched ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{r.matched ? "Matched" : "Unlinked"}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeView === "returns" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-gray-900">GST Return Registry</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Track filed returns & ARN records</p>
                        </div>
                        {!isFiled && (
                            <Button 
                                size="sm" 
                                onClick={() => {
                                    setSelectedReturn({ type: "GSTR-3B", liability: gstPayable });
                                    setShowFileConfirm(true);
                                }} 
                                className="h-9 px-4 rounded-xl bg-teal-600 text-white text-xs font-normal"
                            >
                                File GSTR-3B Now
                            </Button>
                        )}
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead><tr className="bg-gray-50/50 border-b border-gray-100">{["Period", "Form", "Filed Date", "ARN Number", "Liability"].map(h => <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {gstReturns.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm font-semibold">No filed returns in registry.</td></tr> : gstReturns.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">{r.period}</td>
                                        <td className="px-6 py-4"><Badge className="bg-gray-100 text-gray-700 border-0 text-[10px] font-bold">{r.returnType}</Badge></td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(r.filedDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-xs font-mono font-bold text-teal-600">{r.arnNumber}</td>
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">₹{r.totalLiability?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* GST Filing Confirmation Modal */}
            <Dialog open={showFileConfirm} onOpenChange={setShowFileConfirm}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="w-16 h-16 rounded-3xl bg-teal-50 flex items-center justify-center mb-4 ring-8 ring-teal-50/50 mx-auto">
                            <Scale className="w-8 h-8 text-teal-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-gray-900 text-center">Record GST Filing?</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-2 text-center">
                            You are marking <strong>{selectedReturn?.type}</strong> for <strong>{month}</strong> as filed. This will finalize the tax period in your internal records.
                        </p>
                    </DialogHeader>

                    <div className="bg-gray-50/50 rounded-2xl p-5 my-6 border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tax Liability</span>
                            <span className="text-sm font-black text-orange-600">₹{selectedReturn?.liability.toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                <CheckCircle2 className="w-3 h-3 text-green-500" /> Generates Mock ARN
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                <CheckCircle2 className="w-3 h-3 text-green-500" /> Updates Statutory Registry
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:flex-row flex-col">
                        <Button variant="outline" onClick={() => setShowFileConfirm(false)} className="flex-1 h-12 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest text-gray-500">
                            Cancel
                        </Button>
                        <Button onClick={handleFileReturn} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-500/30">
                            Confirm Filing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default GSTModule;

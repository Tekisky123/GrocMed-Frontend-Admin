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
} from "@/components/ui/dialog";
import { Download, Eye, Search, Printer, Receipt } from "lucide-react";
import { orderApi, Order } from "@/api/orderApi";
import { exportToCSV } from "@/utils/exportUtils";
import { downloadInvoicePDF } from "@/utils/exportPdfUtils";

const SalesRegister = () => {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showInvoice, setShowInvoice] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await orderApi.getAllOrders();
            // Transform orders to strict Sales Register formatting
            const mapped = (res?.orders || res?.data || []).map((order: Order) => {
                const total = order.totalAmount || 0;
                const tax = order.taxAmount || 0;
                const taxable = Number((total - tax).toFixed(2));
                
                return {
                    id: order._id.substring(order._id.length - 8).toUpperCase(),
                    fullId: order._id,
                    date: new Date(order.createdAt).toLocaleDateString(),
                    rawDate: new Date(order.createdAt),
                    customer: order.customer?.name || "Walk-in Customer",
                    gstin: "URD", // Consumer (Unregistered)
                    taxable,
                    cgst: order.cgstAmount || 0,
                    sgst: order.sgstAmount || 0,
                    igst: order.igstAmount || 0,
                    tax,
                    total,
                    method: order.paymentMethod,
                    status: order.paymentStatus === "Completed" ? "Paid" : "Pending",
                    orderStatus: order.orderStatus,
                    items: order.items.reduce((acc, item) => acc + item.quantity, 0),
                    products: order.items
                };
            });
            setInvoices(mapped);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load sales register");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleExport = () => {
        toast.loading("Exporting sales register...", { id: "sales-export" });

        const csvData = invoices.map(i => ({
            Date: i.date,
            "Invoice No": i.id,
            Customer: i.customer,
            GSTIN: i.gstin,
            "Taxable Amount": i.taxable,
            CGST: i.cgst,
            SGST: i.sgst,
            IGST: i.igst,
            Total: i.total,
            Status: i.status
        }));

        exportToCSV(csvData, "Sales_Register");
        toast.success("Sales register exported!", { id: "sales-export" });
    };
    const handlePrint = () => {
        if (!selectedInvoice) return;
        try {
            downloadInvoicePDF(selectedInvoice, 'print');
        } catch (error) {
            console.error("Print Error:", error);
            toast.error("Failed to open print dialog");
        }
    };
    const handleDownloadPDF = () => {
        if (!selectedInvoice) return;
        toast.loading("Generating PDF...", { id: "pdf-dl" });
        try {
            downloadInvoicePDF(selectedInvoice);
            toast.success("Invoice PDF downloaded!", { id: "pdf-dl" });
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error("Failed to generate PDF", { id: "pdf-dl" });
        }
    };
    const handleViewInvoice = (inv: any) => {
        setSelectedInvoice(inv);
        setShowInvoice(true);
    };

    const totalSales = invoices.filter(i => i.status === "Paid").reduce((a, i) => a + (i.total || 0), 0);
    const outputGST = invoices.filter(i => i.status === "Paid").reduce((a, i) => a + (i.cgst || 0) + (i.sgst || 0) + (i.igst || 0), 0);
    const b2b = invoices.filter(i => i.gstin !== "—").length;
    const b2c = invoices.filter(i => i.gstin === "—").length;

    const filtered = invoices.filter(inv => {
        const matchesSearch = !search || inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.includes(search);
        const matchesStatus = filter === "all" || inv.status === filter;
        
        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && inv.rawDate >= new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && inv.rawDate <= end;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const statusColor: Record<string, string> = {
        Paid: "bg-green-50 text-green-700 border-green-200",
        Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
        Cancelled: "bg-red-50 text-red-600 border-red-200",
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Sales Register</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">All GST invoices & output tax summary</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2">
                        <Download className="w-4 h-4" /> GSTR-1 Export
                    </Button>
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-primary">
                    <Receipt className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">Sales Register & Tax Collected</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        This screen lists all sales invoices issued to your customers. 
                        The <strong>Output GST</strong> shown here is the tax you have collected on behalf of the government, which will need to be paid during your monthly filing.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Net Sales (Turnover)", value: `₹${(totalSales).toLocaleString()}`, sub: "Total revenue from paid orders", color: "from-primary to-green-600", bg: "from-green-50", ring: "ring-green-100" },
                    { label: "Output GST (Tax Collected)", value: `₹${outputGST.toLocaleString()}`, sub: "GST collected for govt filing", color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "B2B Sales count", value: b2b.toString(), sub: "GST invoices issued", color: "from-purple-500 to-purple-600", bg: "from-purple-50", ring: "ring-purple-100" },
                    { label: "B2C Sales count", value: b2c.toString(), sub: "Retail/Consumer sales", color: "from-orange-500 to-accent", bg: "from-orange-50", ring: "ring-orange-100" },
                ].map(({ label, value, sub, color, bg, ring }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white ${ring} ring-1`}>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{sub}</p>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search by invoice no. or customer..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-11 rounded-2xl border-gray-100 bg-gray-50/50 w-full" />
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full lg:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">From</span>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 w-36 rounded-xl border-gray-100 bg-gray-50/50 text-xs" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">To</span>
                            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-11 w-36 rounded-xl border-gray-100 bg-gray-50/50 text-xs" />
                        </div>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="h-11 w-36 rounded-xl border-gray-100 bg-gray-50/50 text-xs font-semibold">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Paid">Paid Only</SelectItem>
                                <SelectItem value="Pending">Pending Only</SelectItem>
                            </SelectContent>
                        </Select>
                        {(startDate || endDate || filter !== "all" || search) && (
                            <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); setFilter("all"); setSearch(""); }} className="text-[10px] uppercase font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Invoice Table */}
            <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                <div className="rtable-wrap">
                    <table className="rtable">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50">
                                {["Invoice No.", "Date", "Customer", "GSTIN", "Taxable", "CGST", "SGST", "IGST", "Total", "Method", "Status", ""].map(h => (
                                    <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={12} className="text-center py-8 text-gray-400">Loading sales data...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={12} className="text-center py-8 text-gray-400">No invoices found</td></tr>
                            ) : filtered.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-5 py-4 text-xs font-mono font-bold text-primary">{inv.id}</td>
                                    <td className="px-5 py-4 text-sm text-gray-600">{inv.date}</td>
                                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{inv.customer}</td>
                                    <td className="px-5 py-4 text-xs font-mono text-gray-400">{inv.gstin}</td>
                                    <td className="px-5 py-4 text-sm text-gray-700">₹{inv.taxable.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-sm text-gray-500">₹{inv.cgst}</td>
                                    <td className="px-5 py-4 text-sm text-gray-500">₹{inv.sgst}</td>
                                    <td className="px-5 py-4 text-sm text-gray-500">₹{inv.igst}</td>
                                    <td className="px-5 py-4 text-sm font-bold text-gray-900">₹{inv.total.toLocaleString()}</td>
                                    <td className="px-5 py-4">
                                        <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${inv.method === "COD" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{inv.method || "Online"}</Badge>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${statusColor[inv.status] || statusColor.Pending}`}>{inv.status}</Badge>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(inv)} className="h-8 px-3 rounded-xl text-xs text-primary hover:bg-primary/5 gap-1">
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50/50 border-t border-gray-100">
                                <td colSpan={4} className="px-5 py-4 text-sm font-black text-gray-900 uppercase tracking-widest">Register totals</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{filtered.reduce((a, i) => a + (i.taxable || 0), 0).toLocaleString()}</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{filtered.reduce((a, i) => a + (i.cgst || 0), 0).toFixed(2)}</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{filtered.reduce((a, i) => a + (i.sgst || 0), 0).toFixed(2)}</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{filtered.reduce((a, i) => a + (i.igst || 0), 0).toFixed(2)}</td>
                                <td className="px-5 py-4 text-sm font-black text-primary">₹{filtered.reduce((a, i) => a + (i.total || 0), 0).toLocaleString()}</td>
                                <td colSpan={3}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>

            {/* Invoice Preview Modal */}
            {selectedInvoice && (
                <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
                    <DialogContent className="max-w-2xl rounded-[32px] p-0 border-none shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-br from-primary/10 to-green-600/5 px-8 pt-8 pb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">TAX INVOICE</p>
                                    <h2 className="text-2xl font-black text-gray-900">GrocMed Pvt Ltd</h2>
                                    <p className="text-xs text-gray-500 mt-1">GSTIN: 27AABCG1234M1Z5 | Mumbai, Maharashtra</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{selectedInvoice.id}</p>
                                    <p className="text-xs text-gray-500 mt-1">Date: {selectedInvoice.date}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 pb-8 space-y-5 bg-white">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Details</p>
                                    <p className="text-sm font-black text-gray-900">{selectedInvoice.customer}</p>
                                    <p className="text-xs text-gray-500 mt-1">Status: {selectedInvoice.gstin || "Unregistered (B2C)"}</p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Information</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-gray-900">{selectedInvoice.method || "Online"}</p>
                                        <Badge className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg ${statusColor[selectedInvoice.status] || statusColor.Pending}`}>{selectedInvoice.status}</Badge>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Fulfillment: {selectedInvoice.orderStatus}</p>
                                </div>
                            </div>
                            <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</th>
                                            <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">HSN</th>
                                            <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">GST%</th>
                                            <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedInvoice.products?.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-normal">Qty: {item.quantity} @ ₹{item.price.toLocaleString()}</p>
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-xs font-mono text-gray-500">{item.hsnCode || "—"}</td>
                                                <td className="px-5 py-3.5 text-right text-xs font-semibold text-blue-600">{item.gstRate}%</td>
                                                <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Taxable Value:</span>
                                    <span>₹{selectedInvoice.taxable.toLocaleString()}</span>
                                </div>
                                {selectedInvoice.igst > 0 ? (
                                    <div className="flex justify-between text-xs text-blue-600 font-medium">
                                        <span>IGST Collected:</span>
                                        <span>₹{selectedInvoice.igst.toLocaleString()}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-xs text-blue-600 font-medium">
                                            <span>CGST Collected (9% approx):</span>
                                            <span>₹{selectedInvoice.cgst.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-blue-600 font-medium">
                                            <span>SGST Collected (9% approx):</span>
                                            <span>₹{selectedInvoice.sgst.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Grand Total</span>
                                    <span className="text-xl font-black text-primary">₹{selectedInvoice.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={handlePrint} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest gap-2 bg-white">
                                    <Printer className="w-4 h-4" /> Print Invoice
                                </Button>
                                <Button onClick={handleDownloadPDF} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-green-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-primary/20 gap-2">
                                    <Download className="w-4 h-4" /> Save as PDF
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default SalesRegister;

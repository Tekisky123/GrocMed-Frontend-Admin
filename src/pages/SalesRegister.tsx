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
import { Download, Eye, Search, Printer } from "lucide-react";
import { orderApi, Order } from "@/api/orderApi";
import { exportToCSV } from "@/utils/exportUtils";
import { downloadInvoicePDF } from "@/utils/exportPdfUtils";

const SalesRegister = () => {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
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
                
                // Statutory Derived Math: Calculate Intra-State GST breakdown (18% inclusive assumption for standard inventory)
                const taxable = Number((total / 1.18).toFixed(2));
                const cgst = Number((taxable * 0.09).toFixed(2));
                const sgst = Number((taxable * 0.09).toFixed(2));

                return {
                    id: order._id.substring(0, 8).toUpperCase(),
                    fullId: order._id,
                    date: new Date(order.createdAt).toLocaleDateString(),
                    customer: order.customer?.name || "Walk-in Customer",
                    gstin: "—", // B2C orders usually don't have GSTIN
                    taxable,
                    cgst,
                    sgst,
                    igst: 0,
                    total,
                    method: order.paymentMethod,
                    status: order.paymentStatus === "Completed" ? "Paid" : "Pending",
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

    const totalSales = invoices.filter(i => i.status === "Paid").reduce((a, i) => a + i.total, 0);
    const outputGST = invoices.filter(i => i.status === "Paid").reduce((a, i) => a + i.cgst + i.sgst + i.igst, 0);
    const b2b = invoices.filter(i => i.gstin !== "—").length;
    const b2c = invoices.filter(i => i.gstin === "—").length;

    const filtered = invoices.filter(inv =>
        (!search || inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.includes(search)) &&
        (filter === "all" || inv.status === filter)
    );

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

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Sales (Paid)", value: `₹${(totalSales / 1000).toFixed(1)}k`, sub: "This month", color: "from-primary to-green-600", bg: "from-green-50", ring: "ring-green-100" },
                    { label: "Output GST", value: `₹${outputGST.toLocaleString()}`, sub: "Collected", color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "B2B Invoices", value: b2b.toString(), sub: "Business customers", color: "from-purple-500 to-purple-600", bg: "from-purple-50", ring: "ring-purple-100" },
                    { label: "B2C Invoices", value: b2c.toString(), sub: "Retail customers", color: "from-orange-500 to-accent", bg: "from-orange-50", ring: "ring-orange-100" },
                ].map(({ label, value, sub, color, bg, ring }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white ${ring} ring-1`}>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                        <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search by invoice no. or customer..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-11 rounded-2xl border-gray-100 bg-gray-50/50" />
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="h-11 w-44 rounded-2xl border-gray-100 bg-gray-50/50 text-sm">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
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
                                <td colSpan={4} className="px-5 py-4 text-sm font-black text-gray-900">Totals</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{invoices.reduce((a, i) => a + i.taxable, 0).toLocaleString()}</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{invoices.reduce((a, i) => a + i.cgst, 0).toFixed(0)}</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{invoices.reduce((a, i) => a + i.sgst, 0).toFixed(0)}</td>
                                <td className="px-5 py-4 text-sm font-black text-gray-900">₹{invoices.reduce((a, i) => a + i.igst, 0)}</td>
                                <td className="px-5 py-4 text-sm font-black text-primary">₹{invoices.reduce((a, i) => a + i.total, 0).toLocaleString()}</td>
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
                        <div className="px-8 pb-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedInvoice.customer}</p>
                                    <p className="text-xs text-gray-500 mt-1">GSTIN: {selectedInvoice.gstin}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedInvoice.method || "Online"}</p>
                                    <Badge className={`mt-1 text-xs ${statusColor[selectedInvoice.status] || statusColor.Pending}`}>{selectedInvoice.status}</Badge>
                                </div>
                            </div>
                            <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {["Product", "Taxable (18% inclusive)", "Amount"].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.products?.map((item: any, idx: number) => (
                                            <tr key={idx} className="border-t border-gray-100">
                                                <td className="px-4 py-3 text-gray-900 font-medium">{item.name} x{item.quantity}</td>
                                                <td className="px-4 py-3 text-gray-500">₹{(item.price / 1.18 * item.quantity).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-gray-900 font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        )) || (
                                                <tr className="border-t border-gray-100">
                                                    <td className="px-4 py-3 text-gray-900 font-medium">{selectedInvoice.items} items ordered</td>
                                                    <td className="px-4 py-3 text-gray-700">₹{selectedInvoice.taxable}</td>
                                                    <td className="px-4 py-3 font-bold text-gray-900">₹{selectedInvoice.total}</td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xl font-black text-gray-900">Grand Total: <span className="text-primary">₹{selectedInvoice.total.toLocaleString()}</span></p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handlePrint} className="h-10 px-4 rounded-xl gap-2 text-xs"><Printer className="w-4 h-4" /> Print</Button>
                                    <Button size="sm" onClick={handleDownloadPDF} className="h-10 px-4 rounded-xl bg-gradient-to-r from-primary to-green-600 text-white gap-2 text-xs"><Download className="w-4 h-4" /> Download PDF</Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default SalesRegister;
